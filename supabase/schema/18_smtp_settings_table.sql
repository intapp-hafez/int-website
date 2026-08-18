-- ==========================================================
-- Migration 18: Dynamic SMTP & Outgoing Mail Settings
-- ==========================================================
-- Table: public.smtp_settings
-- Stores dynamic mail server credentials, encryption, sender identity,
-- and verification test status with real-time sync & admin RLS.
-- ==========================================================

-- 1. Create table if not present
CREATE TABLE IF NOT EXISTS public.smtp_settings (
  id text PRIMARY KEY DEFAULT 'main',
  host text NOT NULL DEFAULT 'smtp.hostinger.com',
  port integer NOT NULL DEFAULT 465,
  secure boolean NOT NULL DEFAULT true,
  provider text NOT NULL DEFAULT 'hostinger',
  encryption_type text NOT NULL DEFAULT 'ssl',
  username text NOT NULL DEFAULT 'info@integratedtechnics.com',
  password text NOT NULL DEFAULT '',
  from_name text NOT NULL DEFAULT 'Integrated Technics',
  from_email text NOT NULL DEFAULT 'info@integratedtechnics.com',
  reply_to text NOT NULL DEFAULT 'sales@integratedtechnics.com',
  enabled boolean NOT NULL DEFAULT true,
  test_recipient text DEFAULT 'info@integratedtechnics.com',
  last_tested_at timestamptz,
  last_test_status text,
  last_test_log text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Safely add any missing columns if the table already existed with an older schema
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'hostinger';
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS encryption_type text NOT NULL DEFAULT 'ssl';
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS test_recipient text DEFAULT 'info@integratedtechnics.com';
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS last_tested_at timestamptz;
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS last_test_status text;
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS last_test_log text;
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS from_name text NOT NULL DEFAULT 'Integrated Technics';
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS from_email text NOT NULL DEFAULT 'info@integratedtechnics.com';
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS reply_to text NOT NULL DEFAULT 'sales@integratedtechnics.com';
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS secure boolean NOT NULL DEFAULT true;
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS host text NOT NULL DEFAULT 'smtp.hostinger.com';
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS port integer NOT NULL DEFAULT 465;
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS username text NOT NULL DEFAULT 'info@integratedtechnics.com';
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS password text NOT NULL DEFAULT '';
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.smtp_settings ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

-- 4. Admins have full access to manage and test SMTP credentials
DROP POLICY IF EXISTS "Admins can view and manage SMTP settings" ON public.smtp_settings;
CREATE POLICY "Admins can view and manage SMTP settings"
  ON public.smtp_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Public read for serverless functions / notification dispatcher
DROP POLICY IF EXISTS "SMTP settings publicly readable" ON public.smtp_settings;
CREATE POLICY "SMTP settings publicly readable"
  ON public.smtp_settings
  FOR SELECT
  USING (true);

-- 6. Upsert baseline default record
INSERT INTO public.smtp_settings (
  id,
  host,
  port,
  secure,
  provider,
  encryption_type,
  username,
  from_name,
  from_email,
  reply_to,
  enabled
)
VALUES (
  'main',
  'smtp.hostinger.com',
  465,
  true,
  'hostinger',
  'ssl',
  'info@integratedtechnics.com',
  'Integrated Technics',
  'info@integratedtechnics.com',
  'sales@integratedtechnics.com',
  true
)
ON CONFLICT (id) DO UPDATE SET
  provider = EXCLUDED.provider,
  encryption_type = EXCLUDED.encryption_type,
  updated_at = now();

-- 7. Updated_at trigger
DROP TRIGGER IF EXISTS trg_smtp_settings_updated_at ON public.smtp_settings;
CREATE TRIGGER trg_smtp_settings_updated_at
  BEFORE UPDATE ON public.smtp_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
