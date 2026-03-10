-- Update user_roles RLS to allow inserting the first admin
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Recreate the view policy
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow inserting admin role ONLY if no admin exists yet OR if user is already an admin
CREATE POLICY "Allow first admin creation or admin can create roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  -- Allow if this is the first admin (no admins exist)
  (role = 'admin' AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'))
  OR
  -- Allow if the user making the request is already an admin
  (has_role(auth.uid(), 'admin'))
);

-- Allow admins to update roles
CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete roles
CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));