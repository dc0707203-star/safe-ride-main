-- Add student_full_name column to alerts table to store the student's name at the time of alert
ALTER TABLE public.alerts ADD COLUMN student_full_name text;

-- Add student_id_number column for additional identification
ALTER TABLE public.alerts ADD COLUMN student_id_number text;

-- Add comment for clarity
COMMENT ON COLUMN public.alerts.student_full_name IS 'Student full name captured at alert creation time';
COMMENT ON COLUMN public.alerts.student_id_number IS 'Student ID number captured at alert creation time';
