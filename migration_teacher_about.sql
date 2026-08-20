-- إضافة عمود الوصف التفصيلي (about) لجدول المدرسين
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS about text DEFAULT NULL;
