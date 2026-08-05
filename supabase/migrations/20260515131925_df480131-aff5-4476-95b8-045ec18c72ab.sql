
-- Status enum for application workflow
DO $$ BEGIN
  CREATE TYPE public.career_app_status AS ENUM ('new','reviewed','shortlisted','interviewed','offered','accepted','rejected','withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TYPE public.career_employment_type AS ENUM ('full_time','part_time','contract','internship');

-- Jobs
CREATE TABLE public.career_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  department_en text NOT NULL DEFAULT '',
  department_ar text NOT NULL DEFAULT '',
  location_en text NOT NULL DEFAULT '',
  location_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  employment_type public.career_employment_type NOT NULL DEFAULT 'full_time',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.career_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active jobs are publicly readable"
  ON public.career_jobs FOR SELECT TO public
  USING (active = true OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins manage jobs insert" ON public.career_jobs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage jobs update" ON public.career_jobs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage jobs delete" ON public.career_jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER career_jobs_updated_at BEFORE UPDATE ON public.career_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Applications
CREATE TABLE public.career_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text NOT NULL UNIQUE DEFAULT ('A-' || to_char(now(),'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  job_id uuid REFERENCES public.career_jobs(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  cover_letter text NOT NULL DEFAULT '',
  resume_url text NOT NULL DEFAULT '',
  linkedin_url text NOT NULL DEFAULT '',
  status public.career_app_status NOT NULL DEFAULT 'new',
  internal_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit application" ON public.career_applications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins view applications" ON public.career_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update applications" ON public.career_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete applications" ON public.career_applications FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER career_applications_updated_at BEFORE UPDATE ON public.career_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX career_applications_status_idx ON public.career_applications(status);
CREATE INDEX career_applications_job_idx ON public.career_applications(job_id);

-- Application events (audit trail)
CREATE TABLE public.career_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.career_applications(id) ON DELETE CASCADE,
  from_status public.career_app_status,
  to_status public.career_app_status NOT NULL,
  note text NOT NULL DEFAULT '',
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.career_application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view events" ON public.career_application_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert events" ON public.career_application_events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX career_app_events_app_idx ON public.career_application_events(application_id, created_at DESC);

-- Auto-log initial event on insert
CREATE OR REPLACE FUNCTION public.log_initial_application_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.career_application_events (application_id, from_status, to_status, note)
  VALUES (NEW.id, NULL, NEW.status, 'Application submitted');
  RETURN NEW;
END; $$;

CREATE TRIGGER career_applications_initial_event AFTER INSERT ON public.career_applications
  FOR EACH ROW EXECUTE FUNCTION public.log_initial_application_event();
