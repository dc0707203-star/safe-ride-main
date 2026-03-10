-- Drop existing restrictive policies and recreate as permissive for alerts table
DROP POLICY IF EXISTS "Admins can view all alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Students can create their own alerts" ON public.alerts;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can view all alerts" 
ON public.alerts 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update alerts" 
ON public.alerts 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can create their own alerts" 
ON public.alerts 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM students 
  WHERE students.id = alerts.student_id 
  AND students.user_id = auth.uid()
));

-- Also fix user_roles to be permissive
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own student role or admin manages all" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own student role or admin manages all" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (
  ((auth.uid() = user_id) AND (role = 'student')) 
  OR ((role = 'admin') AND (NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin'))) 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));