
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS invoice_no text,
  ADD COLUMN IF NOT EXISTS invoice_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS invoice_currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS invoice_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS invoice_issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS invoice_paid_at timestamptz;

CREATE TABLE IF NOT EXISTS public.support_invoice_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  email text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_invoice_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invoice recipients"
ON public.support_invoice_recipients
FOR ALL
TO authenticated
USING (has_role(auth.uid(),'admin'::app_role))
WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_support_invoice_recipients_updated
BEFORE UPDATE ON public.support_invoice_recipients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
