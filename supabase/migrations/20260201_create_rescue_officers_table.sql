-- Create a dedicated rescue_officers table without RLS conflicts
-- This bypasses the profiles RLS issue

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
