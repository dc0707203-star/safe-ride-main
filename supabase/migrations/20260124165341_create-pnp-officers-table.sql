-- Create PNP Officers table
CREATE TABLE IF NOT EXISTS public.pnp_officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_number VARCHAR(50) NOT NULL UNIQUE,
  rank VARCHAR(100) NOT NULL DEFAULT 'Officer',
  station VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_pnp_officers_user_id ON public.pnp_officers(user_id);
CREATE INDEX IF NOT EXISTS idx_pnp_officers_badge_number ON public.pnp_officers(badge_number);

-- Enable RLS on pnp_officers
ALTER TABLE public.pnp_officers ENABLE ROW LEVEL SECURITY;

-- PNP officers can view their own profile
CREATE POLICY "PNP officers can view their own profile"
ON public.pnp_officers
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all PNP officers
CREATE POLICY "Admins can view all PNP officers"
ON public.pnp_officers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can insert PNP officers
CREATE POLICY "Admins can insert PNP officers"
ON public.pnp_officers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update PNP officers
CREATE POLICY "Admins can update PNP officers"
ON public.pnp_officers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can delete PNP officers
CREATE POLICY "Admins can delete PNP officers"
ON public.pnp_officers
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_pnp_officers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_pnp_officers_updated_at ON public.pnp_officers;
CREATE TRIGGER update_pnp_officers_updated_at
  BEFORE UPDATE ON public.pnp_officers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pnp_officers_timestamp();
