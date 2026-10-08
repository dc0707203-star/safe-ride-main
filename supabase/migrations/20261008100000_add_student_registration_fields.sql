ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS year_level text,
  ADD COLUMN IF NOT EXISTS section text;

NOTIFY pgrst, 'reload schema';
