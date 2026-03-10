-- Create FCM tokens table for Capacitor push notifications
create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_type text not null check (user_type in ('driver', 'student')),
  fcm_token text not null,
  device_info jsonb,
  last_verified timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  unique(user_id, user_type)
);

-- Enable RLS
alter table push_tokens enable row level security;

-- RLS Policy: Users can only read their own tokens
create policy "Users can read own FCM tokens"
  on push_tokens for select
  using (auth.uid() = user_id);

-- RLS Policy: Users can insert their own tokens
create policy "Users can insert own FCM tokens"
  on push_tokens for insert
  with check (auth.uid() = user_id);

-- RLS Policy: Users can update their own tokens
create policy "Users can update own FCM tokens"
  on push_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Service role can read all tokens (for Edge Functions)
create policy "Service role can read all FCM tokens"
  on push_tokens for select
  using (auth.role() = 'service_role');

-- Create index for efficient queries
create index idx_push_tokens_user_type on push_tokens(user_id, user_type);
