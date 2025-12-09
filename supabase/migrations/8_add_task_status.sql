-- Add status column to tasks table
-- Status can be: 'not_started', 'in_progress', or 'completed'
-- Default value is 'not_started' for all existing and new tasks

ALTER TABLE public.tasks
ADD COLUMN status TEXT NOT NULL DEFAULT 'not_started'
CHECK (status IN ('not_started', 'in_progress', 'completed'));

-- Add comment to document the status column
COMMENT ON COLUMN public.tasks.status IS 'Task status: not_started, in_progress, or completed';

