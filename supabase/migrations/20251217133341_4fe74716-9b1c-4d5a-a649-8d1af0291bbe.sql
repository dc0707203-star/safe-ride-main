-- Allow admins to manage any profile photos (needed for admin-side student registration)

-- Insert policy
CREATE POLICY "Admins can upload profile photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND public.has_role(auth.uid(), 'admin')
);

-- Update policy
CREATE POLICY "Admins can update profile photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'profile-photos'
  AND public.has_role(auth.uid(), 'admin')
);

-- Delete policy (optional but consistent)
CREATE POLICY "Admins can delete profile photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-photos'
  AND public.has_role(auth.uid(), 'admin')
);
