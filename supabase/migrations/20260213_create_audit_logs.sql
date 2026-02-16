-- Create audit_logs table for security compliance and monitoring
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT
  resource TEXT NOT NULL, -- students, drivers, alerts, announcements, etc.
  resource_id UUID,
  details JSONB,
  status TEXT NOT NULL DEFAULT 'success', -- success or failure
  error_message TEXT,
  client_ip VARCHAR(45), -- IPv4 or IPv6
  client_user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_status_idx ON audit_logs(status);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and the user themselves can read their audit logs
CREATE POLICY "Enable read access for admins and self" ON audit_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
    OR auth.uid() = user_id
  );

-- Only authenticated users can insert (via edge functions that verify authorization)
CREATE POLICY "Enable insert for authenticated users" ON audit_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Ensure update timestamp is set
CREATE TRIGGER audit_logs_updated_at_trigger
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE audit_logs IS 'Security audit log for compliance and monitoring. Tracks all sensitive operations across the application.';

-- Create function to clean old audit logs (retention policy: 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (can be triggered by a database job or cron extension)
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_old_audit_logs()');
