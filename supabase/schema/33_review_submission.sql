-- Apply in the Supabase SQL editor when database migrations are enabled.
ALTER TABLE public.reviews ALTER COLUMN approved SET DEFAULT false;
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can submit reviews" ON public.reviews;
CREATE POLICY "Public can submit reviews" ON public.reviews FOR INSERT TO anon, authenticated
WITH CHECK (approved = false AND rating BETWEEN 1 AND 5
  AND char_length(btrim(author)) BETWEEN 1 AND 100
  AND char_length(company) <= 150 AND char_length(btrim(text)) BETWEEN 1 AND 2000);
DROP POLICY IF EXISTS "Approved reviews are publicly readable" ON public.reviews;
CREATE POLICY "Approved reviews are publicly readable" ON public.reviews FOR SELECT TO anon, authenticated
USING (approved = true OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
ALTER TABLE public.reviews ADD CONSTRAINT reviews_submission_lengths
CHECK (char_length(btrim(author)) BETWEEN 1 AND 100 AND char_length(company) <= 150
  AND char_length(btrim(text)) BETWEEN 1 AND 2000) NOT VALID;