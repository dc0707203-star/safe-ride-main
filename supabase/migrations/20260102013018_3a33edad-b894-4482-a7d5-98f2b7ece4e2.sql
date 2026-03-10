-- Allow students to update their own trips (for ending trips)
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

-- Enable realtime for trips table
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;