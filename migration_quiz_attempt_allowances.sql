-- =========================================================================
-- Migration: Quiz Attempt Allowances (منح محاولات إضافية للطلاب في الامتحانات)
-- A+ Academy Platform
-- =========================================================================

-- 1. Create quiz_attempt_allowances table
CREATE TABLE IF NOT EXISTS public.quiz_attempt_allowances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extra_attempts integer NOT NULL DEFAULT 1,
  granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_quiz_user_allowance UNIQUE (quiz_id, user_id)
);

-- 2. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_allowances_lookup 
  ON public.quiz_attempt_allowances(quiz_id, user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.quiz_attempt_allowances ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Admins have full access to quiz_attempt_allowances" ON public.quiz_attempt_allowances;
CREATE POLICY "Admins have full access to quiz_attempt_allowances"
  ON public.quiz_attempt_allowances
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

DROP POLICY IF EXISTS "Students can view their own attempt allowances" ON public.quiz_attempt_allowances;
CREATE POLICY "Students can view their own attempt allowances"
  ON public.quiz_attempt_allowances
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
