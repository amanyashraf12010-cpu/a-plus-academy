-- =========================================================================
-- Migration: Course Access Management System (إدارة صلاحيات الكورسات)
-- A+ Academy Platform
-- =========================================================================

-- 1. Create course_access table
CREATE TABLE IF NOT EXISTS public.course_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  access_type text NOT NULL DEFAULT 'manual' CHECK (access_type IN ('payment', 'manual', 'free', 'transfer')),
  granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_student_course_access UNIQUE (student_id, course_id)
);

-- 2. Create indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_course_access_student ON public.course_access(student_id);
CREATE INDEX IF NOT EXISTS idx_course_access_course ON public.course_access(course_id);
CREATE INDEX IF NOT EXISTS idx_course_access_status ON public.course_access(status);
CREATE INDEX IF NOT EXISTS idx_course_access_lookup ON public.course_access(student_id, course_id, status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.course_access ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Admins have full access to course_access" ON public.course_access;
CREATE POLICY "Admins have full access to course_access"
  ON public.course_access
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'assistant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'assistant')
    )
  );

DROP POLICY IF EXISTS "Students can view their own course_access" ON public.course_access;
CREATE POLICY "Students can view their own course_access"
  ON public.course_access
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- 5. Update get_lesson_video_url RPC to recognize course_access table
CREATE OR REPLACE FUNCTION public.get_lesson_video_url(p_lesson_id uuid)
RETURNS text AS $$
DECLARE
  v_video_url text;
  v_views_count int;
  v_limit int := 4;
  v_user_role text;
  v_is_approved boolean;
  v_has_access boolean := false;
BEGIN
  -- 1. Get user details
  SELECT role, is_approved INTO v_user_role, v_is_approved 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- If admin or teacher, bypass limits and return url
  IF v_user_role IN ('admin', 'teacher') THEN
    SELECT video_url INTO v_video_url FROM public.lessons WHERE id = p_lesson_id;
    RETURN v_video_url;
  END IF;

  -- Verify user is approved profile
  IF v_is_approved = false THEN
    RAISE EXCEPTION 'حسابك غير مفعل بعد من قبل الإدارة.';
  END IF;

  -- 2. Check course_access table for active access
  IF EXISTS (
    SELECT 1 FROM public.course_access ca
    JOIN public.lessons l ON l.course_id = ca.course_id
    WHERE ca.student_id = auth.uid()
    AND ca.status = 'active'
    AND l.id = p_lesson_id
  ) THEN
    v_has_access := true;
  END IF;

  -- 3. Check full course subscription access OR approved single lesson subscription (unless revoked in course_access)
  IF NOT v_has_access AND EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.lessons l ON l.course_id = s.course_id
    WHERE s.user_id = auth.uid()
    AND s.status = 'approved'
    AND (s.lesson_id IS NULL OR s.lesson_id = p_lesson_id)
    AND l.id = p_lesson_id
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.course_access ca
      JOIN public.lessons l ON l.course_id = ca.course_id
      WHERE ca.student_id = auth.uid()
      AND ca.status = 'revoked'
      AND l.id = p_lesson_id
    ) THEN
      v_has_access := true;
    END IF;
  END IF;

  -- 4. Check individual lesson_access table
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

  -- 5. Ensure record exists in video_progress (without modifying views_count)
  INSERT INTO public.video_progress (user_id, lesson_id, views_count, watched_ranges, total_unique_seconds, last_position, video_duration)
  VALUES (auth.uid(), p_lesson_id, 0, '[]'::jsonb, 0, 0, 0)
  ON CONFLICT (user_id, lesson_id) DO NOTHING;

  -- 6. Check views count
  SELECT views_count INTO v_views_count
  FROM public.video_progress
  WHERE user_id = auth.uid() AND lesson_id = p_lesson_id;

  IF v_views_count >= v_limit THEN
    RAISE EXCEPTION 'لقد تجاوزت الحد الأقصى للمشاهدات المسموح بها لهذا الفيديو (% مرات).', v_limit;
  END IF;

  -- 7. Retrieve video path/url
  SELECT video_url INTO v_video_url FROM public.lessons WHERE id = p_lesson_id;
  RETURN v_video_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
