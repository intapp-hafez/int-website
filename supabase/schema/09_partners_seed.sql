-- =================================================================
-- Technology Partners Table & Seed Data
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql
-- =================================================================

CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  logo text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 1. Public read
DROP POLICY IF EXISTS "Partners publicly readable" ON public.partners;
CREATE POLICY "Partners publicly readable"
  ON public.partners FOR SELECT
  USING (true);

-- 2. Admins manage
DROP POLICY IF EXISTS "Admins manage partners" ON public.partners;
CREATE POLICY "Admins manage partners"
  ON public.partners FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Seed top enterprise technology partners
INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
VALUES
  ('Cisco Systems', 'سيسكو', 'https://cdn.simpleicons.org/cisco/005073', 'https://www.cisco.com', true, 0, true),
  ('Dell Technologies', 'ديل تكنولوجيز', 'https://cdn.simpleicons.org/dell/0076CE', 'https://www.dell.com', true, 1, true),
  ('Fortinet', 'فورتينت', 'https://cdn.simpleicons.org/fortinet/EE3124', 'https://www.fortinet.com', true, 2, true),
  ('Schneider Electric', 'شنايدر إلكتريك', 'https://cdn.simpleicons.org/schneiderelectric/3DCD58', 'https://www.se.com', true, 3, true),
  ('Hikvision', 'هيكفيجن', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Hikvision_logo.svg/800px-Hikvision_logo.svg.png', 'https://www.hikvision.com', true, 4, true),
  ('Dahua Technology', 'داهوا تكنولوجي', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Dahua_Technology_logo.svg/800px-Dahua_Technology_logo.svg.png', 'https://www.dahuasecurity.com', true, 5, true),
  ('Axis Communications', 'أكسيس كوميونيكيشنز', 'https://cdn.simpleicons.org/axiscommunications/FFD200', 'https://www.axis.com', true, 6, false),
  ('Bosch Security', 'بوش للأنظمة الأمنية', 'https://cdn.simpleicons.org/bosch/EA001F', 'https://www.boschsecurity.com', true, 7, false),
  ('Honeywell', 'هانيويل', 'https://cdn.simpleicons.org/honeywell/EE3124', 'https://www.honeywell.com', true, 8, false),
  ('HPE Aruba Networking', 'إتش بي إي أروبا', 'https://cdn.simpleicons.org/hp/0096D6', 'https://www.arubanetworks.com', true, 9, false),
  ('CommScope', 'كومسكوب', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/CommScope_Logo.svg/800px-CommScope_Logo.svg.png', 'https://www.commscope.com', true, 10, false),
  ('Panduit', 'باندويت', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Panduit_logo.svg/800px-Panduit_logo.svg.png', 'https://www.panduit.com', true, 11, false),
  ('Legrand', 'ليجراند', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Legrand_logo.svg/800px-Legrand_logo.svg.png', 'https://www.legrand.com', true, 12, false),
  ('VMware by Broadcom', 'في إم وير', 'https://cdn.simpleicons.org/vmware/607078', 'https://www.vmware.com', true, 13, false);
