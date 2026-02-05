-- Create announcements table for driver dashboard
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Add active column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='announcements' AND column_name='active') THEN
    ALTER TABLE announcements ADD COLUMN active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admins to create announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admins to update announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admins to delete announcements" ON announcements;

-- Allow anyone to view active announcements
CREATE POLICY "Allow public read announcements" ON announcements
  FOR SELECT
  USING (active = TRUE);

-- Allow authenticated users (admins) to create/update/delete announcements
CREATE POLICY "Allow admins to create announcements" ON announcements
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to update announcements" ON announcements
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to delete announcements" ON announcements
  FOR DELETE
  USING (auth.role() = 'authenticated');
