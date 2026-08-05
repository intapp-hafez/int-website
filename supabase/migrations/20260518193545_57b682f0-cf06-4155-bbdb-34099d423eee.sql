
CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view lead notes" ON public.lead_notes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert lead notes" ON public.lead_notes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update lead notes" ON public.lead_notes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete lead notes" ON public.lead_notes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id, created_at DESC);

CREATE TRIGGER trg_lead_notes_updated_at
  BEFORE UPDATE ON public.lead_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-notify admins when a new lead arrives
CREATE OR REPLACE FUNCTION public.notify_admins_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lang_label text;
  product_part text;
BEGIN
  lang_label := CASE WHEN NEW.lang = 'ar' THEN 'AR' ELSE 'EN' END;
  product_part := CASE WHEN COALESCE(NEW.product_name, '') <> '' THEN ' — ' || NEW.product_name ELSE '' END;

  INSERT INTO public.admin_notifications (type, title, message, href, read)
  VALUES (
    'lead'::notification_type,
    'New quote request (' || lang_label || ')' || product_part,
    COALESCE(NEW.full_name, 'Unknown') || ' · ' || COALESCE(NEW.email, '') ||
      CASE WHEN COALESCE(NEW.company, '') <> '' THEN ' · ' || NEW.company ELSE '' END,
    '/dashboard/admin/leads/quotes/' || NEW.id::text,
    false
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_new_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_lead();
