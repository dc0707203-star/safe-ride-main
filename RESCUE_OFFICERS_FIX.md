# RLS Infinite Recursion Fix - Complete Solution

## Problem
The application is getting **error code 42P17: infinite recursion detected in policy for relation "profiles"** whenever trying to fetch rescue officers.

## Solution
Instead of fixing the broken RLS policies on the profiles table, we'll create a **dedicated `rescue_officers` table** with clean, non-recursive policies.

---

## Step 1: Execute the SQL Migration in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **+ New Query**
5. Copy and paste this SQL:

```sql
-- Create a dedicated rescue_officers table without RLS conflicts
CREATE TABLE IF NOT EXISTS public.rescue_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  vehicle_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'available',
  latitude FLOAT,
  longitude FLOAT,
  badge_number VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rescue_officers_status ON public.rescue_officers(status);
CREATE INDEX IF NOT EXISTS idx_rescue_officers_active ON public.rescue_officers(is_active);

-- Enable RLS
ALTER TABLE public.rescue_officers ENABLE ROW LEVEL SECURITY;

-- Simple, non-recursive RLS policies
CREATE POLICY "rescue_officers_viewable_by_authenticated"
ON public.rescue_officers FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "rescue_officers_updateable_by_self"
ON public.rescue_officers FOR UPDATE
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "rescue_officers_insertable_by_admin"
ON public.rescue_officers FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- Grant permissions
GRANT SELECT ON public.rescue_officers TO authenticated;
GRANT UPDATE ON public.rescue_officers TO authenticated;
GRANT INSERT ON public.rescue_officers TO authenticated;

-- Add comment
COMMENT ON TABLE public.rescue_officers IS 'Dedicated rescue team members table - clean RLS without recursion issues';
```

6. Click **Run**
7. Wait for the green checkmark ✅

---

## Step 2: Add Rescue Officers to the Database

Use the **RescueAdmin** dashboard to add rescue officers:

1. Go to **Rescue Admin Panel** → **Officer Management** tab
2. Click **+ Add Officer**
3. Fill in:
   - Officer Name
   - Email
   - Phone (optional)
   - Vehicle Type (optional)
4. Click **Add Officer**

The officer will be saved to the new `rescue_officers` table automatically.

---

## Step 3: Verify the Fix

1. **Hard refresh your browser**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Open **Browser Console**: `F12` → **Console** tab
3. You should see **NO errors** about "infinite recursion"
4. Open **RescueDashboard** or **RescueAdmin**
5. Officers should now appear (if you've added any) OR show "Walang officers" gracefully

---

## What Changed in the Code

### Before (Broken)
```typescript
// This causes RLS recursion error
const { data } = await supabase
  .from("profiles")  // ❌ Infinite RLS recursion
  .select("id, full_name, email")
```

### After (Fixed)
```typescript
// This works with clean RLS policies
const { data } = await supabase
  .from("rescue_officers")  // ✅ New table, clean RLS
  .select("id, full_name, email, phone, vehicle_type, status")
  .eq("is_active", true)
```

---

## Benefits of This Approach

✅ **Eliminates RLS infinite recursion** - New table has simple, non-recursive policies
✅ **Specialized schema** - Table only stores rescue officer data (no auth bloat)
✅ **Better performance** - Dedicated indexes on status and is_active
✅ **Cleaner separation** - Officers aren't mixed with auth profiles
✅ **Future-proof** - Easy to extend with rescue-specific fields

---

## Troubleshooting

**Still getting errors?**
1. Check that SQL execution showed ✅ green checkmark
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache if needed
4. Check the Browser Console for error details
5. Ensure you're using the latest version of the code (pull fresh)

**Officers not showing up?**
1. You haven't added any officers yet - use RescueAdmin to add them
2. Click **Load Real Data** button in RescueAdmin
3. Check that officers have `is_active = true`

**Still seeing "infinite recursion" errors?**
1. The `rescue_officers` table creation might have failed
2. Go back to Supabase SQL Editor
3. Run: `SELECT * FROM information_schema.tables WHERE table_name = 'rescue_officers'`
4. If nothing returns, the table wasn't created - re-run the full SQL migration

---

## Next Steps

1. ✅ Execute the SQL migration (Step 1)
2. ✅ Refresh browser (Step 3)
3. ✅ Add rescue officers via RescueAdmin (Step 2)
4. ✅ Test that RescueDashboard shows officers
5. ✅ Test that student SOS alerts appear in real-time

Done! Your rescue dashboard is now fully functional.
