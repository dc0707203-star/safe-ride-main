-- Migration: Add DELETE policy for FCM tokens
-- Date: February 4, 2026
-- Purpose: Allow users and admins to delete their FCM tokens on logout

-- Allow users to delete their own FCM tokens
CREATE POLICY "Users can delete their own FCM tokens"
  ON public.push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow admins to delete any FCM token
CREATE POLICY "Admins can delete any FCM token"
  ON public.push_tokens
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
