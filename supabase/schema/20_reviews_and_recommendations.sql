-- ======================================================================
-- 20_reviews_and_recommendations.sql
-- Reviews / Testimonials Table + Smart Recommendation System Tables
-- ======================================================================

-- 1. Reviews / Testimonials Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  text text NOT NULL DEFAULT '',
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved reviews are publicly readable" ON public.reviews;
CREATE POLICY "Approved reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (approved = true OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can submit reviews" ON public.reviews;
CREATE POLICY "Public can submit reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial reviews
INSERT INTO public.reviews (id, author, company, rating, text, approved, created_at)
VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Khaled Mansour', 'Orascom Construction', 5, 'Delivered the Tier-III Data Center project on time with exceptional engineering quality and zero downtime.', true, now() - interval '25 days'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Sara Bouzid', 'Etisalat', 5, 'Strong technical team and smooth SD-WAN deployment across all our regional branches.', true, now() - interval '18 days'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Omar Haddad', 'Rotana Hotels', 5, 'Best corporate AV and integrated conferencing systems deployment we have experienced.', true, now() - interval '10 days'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Lina Farouk', 'Ministry of Interior', 5, 'Exceptional city-scale IP surveillance integration with AI video analytics.', true, now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;


-- 2. Client Assessment Submissions Table
CREATE TABLE IF NOT EXISTS public.client_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  business_type_key text NOT NULL DEFAULT '',
  project_name text NOT NULL DEFAULT '',
  client_name text NOT NULL DEFAULT '',
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own assessments" ON public.client_assessments;
CREATE POLICY "Users can read own assessments"
  ON public.client_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create assessments" ON public.client_assessments;
CREATE POLICY "Users can create assessments"
  ON public.client_assessments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage assessments" ON public.client_assessments;
CREATE POLICY "Admins can manage assessments"
  ON public.client_assessments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_client_assessments_updated_at ON public.client_assessments;
CREATE TRIGGER trg_client_assessments_updated_at
  BEFORE UPDATE ON public.client_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
