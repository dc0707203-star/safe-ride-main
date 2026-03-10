-- Add Row-Level Security (RLS) policies for alerts table
-- This prevents unauthorized access to alert data based on user role

-- Ensure RLS is enabled
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Delete existing policies if they exist (for re-application)
DROP POLICY IF EXISTS "alerts_admin_access" ON alerts;
DROP POLICY IF EXISTS "alerts_pnp_access" ON alerts;
DROP POLICY IF EXISTS "alerts_student_access" ON alerts;
DROP POLICY IF EXISTS "alerts_insert_policy" ON alerts;
DROP POLICY IF EXISTS "alerts_update_policy" ON alerts;

-- Policy 1: Admins can see all alerts
CREATE POLICY "alerts_admin_access" ON alerts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Policy 2: PNP officers can only see PNP-related alerts (theft, harassment)
CREATE POLICY "alerts_pnp_access" ON alerts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'pnp'
    )
    AND alert_type IN ('theft', 'harassment')
  );

-- Policy 3: Rescue personnel can only see rescue-related incidents
CREATE POLICY "alerts_rescue_access" ON alerts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'rescue'
    )
    AND alert_type = 'emergency'
  );

-- Policy 4: Students can only see their own alerts
CREATE POLICY "alerts_student_read" ON alerts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'student'
    )
    AND student_id = (
      SELECT id FROM students WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Policy 5: Only admins can insert alerts (through edge functions)
CREATE POLICY "alerts_insert_policy" ON alerts
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Policy 6: Only admins can update alert status
CREATE POLICY "alerts_update_policy" ON alerts
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Policy 7: Only admins can delete alerts
CREATE POLICY "alerts_delete_policy" ON alerts
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );
