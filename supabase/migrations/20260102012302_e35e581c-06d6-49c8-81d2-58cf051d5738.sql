-- Add is_approved column for admin approval flow
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Drop existing restrictive policies and create permissive ones
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Students can insert their own data" ON public.students;
DROP POLICY IF EXISTS "Admins can update students" ON public.students;
DROP POLICY IF EXISTS "Students can update their own data" ON public.students;

-- Create PERMISSIVE policies (default behavior, using OR logic)
CREATE POLICY "Admins can view all students" 
ON public.students 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view their own data" 
ON public.students 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Students can insert their own data" 
ON public.students 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert students" 
ON public.students 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update students" 
ON public.students 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can update their own data" 
ON public.students 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);