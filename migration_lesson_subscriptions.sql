-- =========================================================================
-- Migration: Individual Lesson Subscriptions & Access Control
-- A+ Academy Platform
-- =========================================================================

-- 1. Add subscription_type to courses table ('full', 'lessons', 'both')
-- Existing courses automatically default to 'full'
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS subscription_type text DEFAULT 'full';

-- 2. Add price, description, duration to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS duration text;

-- 3. Add lesson_id foreign key to subscriptions table
-- NULL means full-course subscription. Non-null means single-lesson subscription.
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE;

-- 4. Create lesson_access table for instantaneous and direct lesson access lookups
CREATE TABLE IF NOT EXISTS public.lesson_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- 5. Enable RLS on lesson_access
ALTER TABLE public.lesson_access ENABLE ROW LEVEL SECURITY;

-- 6. Add RLS Policies for lesson_access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lesson_access' AND policyname = 'Users can view their own lesson access'
  ) THEN
    CREATE POLICY "Users can view their own lesson access"
      ON public.lesson_access
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lesson_access' AND policyname = 'Authenticated users and admin can manage lesson access'
  ) THEN
    CREATE POLICY "Authenticated users and admin can manage lesson access"
      ON public.lesson_access
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
