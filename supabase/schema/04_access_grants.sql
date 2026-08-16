-- Part 4: admin access requests + time-limited permission grants.
-- Run AFTER 01_types.sql, 02_schema.sql and 03_lookups_and_grants.sql.

DO $$ BEGIN
  CREATE TYPE public.access_request_status AS ENUM ('pending','approved','denied','revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  user_email text NOT NULL DEFAULT '',
  page_key text NOT NULL,
  actions text[] NOT NULL DEFAULT '{}',
  reason text NOT NULL DEFAULT '',
  status public.access_request_status NOT NULL DEFAULT 'pending',
  requested_days integer,
  decision_note text NOT NULL DEFAULT '',
  decided_by uuid,
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_key text NOT NULL,
  actions text[] NOT NULL DEFAULT '{}',
  request_id uuid REFERENCES public.access_requests(id) ON DELETE SET NULL,
  granted_by uuid,
  note text NOT NULL DEFAULT '',
  expires_at timestamptz,          -- NULL = permanent
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_user ON public.access_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests (status);
CREATE INDEX IF NOT EXISTS idx_access_grants_lookup ON public.access_grants (user_id, page_key);
CREATE INDEX IF NOT EXISTS idx_access_grants_expiry ON public.access_grants (expires_at);

-- Data API privileges (RLS alone is not enough for PostgREST).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_requests TO authenticated;
GRANT ALL ON public.access_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_grants TO authenticated;
GRANT ALL ON public.access_grants TO service_role;

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------- helpers
CREATE OR REPLACE FUNCTION public.can_manage_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role,'moderator'::app_role,'helpdesk_manager'::app_role)
  );
$$;
GRANT EXECUTE ON FUNCTION public.can_manage_access(uuid) TO authenticated;

-- Effective access check: expired or revoked grants never count.
CREATE OR REPLACE FUNCTION public.has_page_access(_user_id uuid, _page_key text, _action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.access_grants g
    WHERE g.user_id = _user_id
      AND g.page_key = _page_key
      AND _action = ANY (g.actions)
      AND g.revoked_at IS NULL
      AND (g.expires_at IS NULL OR g.expires_at > now())
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_page_access(uuid, text, text) TO authenticated;

-- Housekeeping: stamp expired grants as revoked (safe to run from cron).
CREATE OR REPLACE FUNCTION public.expire_access_grants()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE public.access_grants
     SET revoked_at = now(), updated_at = now()
   WHERE revoked_at IS NULL AND expires_at IS NOT NULL AND expires_at <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
GRANT EXECUTE ON FUNCTION public.expire_access_grants() TO authenticated, service_role;

-- ------------------------------------------------------------ triggers
DROP TRIGGER IF EXISTS trg_access_requests_updated ON public.access_requests;
CREATE TRIGGER trg_access_requests_updated BEFORE UPDATE ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_access_grants_updated ON public.access_grants;
CREATE TRIGGER trg_access_grants_updated BEFORE UPDATE ON public.access_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Approval materialises a (possibly expiring) grant; denial/revocation kills it.
CREATE OR REPLACE FUNCTION public.on_access_request_decided()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  NEW.decided_at := now();
  NEW.decided_by := COALESCE(NEW.decided_by, auth.uid());

  IF NEW.status = 'approved' THEN
    IF NEW.expires_at IS NULL AND NEW.requested_days IS NOT NULL AND NEW.requested_days > 0 THEN
      NEW.expires_at := now() + (NEW.requested_days || ' days')::interval;
    END IF;
    INSERT INTO public.access_grants (user_id, page_key, actions, request_id, granted_by, note, expires_at)
    VALUES (NEW.user_id, NEW.page_key, NEW.actions, NEW.id, NEW.decided_by, NEW.decision_note, NEW.expires_at);
  ELSIF NEW.status IN ('denied','revoked') THEN
    UPDATE public.access_grants
       SET revoked_at = now(), updated_at = now()
     WHERE request_id = NEW.id AND revoked_at IS NULL;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_access_request_decided ON public.access_requests;
CREATE TRIGGER trg_access_request_decided BEFORE UPDATE ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.on_access_request_decided();

-- ------------------------------------------------------------ policies
DROP POLICY IF EXISTS "Users read own access requests" ON public.access_requests;
CREATE POLICY "Users read own access requests" ON public.access_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_access(auth.uid()));

DROP POLICY IF EXISTS "Users create own access requests" ON public.access_requests;
CREATE POLICY "Users create own access requests" ON public.access_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Managers decide access requests" ON public.access_requests;
CREATE POLICY "Managers decide access requests" ON public.access_requests
  FOR UPDATE TO authenticated
  USING (public.can_manage_access(auth.uid()))
  WITH CHECK (public.can_manage_access(auth.uid()));

DROP POLICY IF EXISTS "Managers delete access requests" ON public.access_requests;
CREATE POLICY "Managers delete access requests" ON public.access_requests
  FOR DELETE TO authenticated
  USING (public.can_manage_access(auth.uid()));

DROP POLICY IF EXISTS "Users read own active grants" ON public.access_grants;
CREATE POLICY "Users read own active grants" ON public.access_grants
  FOR SELECT TO authenticated
  USING (
    public.can_manage_access(auth.uid())
    OR (user_id = auth.uid() AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now()))
  );

DROP POLICY IF EXISTS "Managers manage grants" ON public.access_grants;
CREATE POLICY "Managers manage grants" ON public.access_grants
  FOR ALL TO authenticated
  USING (public.can_manage_access(auth.uid()))
  WITH CHECK (public.can_manage_access(auth.uid()));