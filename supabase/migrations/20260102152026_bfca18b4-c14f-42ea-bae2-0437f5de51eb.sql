-- Add agreement_accepted column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS agreement_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS agreement_accepted_at timestamp with time zone;