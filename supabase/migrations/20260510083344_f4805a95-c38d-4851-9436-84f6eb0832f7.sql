CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.homepage_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  subtitle_en text NOT NULL DEFAULT '',
  subtitle_ar text NOT NULL DEFAULT '',
  cta_en text NOT NULL DEFAULT '',
  cta_ar text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '/',
  image text NOT NULL DEFAULT '/placeholder.svg',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slides are publicly readable" ON public.homepage_slides FOR SELECT USING (true);
CREATE POLICY "Admins can insert slides" ON public.homepage_slides FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update slides" ON public.homepage_slides FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete slides" ON public.homepage_slides FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_homepage_slides_updated_at BEFORE UPDATE ON public.homepage_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_homepage_slides_sort ON public.homepage_slides (sort_order);