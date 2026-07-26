-- Migration script to create Homework and Exams tables

-- 1. Create quizzes table
create table if not exists public.quizzes (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade,
  title text not null,
  type text not null check (type in ('quiz', 'final')),
  passing_score integer default 50 not null,
  duration integer, -- in minutes
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_lesson_quiz unique (lesson_id)
);

-- 2. Create questions table
create table if not exists public.questions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question_text text,
  question_image text,
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create options table
create table if not exists public.options (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references public.questions(id) on delete cascade not null,
  option_letter text not null check (option_letter in ('A', 'B', 'C', 'D')),
  option_text text,
  option_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_question_option unique (question_id, option_letter)
);

-- 4. Create student_quiz_attempts table
create table if not exists public.student_quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  score numeric(5, 2), -- percentage
  correct_count integer,
  total_questions integer,
  status text default 'in_progress' check (status in ('in_progress', 'submitted')),
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create student_answers table
create table if not exists public.student_answers (
  id uuid default gen_random_uuid() primary key,
  attempt_id uuid references public.student_quiz_attempts(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  selected_option text not null check (selected_option in ('A', 'B', 'C', 'D')),
  is_correct boolean,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_attempt_question_answer unique (attempt_id, question_id)
);

-- Enable Row Level Security (RLS) on new tables
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.student_quiz_attempts enable row level security;
alter table public.student_answers enable row level security;

-- Policies for quizzes
create policy "Allow public read access to active quizzes" on public.quizzes
  for select using (is_active = true);

create policy "Allow admin full access to quizzes" on public.quizzes
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policies for questions
create policy "Allow authenticated users to read questions" on public.questions
  for select using (auth.uid() is not null);

create policy "Allow admin full access to questions" on public.questions
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policies for options
create policy "Allow authenticated users to read options" on public.options
  for select using (auth.uid() is not null);

create policy "Allow admin full access to options" on public.options
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policies for student_quiz_attempts
create policy "Allow users to manage their own attempts" on public.student_quiz_attempts
  for all using (auth.uid() = user_id);

create policy "Allow admin full access to attempts" on public.student_quiz_attempts
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policies for student_answers
create policy "Allow users to manage their own answers" on public.student_answers
  for all using (
    exists (
      select 1 from public.student_quiz_attempts
      where id = attempt_id and user_id = auth.uid()
    )
  );

create policy "Allow admin full access to answers" on public.student_answers
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
