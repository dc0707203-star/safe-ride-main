-- Add rescue and rescue_admin roles to app_role enum
ALTER TYPE public.app_role ADD VALUE 'rescue';
ALTER TYPE public.app_role ADD VALUE 'rescue_admin';
