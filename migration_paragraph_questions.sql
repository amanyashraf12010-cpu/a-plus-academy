-- Migration: Add Paragraph Question support to questions and student_answers

-- 1. Update questions table
ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'mcq' CHECK (type IN ('mcq', 'paragraph')),
  ADD COLUMN IF NOT EXISTS min_words integer DEFAULT 150,
  ADD COLUMN IF NOT EXISTS max_words integer DEFAULT 180;

-- Drop existing not-null and check constraints on correct_option to allow paragraph questions
ALTER TABLE public.questions 
  ALTER COLUMN correct_option DROP NOT NULL;

ALTER TABLE public.questions 
  DROP CONSTRAINT IF EXISTS questions_correct_option_check;

ALTER TABLE public.questions 
  ADD CONSTRAINT questions_correct_option_check 
  CHECK (type = 'paragraph' OR correct_option IN ('A', 'B', 'C', 'D'));

-- 2. Update student_answers table
ALTER TABLE public.student_answers 
  ADD COLUMN IF NOT EXISTS answer_text text,
  ADD COLUMN IF NOT EXISTS word_count integer;

ALTER TABLE public.student_answers 
  ALTER COLUMN selected_option DROP NOT NULL;

ALTER TABLE public.student_answers 
  DROP CONSTRAINT IF EXISTS student_answers_selected_option_check;

ALTER TABLE public.student_answers 
  ADD CONSTRAINT student_answers_selected_option_check 
  CHECK (selected_option IS NULL OR selected_option IN ('A', 'B', 'C', 'D'));
