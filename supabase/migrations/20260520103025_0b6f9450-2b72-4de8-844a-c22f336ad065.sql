
CREATE TABLE public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  excerpt_en text NOT NULL DEFAULT '',
  excerpt_ar text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '',
  body_ar text NOT NULL DEFAULT '',
  category_en text NOT NULL DEFAULT '',
  category_ar text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  published_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active news publicly readable" ON public.news_posts
  FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert news" ON public.news_posts
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update news" ON public.news_posts
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete news" ON public.news_posts
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_news_posts_updated_at BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "News images publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'news-images');
CREATE POLICY "Admins upload news images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update news images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete news images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'::app_role));
