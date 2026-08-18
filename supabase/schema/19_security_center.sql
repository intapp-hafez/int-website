-- ==========================================================
-- Migration 19: Dynamic Security Center & Audit System
-- ==========================================================
-- Tables:
-- 1. public.security_scans (Scan history, findings, metrics)
-- 2. public.security_remediations (Persistent checklist items)
-- 3. public.security_settings (Firewall, WAF, auto-scan, alerts)
-- ==========================================================

-- 1. Scan History Table
CREATE TABLE IF NOT EXISTS public.security_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text NOT NULL,
  template_name text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  findings_count integer NOT NULL DEFAULT 0,
  critical_count integer NOT NULL DEFAULT 0,
  high_count integer NOT NULL DEFAULT 0,
  medium_count integer NOT NULL DEFAULT 0,
  low_count integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Ensure all columns in case table existed
ALTER TABLE public.security_scans ADD COLUMN IF NOT EXISTS template_id text NOT NULL DEFAULT 'owasp';
ALTER TABLE public.security_scans ADD COLUMN IF NOT EXISTS template_name text NOT NULL DEFAULT 'OWASP Top 10';
ALTER TABLE public.security_scans ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';
ALTER TABLE public.security_scans ADD COLUMN IF NOT EXISTS findings_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.security_scans ADD COLUMN IF NOT EXISTS critical_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.security_scans ADD COLUMN IF NOT EXISTS high_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.security_scans ADD COLUMN IF NOT EXISTS medium_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.security_scans ADD COLUMN IF NOT EXISTS low_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.security_scans ADD COLUMN IF NOT EXISTS duration_seconds integer NOT NULL DEFAULT 0;
ALTER TABLE public.security_scans ADD COLUMN IF NOT EXISTS findings jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.security_scans ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.security_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage security scans" ON public.security_scans;
CREATE POLICY "Admins manage security scans"
  ON public.security_scans
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Security scans readable" ON public.security_scans;
CREATE POLICY "Security scans readable"
  ON public.security_scans
  FOR SELECT
  USING (true);


-- 2. Remediations Status Table
CREATE TABLE IF NOT EXISTS public.security_remediations (
  id text PRIMARY KEY, -- format: "rule_id:step_index"
  rule_id text NOT NULL,
  step_index integer NOT NULL,
  is_fixed boolean NOT NULL DEFAULT false,
  fixed_at timestamptz,
  fixed_by text,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_remediations ADD COLUMN IF NOT EXISTS rule_id text NOT NULL DEFAULT '';
ALTER TABLE public.security_remediations ADD COLUMN IF NOT EXISTS step_index integer NOT NULL DEFAULT 0;
ALTER TABLE public.security_remediations ADD COLUMN IF NOT EXISTS is_fixed boolean NOT NULL DEFAULT false;
ALTER TABLE public.security_remediations ADD COLUMN IF NOT EXISTS fixed_at timestamptz;
ALTER TABLE public.security_remediations ADD COLUMN IF NOT EXISTS fixed_by text;
ALTER TABLE public.security_remediations ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.security_remediations ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.security_remediations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage security remediations" ON public.security_remediations;
CREATE POLICY "Admins manage security remediations"
  ON public.security_remediations
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Security remediations readable" ON public.security_remediations;
CREATE POLICY "Security remediations readable"
  ON public.security_remediations
  FOR SELECT
  USING (true);


-- 3. Security Settings Table (Firewall, WAF, Alerts)
CREATE TABLE IF NOT EXISTS public.security_settings (
  id text PRIMARY KEY DEFAULT 'main',
  auto_scan_enabled boolean NOT NULL DEFAULT true,
  scan_frequency text NOT NULL DEFAULT 'weekly',
  alert_email text NOT NULL DEFAULT 'security@integratedtechnics.com',
  alert_on_critical boolean NOT NULL DEFAULT true,
  alert_on_high boolean NOT NULL DEFAULT true,
  blocked_ips jsonb NOT NULL DEFAULT '[]'::jsonb,
  rate_limit_rpm integer NOT NULL DEFAULT 120,
  waf_mode text NOT NULL DEFAULT 'active',
  health_score integer NOT NULL DEFAULT 95,
  last_full_scan_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS auto_scan_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS scan_frequency text NOT NULL DEFAULT 'weekly';
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS alert_email text NOT NULL DEFAULT 'security@integratedtechnics.com';
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS alert_on_critical boolean NOT NULL DEFAULT true;
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS alert_on_high boolean NOT NULL DEFAULT true;
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS blocked_ips jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS rate_limit_rpm integer NOT NULL DEFAULT 120;
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS waf_mode text NOT NULL DEFAULT 'active';
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS health_score integer NOT NULL DEFAULT 95;
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS last_full_scan_at timestamptz;
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage security settings" ON public.security_settings;
CREATE POLICY "Admins manage security settings"
  ON public.security_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Security settings readable" ON public.security_settings;
CREATE POLICY "Security settings readable"
  ON public.security_settings
  FOR SELECT
  USING (true);

-- Upsert baseline security settings record
INSERT INTO public.security_settings (
  id,
  auto_scan_enabled,
  scan_frequency,
  alert_email,
  alert_on_critical,
  alert_on_high,
  blocked_ips,
  rate_limit_rpm,
  waf_mode,
  health_score
)
VALUES (
  'main',
  true,
  'weekly',
  'security@integratedtechnics.com',
  true,
  true,
  '[{"ip":"198.51.100.42","reason":"Malicious SQL injection attempt","added_at":"2026-08-10T14:20:00Z"}]'::jsonb,
  120,
  'active',
  95
)
ON CONFLICT (id) DO NOTHING;
