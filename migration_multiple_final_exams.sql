-- =========================================================================
-- Migration: Multiple Final Exams per Course Support
-- =========================================================================
-- The platform schema already associates quizzes, questions, and attempts 
-- by unique quiz_id, allowing unlimited independent Final Exams per Course.
-- 
-- This script ensures all optional helper columns (description, etc.) exist
-- without modifying or deleting any existing production records.
-- =========================================================================

-- 1. Ensure quizzes table has description column if needed
ALTER TABLE public.quizzes 
  ADD COLUMN IF NOT EXISTS description text;

-- 2. Verify foreign keys and cascade rules remain intact
-- quizzes -> courses(id)
-- questions -> quizzes(id)
-- options -> questions(id)
-- student_quiz_attempts -> quizzes(id)
-- student_answers -> student_quiz_attempts(id)

-- 3. Confirm RLS policies allow reading and managing multiple final exams
-- Public/Student read access policy:
DROP POLICY IF EXISTS "Allow public read access to active quizzes" ON public.quizzes;
CREATE POLICY "Allow public read access to active quizzes" ON public.quizzes
  FOR SELECT USING (is_active = true);

-- Admin full access policy:
DROP POLICY IF EXISTS "Allow admin full access to quizzes" ON public.quizzes;
CREATE POLICY "Allow admin full access to quizzes" ON public.quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
