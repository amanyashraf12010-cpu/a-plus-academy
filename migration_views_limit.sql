-- 1. Redefine get_lesson_video_url to allow 4 views and REMOVE the auto-increment on fetch
create or replace function public.get_lesson_video_url(p_lesson_id uuid)
returns text as $$
declare
  v_video_url text;
  v_views_count int;
  v_limit int := 4; -- Limit set to 4 views
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

  -- Retrieve video path/url (Notice: Auto-increment has been removed here!)
  select video_url into v_video_url from public.lessons where id = p_lesson_id;
  return v_video_url;
end;
$$ language plpgsql security definer;


-- 2. Create the secure increment function to be called from the client-side at 50% progress
create or replace function public.increment_video_views(p_lesson_id uuid)
returns int as $$
declare
  v_views_count int;
  v_limit int := 4; -- Limit set to 4 views
  v_is_approved boolean;
begin
  -- Verify student is approved
  select is_approved into v_is_approved from public.profiles where id = auth.uid();
  if v_is_approved = false then
    raise exception 'حسابك معلق في انتظار موافقة الإدارة.';
  end if;

  -- Ensure progress record exists
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

  return v_views_count + 1;
end;
$$ language plpgsql security definer;
