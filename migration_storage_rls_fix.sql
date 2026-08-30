-- 1. Drop old storage policies referencing profiles directly
DROP POLICY IF EXISTS "Allow admins to upload teachers-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update teachers-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete teachers-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner and admin select receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin full access to videos" ON storage.objects;

-- 2. Re-create storage policies using the secure public.is_admin() helper function
CREATE POLICY "Allow admins to upload teachers-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'teachers-images' AND public.is_admin());

CREATE POLICY "Allow admins to update teachers-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'teachers-images' AND public.is_admin());

CREATE POLICY "Allow admins to delete teachers-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'teachers-images' AND public.is_admin());

CREATE POLICY "Allow owner and admin select receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR public.is_admin()
  )
);

CREATE POLICY "Allow admin full access to videos"
ON storage.objects FOR ALL
USING (bucket_id = 'videos' AND public.is_admin());
