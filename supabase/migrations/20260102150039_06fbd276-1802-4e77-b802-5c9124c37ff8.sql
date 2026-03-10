-- Drop existing restrictive policies and recreate as permissive for trips table
DROP POLICY IF EXISTS "Admins can view all trips" ON public.trips;
DROP POLICY IF EXISTS "Students can view their own trips" ON public.trips;
DROP POLICY IF EXISTS "Students can create trips" ON public.trips;
DROP POLICY IF EXISTS "Students can update their own trips" ON public.trips;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can view all trips" 
ON public.trips 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view their own trips" 
ON public.trips 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM students 
  WHERE students.id = trips.student_id 
  AND students.user_id = auth.uid()
));

CREATE POLICY "Students can create trips" 
ON public.trips 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM students 
  WHERE students.id = trips.student_id 
  AND students.user_id = auth.uid()
));

CREATE POLICY "Students can update their own trips" 
ON public.trips 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM students 
  WHERE students.id = trips.student_id 
  AND students.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM students 
  WHERE students.id = trips.student_id 
  AND students.user_id = auth.uid()
));