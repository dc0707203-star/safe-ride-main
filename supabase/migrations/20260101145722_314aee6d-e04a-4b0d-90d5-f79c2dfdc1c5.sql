-- Allow users to insert their own role during registration
DROP POLICY IF EXISTS "Allow first admin creation or admin can create roles" ON public.user_roles;

-- Create policy that allows users to insert their own student role or admin to manage all
CREATE POLICY "Users can insert their own student role or admin manages all" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Allow inserting own student role
  (auth.uid() = user_id AND role = 'student')
  -- Or first admin creation
  OR (role = 'admin' AND NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin'))
  -- Or existing admin can create any role
  OR public.has_role(auth.uid(), 'admin')
);