-- =========================================
-- Access request quotes
-- Lets staff attach a price quote to an access request before approving it.
-- Run this in the Supabase SQL editor.
-- =========================================

CREATE TABLE IF NOT EXISTS public.access_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.access_requests(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EGP',
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_quotes TO authenticated;
GRANT ALL ON public.access_quotes TO service_role;

ALTER TABLE public.access_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers view access quotes" ON public.access_quotes;
CREATE POLICY "Managers view access quotes" ON public.access_quotes
  FOR SELECT TO authenticated
  USING (public.can_manage_access(auth.uid()));

DROP POLICY IF EXISTS "Managers manage access quotes" ON public.access_quotes;
CREATE POLICY "Managers manage access quotes" ON public.access_quotes
  FOR ALL TO authenticated
  USING (public.can_manage_access(auth.uid()))
  WITH CHECK (public.can_manage_access(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_access_quotes_request ON public.access_quotes(request_id);

DROP TRIGGER IF EXISTS trg_access_quotes_updated ON public.access_quotes;
CREATE TRIGGER trg_access_quotes_updated
  BEFORE UPDATE ON public.access_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
