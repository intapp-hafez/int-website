
DO $$ BEGIN
  CREATE TYPE public.ticket_priority AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM ('new','open','in_progress','waiting_client','resolved','closed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.can_manage_tickets(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::app_role,'helpdesk_manager'::app_role)
  );
$$;
REVOKE EXECUTE ON FUNCTION public.can_manage_tickets(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_tickets(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no text UNIQUE,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  status public.ticket_status NOT NULL DEFAULT 'new',
  description text NOT NULL DEFAULT '',
  branch text NOT NULL DEFAULT '',
  device_serial text NOT NULL DEFAULT '',
  lang text NOT NULL DEFAULT 'en',
  client_id uuid,
  assigned_to uuid,
  created_by uuid,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_client ON public.support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to);

CREATE OR REPLACE FUNCTION public.generate_ticket_no()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  yr text := to_char(now(),'YYYY');
  next_n int;
BEGIN
  IF NEW.ticket_no IS NULL OR NEW.ticket_no = '' THEN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(ticket_no,'^TIC-\d{4}-',''),'')::int),0) + 1
      INTO next_n FROM public.support_tickets WHERE ticket_no LIKE 'TIC-'||yr||'-%';
    NEW.ticket_no := 'TIC-'||yr||'-'||lpad(next_n::text,6,'0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_generate_ticket_no ON public.support_tickets;
CREATE TRIGGER trg_generate_ticket_no BEFORE INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_no();

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers view all tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.can_manage_tickets(auth.uid()));
CREATE POLICY "Technicians view assigned tickets" ON public.support_tickets FOR SELECT TO authenticated USING (assigned_to = auth.uid());
CREATE POLICY "Clients view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (client_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Clients create own tickets" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK ((client_id = auth.uid() OR created_by = auth.uid()) AND status IN ('new'::ticket_status,'open'::ticket_status));
CREATE POLICY "Managers insert tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (public.can_manage_tickets(auth.uid()));
CREATE POLICY "Managers update tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.can_manage_tickets(auth.uid())) WITH CHECK (public.can_manage_tickets(auth.uid()));
CREATE POLICY "Technicians update assigned tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (assigned_to = auth.uid()) WITH CHECK (assigned_to = auth.uid());
CREATE POLICY "Managers delete tickets" ON public.support_tickets FOR DELETE TO authenticated USING (public.can_manage_tickets(auth.uid()));

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid,
  body text NOT NULL DEFAULT '',
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers view ticket messages" ON public.support_ticket_messages FOR SELECT TO authenticated USING (public.can_manage_tickets(auth.uid()));
CREATE POLICY "Technicians view assigned ticket messages" ON public.support_ticket_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.assigned_to = auth.uid()));
CREATE POLICY "Clients view own ticket public messages" ON public.support_ticket_messages FOR SELECT TO authenticated
  USING (is_internal = false AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.client_id = auth.uid() OR t.created_by = auth.uid())));
CREATE POLICY "Staff insert messages" ON public.support_ticket_messages FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND (public.can_manage_tickets(auth.uid())
    OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.assigned_to = auth.uid())));
CREATE POLICY "Clients reply on own tickets" ON public.support_ticket_messages FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND is_internal = false AND
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.client_id = auth.uid() OR t.created_by = auth.uid())));
CREATE POLICY "Managers delete messages" ON public.support_ticket_messages FOR DELETE TO authenticated USING (public.can_manage_tickets(auth.uid()));

CREATE TABLE IF NOT EXISTS public.support_ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  uploaded_by uuid,
  file_url text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  size_bytes bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON public.support_ticket_attachments(ticket_id);
ALTER TABLE public.support_ticket_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers view attachments" ON public.support_ticket_attachments FOR SELECT TO authenticated USING (public.can_manage_tickets(auth.uid()));
CREATE POLICY "Technicians view assigned attachments" ON public.support_ticket_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.assigned_to = auth.uid()));
CREATE POLICY "Clients view own ticket attachments" ON public.support_ticket_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.client_id = auth.uid() OR t.created_by = auth.uid())));
CREATE POLICY "Users insert own attachments on accessible tickets" ON public.support_ticket_attachments FOR INSERT TO authenticated WITH CHECK (
  uploaded_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (
      public.can_manage_tickets(auth.uid()) OR t.assigned_to = auth.uid() OR t.client_id = auth.uid() OR t.created_by = auth.uid()
    )));
CREATE POLICY "Managers delete attachments" ON public.support_ticket_attachments FOR DELETE TO authenticated USING (public.can_manage_tickets(auth.uid()));

CREATE TABLE IF NOT EXISTS public.support_ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  actor_id uuid,
  event_type text NOT NULL,
  from_value text NOT NULL DEFAULT '',
  to_value text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON public.support_ticket_events(ticket_id);
ALTER TABLE public.support_ticket_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers view events" ON public.support_ticket_events FOR SELECT TO authenticated USING (public.can_manage_tickets(auth.uid()));
CREATE POLICY "Technicians view assigned events" ON public.support_ticket_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.assigned_to = auth.uid()));
CREATE POLICY "Clients view own ticket events" ON public.support_ticket_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.client_id = auth.uid() OR t.created_by = auth.uid())));
CREATE POLICY "Staff insert events" ON public.support_ticket_events FOR INSERT TO authenticated WITH CHECK (
  public.can_manage_tickets(auth.uid())
  OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.assigned_to = auth.uid()));
CREATE POLICY "Trigger creates ticket events" ON public.support_ticket_events FOR INSERT TO public WITH CHECK (event_type = 'created');

CREATE OR REPLACE FUNCTION public.on_support_ticket_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.support_ticket_events (ticket_id, actor_id, event_type, to_value, note)
  VALUES (NEW.id, NEW.created_by, 'created', NEW.status::text, 'Ticket opened');
  INSERT INTO public.admin_notifications (type, title, message, href, read)
  VALUES (
    'system'::notification_type,
    'New support ticket — ' || COALESCE(NEW.ticket_no,'TIC'),
    COALESCE(NEW.subject,'') || ' · ' || COALESCE(NEW.priority::text,'medium'),
    '/dashboard/admin/helpdesk/tickets/' || NEW.id::text,
    false
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_on_support_ticket_created ON public.support_tickets;
CREATE TRIGGER trg_on_support_ticket_created AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.on_support_ticket_created();

INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments','ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Ticket attachments managers all" ON storage.objects;
CREATE POLICY "Ticket attachments managers all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'ticket-attachments' AND public.can_manage_tickets(auth.uid()))
  WITH CHECK (bucket_id = 'ticket-attachments' AND public.can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Ticket attachments own folder read" ON storage.objects;
CREATE POLICY "Ticket attachments own folder read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Ticket attachments own folder write" ON storage.objects;
CREATE POLICY "Ticket attachments own folder write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Ticket attachments own folder update" ON storage.objects;
CREATE POLICY "Ticket attachments own folder update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Ticket attachments own folder delete" ON storage.objects;
CREATE POLICY "Ticket attachments own folder delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
