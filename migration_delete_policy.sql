-- 1. Ensure email column exists and is synced
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 2. Enable delete policy for admins so the Reject/Delete button works
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;
CREATE POLICY "Profiles delete policy" ON public.profiles
  FOR DELETE USING (public.is_admin());
