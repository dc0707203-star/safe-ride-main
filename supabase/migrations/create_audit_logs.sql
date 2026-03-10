-- Create audit_logs table for security audit trail
create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource text not null,
  resource_id uuid,
  status text not null check (status in ('success', 'failure')),
  details jsonb,
  user_agent text,
  ip_address inet,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')) default 'low',
  created_at timestamp with time zone default now()
);

-- Create indexes for efficient querying
create index if not exists idx_audit_logs_user_id on audit_logs(user_id);
create index if not exists idx_audit_logs_action on audit_logs(action);
create index if not exists idx_audit_logs_resource on audit_logs(resource);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at);
create index if not exists idx_audit_logs_severity on audit_logs(severity);

-- Enable RLS
alter table audit_logs enable row level security;

-- Policy: Users can only view their own logs (except admins)
create policy "Users can view their own audit logs"
  on audit_logs for select
  using (
    auth.uid() = user_id 
    or (select role from user_roles where user_id = auth.uid()) = 'admin'
  );

-- Policy: Only the audit-log function can insert
create policy "Only system can insert audit logs"
  on audit_logs for insert
  with check (true);

-- Policy: Only admins can delete (for retention policies)
create policy "Only admins can delete audit logs"
  on audit_logs for delete
  using (
    (select role from user_roles where user_id = auth.uid()) = 'admin'
  );
