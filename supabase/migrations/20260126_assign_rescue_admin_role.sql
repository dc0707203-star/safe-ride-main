-- Add rescue_admin role to user
INSERT INTO public.user_roles (user_id, role)
VALUES ('a785732d-e104-427c-90d3-0a34624ae1e7', 'rescue_admin')
ON CONFLICT (user_id, role) DO NOTHING;
