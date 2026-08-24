-- 1. Drop existing admin policies for quizzes, questions, options, attempts, answers
DROP POLICY IF EXISTS "Allow admin full access to quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Allow admin full access to questions" ON public.questions;
DROP POLICY IF EXISTS "Allow admin full access to options" ON public.options;
DROP POLICY IF EXISTS "Allow admin full access to attempts" ON public.student_quiz_attempts;
DROP POLICY IF EXISTS "Allow admin full access to answers" ON public.student_answers;

-- 2. Re-create them using the secure and reliable public.is_admin() helper function
CREATE POLICY "Allow admin full access to quizzes" ON public.quizzes
  FOR ALL USING (public.is_admin());

CREATE POLICY "Allow admin full access to questions" ON public.questions
  FOR ALL USING (public.is_admin());

CREATE POLICY "Allow admin full access to options" ON public.options
  FOR ALL USING (public.is_admin());

CREATE POLICY "Allow admin full access to attempts" ON public.student_quiz_attempts
  FOR ALL USING (public.is_admin());

CREATE POLICY "Allow admin full access to answers" ON public.student_answers
  FOR ALL USING (public.is_admin());
