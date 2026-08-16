-- =================================================================
-- Create Industries Table and Seed Initial Data
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql
-- =================================================================

CREATE TABLE IF NOT EXISTS public.industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  description_en text DEFAULT '',
  description_ar text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Industries publicly readable" ON public.industries;
CREATE POLICY "Industries publicly readable"
  ON public.industries FOR SELECT
  USING (true);

-- Authenticated admins can manage
DROP POLICY IF EXISTS "Admins can manage industries" ON public.industries;
CREATE POLICY "Admins can manage industries"
  ON public.industries FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed Default Industries
INSERT INTO public.industries (slug, title_en, title_ar, image, sort_order)
VALUES
  ('telecom', 'Telecom', 'الاتصالات', 'https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?w=800&q=80', 0),
  ('oil-gas', 'Oil & Gas', 'النفط والغاز', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80', 1),
  ('real-estate', 'Real Estate', 'العقارات', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80', 2),
  ('hospitality', 'Hospitality', 'الضيافة', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', 3),
  ('manufacturing', 'Manufacturing', 'التصنيع', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', 4),
  ('government', 'Government', 'القطاع الحكومي', 'https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?w=800&q=80', 5),
  ('healthcare', 'Healthcare', 'الرعاية الصحية', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80', 6),
  ('education', 'Education', 'التعليم', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80', 7),
  ('finance', 'Financial Services', 'الخدمات المالية', 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80', 8),
  ('retail', 'Retail', 'التجزئة', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80', 9),
  ('transportation', 'Transportation', 'النقل', 'https://images.unsplash.com/photo-1494412519320-aa613dfb7738?w=800&q=80', 10),
  ('aviation', 'Aviation', 'الطيران', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', 11),
  ('energy', 'Energy & Utilities', 'الطاقة والمرافق', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80', 12)
ON CONFLICT (slug) DO NOTHING;
