-- Fix RLS on alerts table - enable RLS and create permissive policies
-- First, enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read alerts" ON public.alerts;
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Authenticated users can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can view all alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Students can create their own alerts" ON public.alerts;

-- Create permissive policies for all authenticated users
CREATE POLICY "Anyone authenticated can read alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING (true);

-- Keep INSERT restricted to authenticated users
CREATE POLICY "Authenticated users can insert alerts"
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow UPDATE for authenticated users
CREATE POLICY "Authenticated users can update alerts"
ON public.alerts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
