
CREATE TABLE public.pwa_install_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  platform TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pwa_install_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert install events"
ON public.pwa_install_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "admins can view install events"
ON public.pwa_install_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_pwa_install_events_type_created ON public.pwa_install_events(event_type, created_at DESC);
