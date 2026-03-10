-- Add user_type column to announcements table to track if announcement is for drivers or students
alter table public.announcements
add column user_type text check (user_type in ('driver', 'student', 'both')) default 'both';

-- Create index for faster filtering
create index announcements_user_type_idx on public.announcements(user_type);

-- Update existing announcements to 'both' (they'll show to everyone)
update public.announcements
set user_type = 'both'
where user_type is null;

-- Make column not nullable after migration
alter table public.announcements
alter column user_type set not null;
