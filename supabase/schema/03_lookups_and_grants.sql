-- Part 3: lookup tables that were never migrated, plus Data API grants.
-- Run AFTER 01_types.sql and 02_schema.sql.

-- ---------------------------------------------------------------- lookups
CREATE TABLE IF NOT EXISTS public.sys_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_en text NOT NULL DEFAULT '',
  country_ar text NOT NULL DEFAULT '',
  city_en text NOT NULL DEFAULT '',
  city_ar text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sys_locations_country ON public.sys_locations (country_en, city_en);
CREATE INDEX IF NOT EXISTS idx_sys_locations_active ON public.sys_locations (is_active);

CREATE TABLE IF NOT EXISTS public.sys_nationalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sys_nationalities_active ON public.sys_nationalities (is_active);

DROP TRIGGER IF EXISTS trg_sys_locations_updated_at ON public.sys_locations;
CREATE TRIGGER trg_sys_locations_updated_at BEFORE UPDATE ON public.sys_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_sys_nationalities_updated_at ON public.sys_nationalities;
CREATE TRIGGER trg_sys_nationalities_updated_at BEFORE UPDATE ON public.sys_nationalities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sys_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_nationalities ENABLE ROW LEVEL SECURITY;

-- Public sign-up / careers forms read the active rows; only admins write.
DROP POLICY IF EXISTS "Active locations are publicly readable" ON public.sys_locations;
CREATE POLICY "Active locations are publicly readable" ON public.sys_locations
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins manage locations" ON public.sys_locations;
CREATE POLICY "Admins manage locations" ON public.sys_locations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Active nationalities are publicly readable" ON public.sys_nationalities;
CREATE POLICY "Active nationalities are publicly readable" ON public.sys_nationalities
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins manage nationalities" ON public.sys_nationalities;
CREATE POLICY "Admins manage nationalities" ON public.sys_nationalities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------------------------------------------------------------- grants
-- PostgREST needs explicit privileges; RLS alone is not enough.
DO $grants$
DECLARE
  t text;
  public_read text[] := ARRAY[
    'about_content','homepage_slides','news_posts','products','career_jobs','chatbot_qa',
    'seo_global','seo_pages','support_categories','support_branches','support_sla_policies',
    'sys_locations','sys_nationalities'
  ];
  public_write text[] := ARRAY['leads','career_applications','pwa_install_events'];
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    IF t = ANY(public_read) THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    END IF;
    IF t = ANY(public_write) THEN
      EXECUTE format('GRANT INSERT ON public.%I TO anon', t);
    END IF;
  END LOOP;
END
$grants$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- ------------------------------------------------- career resumes bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('career-resumes', 'career-resumes', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can upload a resume" ON storage.objects;
CREATE POLICY "Anyone can upload a resume" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'career-resumes');

DROP POLICY IF EXISTS "Admins can read resumes" ON storage.objects;
CREATE POLICY "Admins can read resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'career-resumes' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete resumes" ON storage.objects;
CREATE POLICY "Admins can delete resumes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'career-resumes' AND public.has_role(auth.uid(), 'admin'::public.app_role));
