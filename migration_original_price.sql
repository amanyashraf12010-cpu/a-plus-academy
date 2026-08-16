-- Add original_price column to public.courses if it doesn't exist
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS original_price numeric(10, 2) DEFAULT NULL;
