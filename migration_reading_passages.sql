-- Migration for Reading Passages support
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS passage_id text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS passage_title text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS passage_text text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS order_num integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_questions_passage_id ON public.questions(passage_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_order ON public.questions(quiz_id, order_num);
