-- 1. Update trigger function to include email
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

-- 2. Sync email for all existing profiles with null/empty emails
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
