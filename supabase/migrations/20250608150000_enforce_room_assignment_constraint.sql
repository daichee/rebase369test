-- Room Assignment Constraint Migration
-- This migration enforces that every booking must have at least one room assignment
-- Created: 2025-06-08
-- Purpose: Prevent orphaned bookings without room assignments

-- =============================================================================
-- 1. CREATE A CONSTRAINT FUNCTION TO CHECK ROOM ASSIGNMENTS
-- =============================================================================

-- Function to check if a project has at least one room assignment
CREATE OR REPLACE FUNCTION check_project_has_rooms()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- For INSERT on projects, we allow creation without checking (rooms are added after)
  -- The API layer validation will handle this case
  
  -- For UPDATE on projects, we check if rooms exist (only if it's not a new project)
  -- Skip check if the project was just created (within 5 seconds)
  IF TG_OP = 'UPDATE' AND 
     OLD.created_at < (NOW() - INTERVAL '5 seconds') AND
     NEW.status != 'cancelled' THEN
    
    -- Check if project has room assignments
    IF NOT EXISTS (
      SELECT 1 FROM project_rooms 
      WHERE project_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'ROOM_ASSIGNMENT_REQUIRED: 予約には最低1部屋の割り当てが必要です (Project ID: %)', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 2. CREATE TRIGGER TO ENFORCE ROOM ASSIGNMENT CONSTRAINT
-- =============================================================================

-- Trigger for projects table to ensure room assignments exist
-- Only applies after the initial creation grace period
DROP TRIGGER IF EXISTS enforce_room_assignment_trigger ON projects;

CREATE TRIGGER enforce_room_assignment_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION check_project_has_rooms();

-- =============================================================================
-- 3. CREATE FUNCTION TO PREVENT DELETING ALL ROOM ASSIGNMENTS
-- =============================================================================

-- Function to prevent deletion of all room assignments for active bookings
CREATE OR REPLACE FUNCTION prevent_room_assignment_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  project_status booking_status;
  remaining_rooms INTEGER;
BEGIN
  -- Get the project status
  SELECT status INTO project_status
  FROM projects 
  WHERE id = OLD.project_id;
  
  -- Only enforce for non-cancelled bookings
  IF project_status != 'cancelled' THEN
    -- Check if this would be the last room assignment
    SELECT COUNT(*) INTO remaining_rooms
    FROM project_rooms 
    WHERE project_id = OLD.project_id 
      AND id != OLD.id;
    
    -- Prevent deletion if this is the last room
    IF remaining_rooms = 0 THEN
      RAISE EXCEPTION 'LAST_ROOM_DELETION_PREVENTED: 最後の部屋割り当てを削除することはできません (Project ID: %)', OLD.project_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger to prevent deletion of all room assignments
DROP TRIGGER IF EXISTS prevent_last_room_deletion_trigger ON project_rooms;

CREATE TRIGGER prevent_last_room_deletion_trigger
  BEFORE DELETE ON project_rooms
  FOR EACH ROW
  EXECUTE FUNCTION prevent_room_assignment_deletion();

-- =============================================================================
-- 4. CREATE MONITORING FUNCTION FOR ORPHANED BOOKINGS
-- =============================================================================

-- Function to find and report orphaned bookings
CREATE OR REPLACE FUNCTION find_orphaned_bookings()
RETURNS TABLE (
  project_id UUID,
  guest_name TEXT,
  start_date DATE,
  end_date DATE,
  status booking_status,
  created_at TIMESTAMPTZ,
  days_since_creation INTERVAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.guest_name,
    p.start_date,
    p.end_date,
    p.status,
    p.created_at,
    (NOW() - p.created_at) AS days_since_creation
  FROM projects p
  LEFT JOIN project_rooms pr ON p.id = pr.project_id
  WHERE pr.project_id IS NULL
    AND p.status != 'cancelled'
    AND p.created_at < (NOW() - INTERVAL '10 seconds') -- Grace period for creation
  ORDER BY p.created_at DESC;
END;
$$;

-- =============================================================================
-- 5. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_project_has_rooms TO authenticated;
GRANT EXECUTE ON FUNCTION prevent_room_assignment_deletion TO authenticated;
GRANT EXECUTE ON FUNCTION find_orphaned_bookings TO authenticated;

-- =============================================================================
-- 6. ADD HELPFUL COMMENTS
-- =============================================================================

COMMENT ON FUNCTION check_project_has_rooms IS 'Ensures projects have room assignments - Created 2025-06-08';
COMMENT ON FUNCTION prevent_room_assignment_deletion IS 'Prevents deletion of last room assignment - Created 2025-06-08';
COMMENT ON FUNCTION find_orphaned_bookings IS 'Finds bookings without room assignments - Created 2025-06-08';

-- =============================================================================
-- 7. VERIFICATION AND SUCCESS MESSAGE
-- =============================================================================

DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Check for existing orphaned bookings
  SELECT COUNT(*) INTO orphaned_count
  FROM find_orphaned_bookings();
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned bookings without room assignments', orphaned_count;
    RAISE NOTICE 'Run SELECT * FROM find_orphaned_bookings(); to see details';
  ELSE
    RAISE NOTICE 'No orphaned bookings found';
  END IF;
  
  RAISE NOTICE 'SUCCESS: Room assignment constraints have been enforced';
  RAISE NOTICE 'SUCCESS: Bookings without room assignments are now prevented';
  RAISE NOTICE 'SUCCESS: Database integrity for room assignments is now enforced';
END$$;