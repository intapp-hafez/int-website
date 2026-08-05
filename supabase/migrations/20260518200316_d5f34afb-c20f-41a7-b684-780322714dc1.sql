
-- =========================================
-- Registries
-- =========================================
CREATE TABLE public.support_sla_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  first_response_minutes integer NOT NULL DEFAULT 60,
  resolve_minutes integer NOT NULL DEFAULT 480,
  business_hours_only boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.support_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  default_sla_policy_id uuid REFERENCES public.support_sla_policies(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.support_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.support_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  branch_id uuid REFERENCES public.support_branches(id) ON DELETE SET NULL,
  client_id uuid,
  active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================
-- Assignment history
-- =========================================
CREATE TABLE public.support_ticket_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  assigned_to uuid,
  assigned_by uuid,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sta_ticket ON public.support_ticket_assignments(ticket_id, created_at DESC);

-- =========================================
-- Extend support_tickets with SLA fields
-- =========================================
ALTER TABLE public.support_tickets
  ADD COLUMN sla_policy_id uuid REFERENCES public.support_sla_policies(id) ON DELETE SET NULL,
  ADD COLUMN first_response_due_at timestamptz,
  ADD COLUMN resolve_due_at timestamptz,
  ADD COLUMN first_response_at timestamptz;

-- =========================================
-- updated_at triggers
-- =========================================
CREATE TRIGGER trg_sla_updated BEFORE UPDATE ON public.support_sla_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cat_updated BEFORE UPDATE ON public.support_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_br_updated BEFORE UPDATE ON public.support_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dev_updated BEFORE UPDATE ON public.support_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Apply SLA on ticket insert (pick by priority, fallback to category default)
-- =========================================
CREATE OR REPLACE FUNCTION public.apply_ticket_sla()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pol record;
BEGIN
  IF NEW.sla_policy_id IS NULL THEN
    -- try category default
    SELECT sp.* INTO pol
    FROM public.support_categories c
    JOIN public.support_sla_policies sp ON sp.id = c.default_sla_policy_id
    WHERE c.value = NEW.category AND sp.active = true
    LIMIT 1;
    -- fallback: by priority
    IF pol.id IS NULL THEN
      SELECT * INTO pol FROM public.support_sla_policies
      WHERE active = true AND priority = NEW.priority
      ORDER BY sort_order ASC LIMIT 1;
    END IF;
    IF pol.id IS NOT NULL THEN
      NEW.sla_policy_id := pol.id;
    END IF;
  ELSE
    SELECT * INTO pol FROM public.support_sla_policies WHERE id = NEW.sla_policy_id;
  END IF;

  IF pol.id IS NOT NULL THEN
    IF NEW.first_response_due_at IS NULL THEN
      NEW.first_response_due_at := NEW.created_at + (pol.first_response_minutes || ' minutes')::interval;
    END IF;
    IF NEW.resolve_due_at IS NULL THEN
      NEW.resolve_due_at := NEW.created_at + (pol.resolve_minutes || ' minutes')::interval;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_apply_sla BEFORE INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.apply_ticket_sla();

-- =========================================
-- First-response stamp (on first non-internal staff message)
-- =========================================
CREATE OR REPLACE FUNCTION public.stamp_first_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t record;
BEGIN
  IF NEW.is_internal = true THEN RETURN NEW; END IF;
  SELECT id, client_id, created_by, first_response_at INTO t FROM public.support_tickets WHERE id = NEW.ticket_id;
  IF t.first_response_at IS NOT NULL THEN RETURN NEW; END IF;
  -- only count staff (not the ticket creator/client) as first response
  IF NEW.author_id IS NOT NULL AND NEW.author_id <> COALESCE(t.client_id, t.created_by) THEN
    UPDATE public.support_tickets SET first_response_at = now() WHERE id = NEW.ticket_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_first_response AFTER INSERT ON public.support_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.stamp_first_response();

-- =========================================
-- Assignment change → history + event + notification
-- =========================================
CREATE OR REPLACE FUNCTION public.on_ticket_assignment_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.assigned_to::text,'') = COALESCE(OLD.assigned_to::text,'') THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.support_ticket_assignments (ticket_id, assigned_to, assigned_by, note)
  VALUES (NEW.id, NEW.assigned_to, auth.uid(), 'Assignment updated');
  INSERT INTO public.support_ticket_events (ticket_id, actor_id, event_type, from_value, to_value, note)
  VALUES (NEW.id, auth.uid(), 'assigned', COALESCE(OLD.assigned_to::text,''), COALESCE(NEW.assigned_to::text,''), 'Ticket reassigned');
  INSERT INTO public.admin_notifications (type, title, message, href, read)
  VALUES (
    'system'::notification_type,
    'Ticket reassigned — ' || COALESCE(NEW.ticket_no,'TIC'),
    COALESCE(NEW.subject,''),
    '/dashboard/admin/helpdesk/tickets/' || NEW.id::text,
    false
  );
  RETURN NEW;
END $$;

CREATE TRIGGER trg_assignment_change AFTER UPDATE OF assigned_to ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.on_ticket_assignment_change();

-- =========================================
-- RLS
-- =========================================
ALTER TABLE public.support_sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_assignments ENABLE ROW LEVEL SECURITY;

-- Public read for active rows (registries); admins/managers see all
CREATE POLICY "Read active SLA" ON public.support_sla_policies FOR SELECT USING (active = true OR can_manage_tickets(auth.uid()));
CREATE POLICY "Admins manage SLA" ON public.support_sla_policies FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Read active categories" ON public.support_categories FOR SELECT USING (active = true OR can_manage_tickets(auth.uid()));
CREATE POLICY "Admins manage categories" ON public.support_categories FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Read active branches" ON public.support_branches FOR SELECT USING (active = true OR can_manage_tickets(auth.uid()));
CREATE POLICY "Admins manage branches" ON public.support_branches FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Managers read devices" ON public.support_devices FOR SELECT USING (can_manage_tickets(auth.uid()) OR (client_id = auth.uid()));
CREATE POLICY "Admins manage devices" ON public.support_devices FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Assignment history
CREATE POLICY "Managers view assignments" ON public.support_ticket_assignments FOR SELECT USING (can_manage_tickets(auth.uid()));
CREATE POLICY "Assignee views own assignments" ON public.support_ticket_assignments FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "Managers insert assignments" ON public.support_ticket_assignments FOR INSERT TO authenticated WITH CHECK (can_manage_tickets(auth.uid()));
CREATE POLICY "Trigger inserts assignments" ON public.support_ticket_assignments FOR INSERT WITH CHECK (true);
