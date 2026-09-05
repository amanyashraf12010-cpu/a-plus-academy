-- =========================================================================
-- Migration: Teacher Assistant (مساعدة مدرس) Role, Relations & RLS Policies
-- =========================================================================

-- 1. Add teacher_id column to profiles if not exists
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL;

-- 2. Update role check constraint on profiles to allow 'assistant'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_role;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'admin', 'assistant'));

-- 3. Update auth trigger to support teacher_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    is_approved,
    phone,
    parent_phone,
    parent_job,
    school,
    governorate,
    gender,
    education_system,
    track,
    grade,
    teacher_id
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE((new.raw_user_meta_data->>'is_approved')::boolean, CASE WHEN (new.raw_user_meta_data->>'role') IN ('admin', 'assistant') THEN true ELSE false END),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'parent_phone', ''),
    new.raw_user_meta_data->>'parent_job',
    new.raw_user_meta_data->>'school',
    new.raw_user_meta_data->>'governorate',
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'education_system',
    new.raw_user_meta_data->>'track',
    new.raw_user_meta_data->>'grade',
    CASE 
      WHEN new.raw_user_meta_data->>'teacher_id' IS NOT NULL AND (new.raw_user_meta_data->>'teacher_id') != '' 
      THEN (new.raw_user_meta_data->>'teacher_id')::uuid 
      ELSE NULL 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Helper Security Functions (RLS Bypassing)
CREATE OR REPLACE FUNCTION public.is_assistant()
RETURNS boolean AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'assistant'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_assistant_teacher_id()
RETURNS uuid AS $$
DECLARE
  v_teacher_id uuid;
BEGIN
  SELECT teacher_id INTO v_teacher_id
  FROM public.profiles
  WHERE id = auth.uid() AND role = 'assistant';
  RETURN v_teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies for Assistant Role

-- Profiles Table: Assistant can view their own profile and students subscribed to their teacher's courses
DROP POLICY IF EXISTS "Assistants can view relevant student profiles" ON public.profiles;
CREATE POLICY "Assistants can view relevant student profiles" ON public.profiles
  FOR SELECT USING (
    public.is_assistant() AND (
      auth.uid() = id OR
      EXISTS (
        SELECT 1 FROM public.subscriptions s
        JOIN public.courses c ON c.id = s.course_id
        WHERE s.user_id = profiles.id
        AND c.teacher_id = public.get_assistant_teacher_id()
      )
    )
  );

-- Courses Table: Assistant can select and manage their teacher's courses
DROP POLICY IF EXISTS "Assistants can view their teacher courses" ON public.courses;
CREATE POLICY "Assistants can view their teacher courses" ON public.courses
  FOR SELECT USING (
    public.is_assistant() AND teacher_id = public.get_assistant_teacher_id()
  );

-- Lessons Table: Assistant can view lessons for their teacher's courses (SELECT only)
DROP POLICY IF EXISTS "Assistants can manage their teacher lessons" ON public.lessons;
DROP POLICY IF EXISTS "Assistants can view their teacher lessons" ON public.lessons;
CREATE POLICY "Assistants can view their teacher lessons" ON public.lessons
  FOR SELECT USING (
    public.is_assistant() AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = lessons.course_id AND c.teacher_id = public.get_assistant_teacher_id()
    )
  );

-- Quizzes Table: Assistant can view quizzes for their teacher's courses (SELECT only)
DROP POLICY IF EXISTS "Assistants can manage their teacher quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Assistants can view their teacher quizzes" ON public.quizzes;
CREATE POLICY "Assistants can view their teacher quizzes" ON public.quizzes
  FOR SELECT USING (
    public.is_assistant() AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = quizzes.course_id AND c.teacher_id = public.get_assistant_teacher_id()
    )
  );

-- Questions Table: Assistant can view questions for their teacher's quizzes (SELECT only)
DROP POLICY IF EXISTS "Assistants can manage their teacher questions" ON public.questions;
DROP POLICY IF EXISTS "Assistants can view their teacher questions" ON public.questions;
CREATE POLICY "Assistants can view their teacher questions" ON public.questions
  FOR SELECT USING (
    public.is_assistant() AND EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.courses c ON c.id = q.course_id
      WHERE q.id = questions.quiz_id AND c.teacher_id = public.get_assistant_teacher_id()
    )
  );

-- Options Table: Assistant can view options for their teacher's questions (SELECT only)
DROP POLICY IF EXISTS "Assistants can manage their teacher options" ON public.options;
DROP POLICY IF EXISTS "Assistants can view their teacher options" ON public.options;
CREATE POLICY "Assistants can view their teacher options" ON public.options
  FOR SELECT USING (
    public.is_assistant() AND EXISTS (
      SELECT 1 FROM public.questions qu
      JOIN public.quizzes q ON q.id = qu.quiz_id
      JOIN public.courses c ON c.id = q.course_id
      WHERE qu.id = options.question_id AND c.teacher_id = public.get_assistant_teacher_id()
    )
  );

-- Subscriptions Table: Assistant can view subscriptions for their teacher's courses
DROP POLICY IF EXISTS "Assistants can view their teacher subscriptions" ON public.subscriptions;
CREATE POLICY "Assistants can view their teacher subscriptions" ON public.subscriptions
  FOR SELECT USING (
    public.is_assistant() AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = subscriptions.course_id AND c.teacher_id = public.get_assistant_teacher_id()
    )
  );

-- Video Progress Table: Assistant can view video progress for their teacher's lessons
DROP POLICY IF EXISTS "Assistants can view their teacher video progress" ON public.video_progress;
CREATE POLICY "Assistants can view their teacher video progress" ON public.video_progress
  FOR SELECT USING (
    public.is_assistant() AND EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = video_progress.lesson_id AND c.teacher_id = public.get_assistant_teacher_id()
    )
  );

-- Student Quiz Attempts Table: Assistant can view attempts for their teacher's quizzes
DROP POLICY IF EXISTS "Assistants can view their teacher quiz attempts" ON public.student_quiz_attempts;
CREATE POLICY "Assistants can view their teacher quiz attempts" ON public.student_quiz_attempts
  FOR SELECT USING (
    public.is_assistant() AND EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.courses c ON c.id = q.course_id
      WHERE q.id = student_quiz_attempts.quiz_id AND c.teacher_id = public.get_assistant_teacher_id()
    )
  );

-- Student Answers Table: Assistant can view answers for their teacher's quizzes
DROP POLICY IF EXISTS "Assistants can view their teacher quiz answers" ON public.student_answers;
CREATE POLICY "Assistants can view their teacher quiz answers" ON public.student_answers
  FOR SELECT USING (
    public.is_assistant() AND EXISTS (
      SELECT 1 FROM public.student_quiz_attempts sqa
      JOIN public.quizzes q ON q.id = sqa.quiz_id
      JOIN public.courses c ON c.id = q.course_id
      WHERE sqa.id = student_answers.attempt_id AND c.teacher_id = public.get_assistant_teacher_id()
    )
  );
