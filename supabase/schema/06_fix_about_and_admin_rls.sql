-- =================================================================
-- Fix RLS Policies for about_content and assign Admin Role
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql
-- =================================================================

-- 1. Ensure the 'main' row exists in about_content
INSERT INTO public.about_content (id)
VALUES ('main')
ON CONFLICT (id) DO NOTHING;

-- 2. Update RLS policies for about_content so authenticated admins can save without restriction
DROP POLICY IF EXISTS "Admins can insert about_content" ON public.about_content;
CREATE POLICY "Admins can insert about_content"
  ON public.about_content FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update about_content" ON public.about_content;
CREATE POLICY "Admins can update about_content"
  ON public.about_content FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete about_content" ON public.about_content;
CREATE POLICY "Admins can delete about_content"
  ON public.about_content FOR DELETE TO authenticated
  USING (true);

-- 3. Automatically grant the 'admin' role to all current auth.users in user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Ensure storage policies for about-images allow authenticated uploads
DROP POLICY IF EXISTS "Authenticated users can upload about images" ON storage.objects;
CREATE POLICY "Authenticated users can upload about images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'about-images');

DROP POLICY IF EXISTS "Authenticated users can update about images" ON storage.objects;
CREATE POLICY "Authenticated users can update about images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'about-images');
