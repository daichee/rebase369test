-- Add estimate_amount field to board_projects table
ALTER TABLE board_projects ADD COLUMN estimate_amount numeric DEFAULT 0;

-- Add retry_count field to board_sync_log table  
ALTER TABLE board_sync_log ADD COLUMN retry_count int DEFAULT 0;

-- Add index for estimate_amount filtering
CREATE INDEX idx_board_projects_estimate_amount ON board_projects(estimate_amount);