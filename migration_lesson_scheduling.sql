-- Add publish_at column to public.lessons table if it doesn't exist
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS publish_at timestamp with time zone;
