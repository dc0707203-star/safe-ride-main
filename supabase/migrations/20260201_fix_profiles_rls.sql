-- Fix infinite recursion in profiles RLS policy
-- This migration disables problematic RLS policies that cause infinite recursion

-- 1. Disable RLS temporarily to fix the issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop any existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.profiles;

-- 3. Re-enable RLS with proper policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create safe policies that don't cause recursion
-- Allow users to view all profiles (for rescue team list)
CREATE POLICY "Profiles viewable by all authenticated users"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 5. Add comment for future reference
COMMENT ON TABLE public.profiles IS 'User profiles - RLS enabled with safe non-recursive policies';
