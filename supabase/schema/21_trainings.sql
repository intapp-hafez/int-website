-- Events & Training: publishable programs + learner registrations.
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'training', -- 'training' | 'event'
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  details_en text NOT NULL DEFAULT '',
  details_ar text NOT NULL DEFAULT '',
  benefits_en text NOT NULL DEFAULT '',
  benefits_ar text NOT NULL DEFAULT '',
  trainer text NOT NULL DEFAULT '',
  start_date date,
  end_date date,
  location text NOT NULL DEFAULT '',
  banner_url text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trainings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainings TO authenticated;
GRANT ALL ON public.trainings TO service_role;

ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active trainings publicly readable" ON public.trainings;
CREATE POLICY "Active trainings publicly readable" ON public.trainings
  FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage trainings" ON public.trainings;
CREATE POLICY "Admins manage trainings" ON public.trainings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_trainings_updated_at ON public.trainings;
CREATE TRIGGER trg_trainings_updated_at BEFORE UPDATE ON public.trainings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.training_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  gender text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  education_field text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  district text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.training_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_registrations TO authenticated;
GRANT ALL ON public.training_registrations TO service_role;

ALTER TABLE public.training_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can register for an active training" ON public.training_registrations;
CREATE POLICY "Anyone can register for an active training" ON public.training_registrations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.trainings t WHERE t.id = training_id AND t.active = true)
  );

DROP POLICY IF EXISTS "Admins read registrations" ON public.training_registrations;
CREATE POLICY "Admins read registrations" ON public.training_registrations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update registrations" ON public.training_registrations;
CREATE POLICY "Admins update registrations" ON public.training_registrations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete registrations" ON public.training_registrations;
CREATE POLICY "Admins delete registrations" ON public.training_registrations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_training_registrations_updated_at ON public.training_registrations;
CREATE TRIGGER trg_training_registrations_updated_at BEFORE UPDATE ON public.training_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_training_registrations_training
  ON public.training_registrations(training_id);
