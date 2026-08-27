-- Dedicated Events Schema
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Event',
  status text NOT NULL DEFAULT 'Registration Open',
  capacity integer NOT NULL DEFAULT 0,
  summary text NOT NULL DEFAULT '',
  
  start_date date,
  end_date date,
  start_time text NOT NULL DEFAULT '',
  end_time text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  venue text NOT NULL DEFAULT '',
  map_url text NOT NULL DEFAULT '',
  
  banner_url text NOT NULL DEFAULT '',
  
  partners jsonb NOT NULL DEFAULT '[]'::jsonb,
  speakers jsonb NOT NULL DEFAULT '[]'::jsonb,
  agenda jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active events publicly readable" ON public.events;
CREATE POLICY "Active events publicly readable" ON public.events
  FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage events" ON public.events;
CREATE POLICY "Admins manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
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

GRANT INSERT ON public.event_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can register for an active event" ON public.event_registrations;
CREATE POLICY "Anyone can register for an active event" ON public.event_registrations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.active = true)
  );

DROP POLICY IF EXISTS "Admins read event registrations" ON public.event_registrations;
CREATE POLICY "Admins read event registrations" ON public.event_registrations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update event registrations" ON public.event_registrations;
CREATE POLICY "Admins update event registrations" ON public.event_registrations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete event registrations" ON public.event_registrations;
CREATE POLICY "Admins delete event registrations" ON public.event_registrations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_event_registrations_updated_at ON public.event_registrations;
CREATE TRIGGER trg_event_registrations_updated_at BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_event_registrations_event
  ON public.event_registrations(event_id);
