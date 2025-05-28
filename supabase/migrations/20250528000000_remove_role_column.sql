-- Remove role column from user_profiles table as the application now assumes single admin user
-- Created: 2025-05-28
-- Purpose: Simplify user management to single admin user only

-- Drop the role column and its associated check constraint
ALTER TABLE user_profiles DROP COLUMN IF EXISTS role CASCADE;

-- Update RLS policies to remove role-based restrictions if any exist
-- (Keeping basic user access control but removing admin-specific logic)

-- Add comment to document the change
COMMENT ON TABLE user_profiles IS 'User profiles table - simplified for single admin user application';