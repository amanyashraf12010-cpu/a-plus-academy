-- Add is_visible column to public.courses table if it doesn't exist
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;

-- Update all existing courses to make sure they are visible by default
UPDATE public.courses SET is_visible = true WHERE is_visible IS NULL;
