-- =========================================================================
-- Migration: Add video_verified column to public.lessons table
-- Description: Tracks whether an admin has previewed and confirmed the video.
-- =========================================================================

-- 1. Add video_verified column if not exists
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_verified boolean DEFAULT false;

-- 2. Add an index for quick queries if needed
CREATE INDEX IF NOT EXISTS idx_lessons_video_verified ON public.lessons(video_verified);

-- 3. Comment on column
COMMENT ON COLUMN public.lessons.video_verified IS 'Indicates whether the video URL was previewed and confirmed by admin';
