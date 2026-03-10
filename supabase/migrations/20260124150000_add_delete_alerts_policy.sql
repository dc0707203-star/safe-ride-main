-- First drop the old policy if it exists
DROP POLICY IF EXISTS "Admins can delete alerts" ON public.alerts;

-- Add DELETE policy for alerts table - allow authenticated users who are admins
CREATE POLICY "Allow admins to delete alerts" 
ON public.alerts 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
