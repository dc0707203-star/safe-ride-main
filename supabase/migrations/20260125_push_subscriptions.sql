-- Create push_subscriptions table for Web Push Notifications
create table public.push_subscriptions (
  id bigserial primary key,
  user_id uuid not null,
  user_type text not null check (user_type in ('driver', 'student')),
  subscription jsonb not null,
  created_at timestamp with time zone default now(),
  last_verified timestamp with time zone default now(),
  unique(user_id, user_type)
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Create index for faster lookups
create index push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
create index push_subscriptions_user_type_idx on public.push_subscriptions(user_type);

-- RLS Policy: Users can only manage their own subscriptions
create policy "Users can view and manage their own subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Service role can insert/update subscriptions
create policy "Service can manage subscriptions"
  on public.push_subscriptions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Allow anonymous/public to insert (for initial subscription)
create policy "Allow insert for authenticated users"
  on public.push_subscriptions
  for insert
  with check (auth.role() = 'authenticated');

