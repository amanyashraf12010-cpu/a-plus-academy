-- =========================================================================
-- Migration: Individual Lesson Subscriptions, RLS Policies & Video Access
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

-- 6. Add / Update RLS Policies for lesson_access
DROP POLICY IF EXISTS "Users can view their own lesson access" ON public.lesson_access;
CREATE POLICY "Users can view their own lesson access"
  ON public.lesson_access
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated users and admin can manage lesson access" ON public.lesson_access;
CREATE POLICY "Authenticated users and admin can manage lesson access"
  ON public.lesson_access
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Fix RLS on public.lessons table
-- Allow public & students to view lesson metadata (titles, descriptions, order, prices, attachments)
-- The actual video streaming URL is strictly secured by get_lesson_video_url RPC below.
DROP POLICY IF EXISTS "Lessons read policy" ON public.lessons;
CREATE POLICY "Lessons read policy" ON public.lessons
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Lessons admin policy" ON public.lessons;
CREATE POLICY "Lessons admin policy" ON public.lessons
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Update get_lesson_video_url RPC function to support single-lesson access & full subscriptions
CREATE OR REPLACE FUNCTION public.get_lesson_video_url(p_lesson_id uuid)
RETURNS text AS $$
DECLARE
  v_video_url text;
  v_views_count int;
  v_limit int := 4; -- Max video views limit
  v_user_role text;
  v_is_approved boolean;
  v_has_access boolean := false;
BEGIN
  -- 1. Get user details
  SELECT role, is_approved INTO v_user_role, v_is_approved 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- If admin, bypass limits and return url
  IF v_user_role = 'admin' THEN
    SELECT video_url INTO v_video_url FROM public.lessons WHERE id = p_lesson_id;
    RETURN v_video_url;
  END IF;

  -- Verify user is approved profile
  IF v_is_approved = false THEN
    RAISE EXCEPTION 'حسابك غير مفعل بعد من قبل الإدارة.';
  END IF;

  -- 2. Check full course subscription access OR approved single lesson subscription
  IF EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.lessons l ON l.course_id = s.course_id
    WHERE s.user_id = auth.uid()
    AND s.status = 'approved'
    AND (s.lesson_id IS NULL OR s.lesson_id = p_lesson_id)
    AND l.id = p_lesson_id
  ) THEN
    v_has_access := true;
  END IF;

  -- 3. Check individual lesson_access table
  IF NOT v_has_access AND EXISTS (
    SELECT 1 FROM public.lesson_access la
    WHERE la.user_id = auth.uid()
    AND la.lesson_id = p_lesson_id
  ) THEN
    v_has_access := true;
  END IF;

  IF NOT v_has_access THEN
    RAISE EXCEPTION 'غير مصرح لك بمشاهدة هذه الحصة أو لم يتم تفعيل اشتراكك بعد.';
  END IF;

  -- 4. Ensure record exists in video_progress
  INSERT INTO public.video_progress (user_id, lesson_id, views_count)
  VALUES (auth.uid(), p_lesson_id, 0)
  ON CONFLICT (user_id, lesson_id) DO NOTHING;

  -- 5. Check views count
  SELECT views_count INTO v_views_count
  FROM public.video_progress
  WHERE user_id = auth.uid() AND lesson_id = p_lesson_id;

  IF v_views_count >= v_limit THEN
    RAISE EXCEPTION 'لقد تجاوزت الحد الأقصى للمشاهدات المسموح بها لهذا الفيديو (% مرات).', v_limit;
  END IF;

  -- 6. Increment views count
  UPDATE public.video_progress
  SET views_count = views_count + 1
  WHERE user_id = auth.uid() AND lesson_id = p_lesson_id;

  -- 7. Retrieve video path/url
  SELECT video_url INTO v_video_url FROM public.lessons WHERE id = p_lesson_id;
  RETURN v_video_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
