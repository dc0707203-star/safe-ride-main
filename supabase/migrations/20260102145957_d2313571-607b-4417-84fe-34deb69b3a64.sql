-- Drop existing restrictive policies and recreate as permissive for drivers table
DROP POLICY IF EXISTS "Admins can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view their own data" ON public.drivers;
DROP POLICY IF EXISTS "Students can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins can insert drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins can update drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins can delete drivers" ON public.drivers;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can view drivers" 
ON public.drivers 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view their own data" 
ON public.drivers 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Students can view drivers" 
ON public.drivers 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'student'));

CREATE POLICY "Admins can insert drivers" 
ON public.drivers 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update drivers" 
ON public.drivers 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete drivers" 
ON public.drivers 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));