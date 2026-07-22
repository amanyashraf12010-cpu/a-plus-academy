-- Supabase Database Schema for A+ Academy

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. Tables Creation
-- =========================================================================

-- Profiles Table (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text, -- Store user email for easy access
  role text default 'student' check(role in ('student', 'admin')),
  is_approved boolean default false,
  phone text not null,
  parent_phone text not null,
  parent_job text,
  school text,
  governorate text,
  gender text,
  education_system text,
  track text,
  grade text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint check_different_phones check (phone <> parent_phone)
);

-- Teachers Table (Managed by Admin)
create table if not exists public.teachers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  image text,
  subject text,
  description text,
  education_system text,
  grade text,
  track text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Courses Table
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image text,
  teacher_id uuid references public.teachers(id) on delete cascade,
  grade text,
  subject text,
  price numeric(10, 2) default 0.00,
  video_count integer default 0,
  duration text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lessons Table
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  video_url text not null, -- Path inside the private storage bucket
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Subscriptions Table
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  status text default 'pending' check(status in ('pending', 'approved', 'rejected')),
  payment_method text, -- 'vodafone_cash' or 'instapay'
  receipt_url text, -- URL of uploaded payment receipt image
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_course unique (user_id, course_id)
);

-- Video Progress Table (tracks views)
create table if not exists public.video_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  views_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_lesson unique (user_id, lesson_id)
);

-- =========================================================================
-- 2. Auth Trigger for Automatic Profiles
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
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
    grade
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce((new.raw_user_meta_data->>'is_approved')::boolean, false),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'parent_phone', ''),
    new.raw_user_meta_data->>'parent_job',
    new.raw_user_meta_data->>'school',
    new.raw_user_meta_data->>'governorate',
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'education_system',
    new.raw_user_meta_data->>'track',
    new.raw_user_meta_data->>'grade'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger if exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- 3. Security Helper Functions (RLS Bypassing)
-- =========================================================================

-- Checks if the authenticated user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
end;
$$ language plpgsql security definer;

-- =========================================================================
-- 4. Row Level Security (RLS) & Policies
-- =========================================================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.subscriptions enable row level security;
alter table public.video_progress enable row level security;

-- Profiles Policies
drop policy if exists "Profiles read policy" on public.profiles;
create policy "Profiles read policy" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Profiles update policy" on public.profiles;
create policy "Profiles update policy" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- Teachers Policies
drop policy if exists "Teachers read policy" on public.teachers;
create policy "Teachers read policy" on public.teachers
  for select using (true); -- Anyone can see teachers list

drop policy if exists "Teachers admin policy" on public.teachers;
create policy "Teachers admin policy" on public.teachers
  for all using (public.is_admin());

-- Courses Policies
drop policy if exists "Courses read policy" on public.courses;
create policy "Courses read policy" on public.courses
  for select using (true); -- Anyone can see courses list

drop policy if exists "Courses admin policy" on public.courses;
create policy "Courses admin policy" on public.courses
  for all using (public.is_admin());

-- Lessons Policies
drop policy if exists "Lessons read policy" on public.lessons;
create policy "Lessons read policy" on public.lessons
  for select using (
    public.is_admin() or
    exists (
      select 1 from public.subscriptions s
      where s.course_id = lessons.course_id
      and s.user_id = auth.uid()
      and s.status = 'approved'
    )
  );

drop policy if exists "Lessons admin policy" on public.lessons;
create policy "Lessons admin policy" on public.lessons
  for all using (public.is_admin());

-- Subscriptions Policies
drop policy if exists "Subscriptions read policy" on public.subscriptions;
create policy "Subscriptions read policy" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Subscriptions insert policy" on public.subscriptions;
create policy "Subscriptions insert policy" on public.subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Subscriptions admin policy" on public.subscriptions;
create policy "Subscriptions admin policy" on public.subscriptions
  for all using (public.is_admin());

-- Video Progress Policies
drop policy if exists "Video progress read policy" on public.video_progress;
create policy "Video progress read policy" on public.video_progress
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Video progress write policy" on public.video_progress;
create policy "Video progress write policy" on public.video_progress
  for all using (auth.uid() = user_id or public.is_admin());

-- =========================================================================
-- 5. Secure Video URL Function (RPC)
-- =========================================================================

create or replace function public.get_lesson_video_url(p_lesson_id uuid)
returns text as $$
declare
  v_video_url text;
  v_views_count int;
  v_limit int := 3; -- Video play limit
  v_user_role text;
  v_is_approved boolean;
begin
  -- Get user details
  select role, is_approved into v_user_role, v_is_approved from public.profiles where id = auth.uid();
  
  -- If admin, bypass limits and return url
  if v_user_role = 'admin' then
    select video_url into v_video_url from public.lessons where id = p_lesson_id;
    return v_video_url;
  end if;

  -- Verify user is approved student and has an approved subscription
  if v_is_approved = false or not exists (
    select 1 from public.subscriptions s
    join public.lessons l on l.course_id = s.course_id
    where s.user_id = auth.uid()
    and s.status = 'approved'
    and l.id = p_lesson_id
  ) then
    raise exception 'غير مصرح لك بمشاهدة هذا الفيديو أو لم يتم تفعيل اشتراكك بعد.';
  end if;

  -- Ensure record exists in video_progress
  insert into public.video_progress (user_id, lesson_id, views_count)
  values (auth.uid(), p_lesson_id, 0)
  on conflict (user_id, lesson_id) do nothing;

  -- Check views count
  select views_count into v_views_count
  from public.video_progress
  where user_id = auth.uid() and lesson_id = p_lesson_id;

  if v_views_count >= v_limit then
    raise exception 'لقد تجاوزت الحد الأقصى للمشاهدات المسموح بها لهذا الفيديو (% مرات).', v_limit;
  end if;

  -- Increment views count
  update public.video_progress
  set views_count = views_count + 1
  where user_id = auth.uid() and lesson_id = p_lesson_id;

  -- Retrieve video path/url
  select video_url into v_video_url from public.lessons where id = p_lesson_id;
  return v_video_url;
end;
$$ language plpgsql security definer;

-- =========================================================================
-- 6. Storage Buckets Row Level Security Policies
-- =========================================================================

-- Create storage buckets if they do not exist
insert into storage.buckets (id, name, public)
values 
  ('teachers-images', 'teachers-images', true),
  ('receipts', 'receipts', false),
  ('videos', 'videos', false)
on conflict (id) do nothing;

-- Policies for teachers-images (Public bucket for teacher photos)
drop policy if exists "Allow public read access to teachers-images" on storage.objects;
create policy "Allow public read access to teachers-images"
on storage.objects for select
using (bucket_id = 'teachers-images');

drop policy if exists "Allow admins to upload teachers-images" on storage.objects;
create policy "Allow admins to upload teachers-images"
on storage.objects for insert
with check (bucket_id = 'teachers-images' and (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));

drop policy if exists "Allow admins to update teachers-images" on storage.objects;
create policy "Allow admins to update teachers-images"
on storage.objects for update
using (bucket_id = 'teachers-images' and (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));

drop policy if exists "Allow admins to delete teachers-images" on storage.objects;
create policy "Allow admins to delete teachers-images"
on storage.objects for delete
using (bucket_id = 'teachers-images' and (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));


-- Policies for receipts (Private bucket for student transfer screenshots)
drop policy if exists "Allow student uploads to receipts" on storage.objects;
create policy "Allow student uploads to receipts"
on storage.objects for insert
with check (bucket_id = 'receipts' and auth.role() = 'authenticated');

drop policy if exists "Allow owner and admin select receipts" on storage.objects;
create policy "Allow owner and admin select receipts"
on storage.objects for select
using (
  bucket_id = 'receipts' 
  and (
    (storage.foldername(name))[1] = auth.uid()::text 
    or (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  )
);


-- Policies for videos (Private bucket for course lesson videos)
drop policy if exists "Allow admin full access to videos" on storage.objects;
create policy "Allow admin full access to videos"
on storage.objects for all
using (bucket_id = 'videos' and (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));

-- =========================================================================
-- 7. Database Views (Safely bypass RLS to expose aggregate counts)
-- =========================================================================

create or replace view public.course_stats as
select 
  c.id as course_id,
  count(s.id) as student_count
from public.courses c
left join public.subscriptions s on s.course_id = c.id and s.status = 'approved'
group by c.id;

grant select on public.course_stats to anon, authenticated;


