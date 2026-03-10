# Fix RLS Infinite Recursion Error

## Problem
You're getting this error:
```
infinite recursion detected in policy for relation "profiles"
```

This happens when a Row Level Security (RLS) policy references itself in a way that causes an infinite loop.

## Solution

### 1. **Run the Migration** ⚙️
Apply the migration to fix RLS policies:
```bash
cd /home/jensler/Documents/safe-ride-main
# If using Supabase CLI:
supabase migration up

# Or manually in Supabase dashboard:
# Copy and run: supabase/migrations/20260201_fix_profiles_rls.sql
```

### 2. **What the Migration Does**
- ✅ Disables problematic RLS policies temporarily
- ✅ Drops recursive policies
- ✅ Re-enables RLS with safe, non-recursive policies
- ✅ Allows authenticated users to view profiles (for rescue team list)
- ✅ Allows users to only update their own profile

### 3. **Manual Fix in Supabase Dashboard**

If you can't run the migration, do this:

**Step 1: Go to SQL Editor in Supabase**

**Step 2: Run this:**
```sql
-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create safe policies
CREATE POLICY "Profiles viewable by all authenticated users"
ON public.profiles FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 4. **Test It Works**

After running the migration, the dashboard should:
- ✅ Load officers from profiles table
- ✅ No more 500 errors
- ✅ Show "Walang officers" if table is empty
- ✅ Real-time updates work

---

## If Problem Persists

**Check these things in Supabase Dashboard:**

1. **Go to Authentication → Policies**
   - Look for `profiles` table
   - Check if there are multiple overlapping policies
   - Delete any that reference other policies recursively

2. **Enable Realtime:**
   - Go to Database → Replication
   - Make sure `profiles` table is enabled for realtime

3. **Verify Table Structure:**
   - Go to Tables → profiles
   - Check columns: `id`, `full_name`, `email` exist

---

## Code Changes Made

The dashboard now:
- ✅ Handles fetch errors gracefully
- ✅ Shows empty state if officers can't be loaded
- ✅ Continues working if RLS blocks queries
- ✅ Logs detailed error messages for debugging

Just run the migration and refresh! 🚀
