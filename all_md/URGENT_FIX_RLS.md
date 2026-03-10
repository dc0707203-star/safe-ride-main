# IMMEDIATE FIX - Run This Now! 🚨

## Step 1: Open Supabase Dashboard
Go to: https://app.supabase.com → Select your project → SQL Editor

## Step 2: Copy This Exact SQL
```sql
-- Disable RLS to break the recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (they're broken)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "users_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "users_update_policy" ON public.profiles;

-- Re-enable RLS with clean slate
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new, SAFE policies that don't cause recursion
CREATE POLICY "allow_read_all_profiles"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "allow_update_own_profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "allow_insert_own_profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
```

## Step 3: Click "Run" Button
- Wait for the green checkmark
- Close SQL Editor

## Step 4: Refresh Your Browser
Press `F5` or `Cmd+Shift+R` (hard refresh)

---

## If That Doesn't Work, Try This Alternative:

### **Disable RLS Completely (Temporary Fix)**
```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

Then test the dashboard. If it works, you know it's an RLS issue. Then apply the policies above.

---

## Verify It Worked

Check the browser console - you should see:
- ❌ NO more "infinite recursion" errors
- ✅ Officers should load from database
- ✅ Empty table shows "Walang officers"

---

## If Still Getting Errors

**Go to:** Supabase Dashboard → Database → Tables → profiles → RLS

**Do this:**
1. Click "Policies" tab
2. Delete ALL policies manually one by one
3. Wait 5 seconds
4. Refresh browser

Then run the SQL above to recreate clean policies.

---

**The key is:** The RLS policies are recursively referencing each other. We need to delete them all and start fresh. ✅
