ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS seo_title_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description_ar text NOT NULL DEFAULT '';