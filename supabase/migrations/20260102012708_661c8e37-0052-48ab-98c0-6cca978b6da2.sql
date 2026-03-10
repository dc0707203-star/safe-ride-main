-- Allow admins to delete students (for rejecting registrations)
CREATE POLICY "Admins can delete students" 
ON public.students 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));