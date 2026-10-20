-- =================================================================
-- Full Technology Partners Seed & Sync from integratedtechnics.com
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql
-- =================================================================

-- 1. Ensure table structure and public read policy exist
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  logo text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '',
  description_en text DEFAULT '',
  description_ar text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active partners" ON public.partners;
CREATE POLICY "Public reads active partners"
  ON public.partners FOR SELECT
  USING (active = true);

-- 2. Idempotent Upsert for all 48 partners from integratedtechnics.com
DO $$
BEGIN


  -- Cisco Systems
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Cisco Systems')) THEN
    UPDATE public.partners
    SET
      name_ar = 'سيسكو',
      logo = '/partners/cisco-systems.png',
      href = 'https://www.cisco.com/',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Cisco Systems');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Cisco Systems', 'سيسكو', '/partners/cisco-systems.png', 'https://www.cisco.com/', true, 0, true);
  END IF;

  -- Dell
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Dell')) THEN
    UPDATE public.partners
    SET
      name_ar = 'ديل تكنولوجيز',
      logo = '/partners/dell.jpg',
      href = 'https://www.delltechnologies.com/',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Dell');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Dell', 'ديل تكنولوجيز', '/partners/dell.jpg', 'https://www.delltechnologies.com/', true, 1, true);
  END IF;

  -- Fortinet
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Fortinet')) THEN
    UPDATE public.partners
    SET
      name_ar = 'فورتينت',
      logo = '/partners/fortinet.jpg',
      href = 'https://www.fortinet.com/',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Fortinet');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Fortinet', 'فورتينت', '/partners/fortinet.jpg', 'https://www.fortinet.com/', true, 2, true);
  END IF;

  -- Aruba Networks
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Aruba Networks')) THEN
    UPDATE public.partners
    SET
      name_ar = 'أروبا نتوركس',
      logo = '/partners/aruba-networks.jpg',
      href = 'https://www.arubanetworks.com/',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Aruba Networks');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Aruba Networks', 'أروبا نتوركس', '/partners/aruba-networks.jpg', 'https://www.arubanetworks.com/', true, 3, true);
  END IF;

  -- H3C
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('H3C')) THEN
    UPDATE public.partners
    SET
      name_ar = 'إتش ثري سي',
      logo = '/partners/h3c.png',
      href = 'https://www.h3c.com/en/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('H3C');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('H3C', 'إتش ثري سي', '/partners/h3c.png', 'https://www.h3c.com/en/', true, 4, false);
  END IF;

  -- Ericsson
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Ericsson')) THEN
    UPDATE public.partners
    SET
      name_ar = 'إريكسون',
      logo = '/partners/ericsson.jpg',
      href = 'https://www.ericsson.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Ericsson');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Ericsson', 'إريكسون', '/partners/ericsson.jpg', 'https://www.ericsson.com/', true, 5, false);
  END IF;

  -- Aviat Networks
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Aviat Networks')) THEN
    UPDATE public.partners
    SET
      name_ar = 'أفيات نتوركس',
      logo = '/partners/aviat-networks.png',
      href = 'https://aviatnetworks.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Aviat Networks');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Aviat Networks', 'أفيات نتوركس', '/partners/aviat-networks.png', 'https://aviatnetworks.com/', true, 6, false);
  END IF;

  -- Motorola Solutions
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Motorola Solutions')) THEN
    UPDATE public.partners
    SET
      name_ar = 'موتورولا سوليوشنز',
      logo = '/partners/motorola-solutions.png',
      href = 'https://www.motorolasolutions.com/en_xu.html',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Motorola Solutions');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Motorola Solutions', 'موتورولا سوليوشنز', '/partners/motorola-solutions.png', 'https://www.motorolasolutions.com/en_xu.html', true, 7, true);
  END IF;

  -- Pelco
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Pelco')) THEN
    UPDATE public.partners
    SET
      name_ar = 'بيلكو',
      logo = '/partners/pelco.jpg',
      href = 'https://www.pelco.com/products/cameras/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Pelco');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Pelco', 'بيلكو', '/partners/pelco.jpg', 'https://www.pelco.com/products/cameras/', true, 8, false);
  END IF;

  -- Avigilon
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Avigilon')) THEN
    UPDATE public.partners
    SET
      name_ar = 'أفيجيلون',
      logo = '/partners/avigilon.png',
      href = 'https://docs.avigilon.com/',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Avigilon');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Avigilon', 'أفيجيلون', '/partners/avigilon.png', 'https://docs.avigilon.com/', true, 9, true);
  END IF;

  -- HALO Smart Sensor
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('HALO Smart Sensor')) THEN
    UPDATE public.partners
    SET
      name_ar = 'مستشعر هالو الذكي',
      logo = '/partners/halo-smart-sensor.png',
      href = 'https://halodetect.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('HALO Smart Sensor');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('HALO Smart Sensor', 'مستشعر هالو الذكي', '/partners/halo-smart-sensor.png', 'https://halodetect.com/', true, 10, false);
  END IF;

  -- genetec
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('genetec')) THEN
    UPDATE public.partners
    SET
      name_ar = 'جينيتك',
      logo = '/partners/genetec.jpg',
      href = 'https://www.genetec.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('genetec');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('genetec', 'جينيتك', '/partners/genetec.jpg', 'https://www.genetec.com/', true, 11, false);
  END IF;

  -- LINEV SYSTEMS
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('LINEV SYSTEMS')) THEN
    UPDATE public.partners
    SET
      name_ar = 'لينيف سيستمز',
      logo = '/partners/linev-systems.png',
      href = 'https://www.linevsystems.com/products/security-x-ray-screening/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('LINEV SYSTEMS');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('LINEV SYSTEMS', 'لينيف سيستمز', '/partners/linev-systems.png', 'https://www.linevsystems.com/products/security-x-ray-screening/', true, 12, false);
  END IF;

  -- CEIA
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('CEIA')) THEN
    UPDATE public.partners
    SET
      name_ar = 'سي إي آي إيه',
      logo = '/partners/ceia.png',
      href = 'https://www.ceia.net/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('CEIA');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('CEIA', 'سي إي آي إيه', '/partners/ceia.png', 'https://www.ceia.net/', true, 13, false);
  END IF;

  -- Hikvision
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Hikvision')) THEN
    UPDATE public.partners
    SET
      name_ar = 'هيكفيجن',
      logo = '/partners/hikvision.png',
      href = 'https://www.hikvision.com/uk/',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Hikvision');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Hikvision', 'هيكفيجن', '/partners/hikvision.png', 'https://www.hikvision.com/uk/', true, 14, true);
  END IF;

  -- ANALOGIC
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('ANALOGIC')) THEN
    UPDATE public.partners
    SET
      name_ar = 'أنالوجيك',
      logo = '/partners/analogic.png',
      href = 'https://www.analogic.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('ANALOGIC');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('ANALOGIC', 'أنالوجيك', '/partners/analogic.png', 'https://www.analogic.com/', true, 15, false);
  END IF;

  -- Milestone Systems
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Milestone Systems')) THEN
    UPDATE public.partners
    SET
      name_ar = 'مايلستون سيستمز',
      logo = '/partners/milestone-systems.jpg',
      href = 'https://www.milestonesys.com/',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Milestone Systems');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Milestone Systems', 'مايلستون سيستمز', '/partners/milestone-systems.jpg', 'https://www.milestonesys.com/', true, 16, true);
  END IF;

  -- FAAC
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('FAAC')) THEN
    UPDATE public.partners
    SET
      name_ar = 'تقنيات فاك',
      logo = '/partners/faac-technology.jpg',
      href = 'https://www.faac.co.uk/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('FAAC');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('FAAC', 'تقنيات فاك', '/partners/faac-technology.jpg', 'https://www.faac.co.uk/', true, 17, false);
  END IF;

  -- ICT
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('ICT')) THEN
    UPDATE public.partners
    SET
      name_ar = 'آي سي تي للأمن',
      logo = '/partners/ict.png',
      href = 'https://ict.co/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('ICT');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('ICT', 'آي سي تي للأمن', '/partners/ict.png', 'https://ict.co/', true, 18, false);
  END IF;

  -- stid
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('stid')) THEN
    UPDATE public.partners
    SET
      name_ar = 'إس تي آي دي',
      logo = '/partners/stid.jpg',
      href = 'https://stid-security.com/en/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('stid');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('stid', 'إس تي آي دي', '/partners/stid.jpg', 'https://stid-security.com/en/', true, 19, false);
  END IF;

  -- BAS-IP
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('BAS-IP')) THEN
    UPDATE public.partners
    SET
      name_ar = 'باس آي بي',
      logo = '/partners/bas-ip.jpg',
      href = 'https://bas-ip.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('BAS-IP');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('BAS-IP', 'باس آي بي', '/partners/bas-ip.jpg', 'https://bas-ip.com/', true, 20, false);
  END IF;

  -- SALTO Systems
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('SALTO Systems')) THEN
    UPDATE public.partners
    SET
      name_ar = 'سالتو سيستمز',
      logo = '/partners/salto-systems.png',
      href = 'https://saltosystems.com/en/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('SALTO Systems');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('SALTO Systems', 'سالتو سيستمز', '/partners/salto-systems.png', 'https://saltosystems.com/en/', true, 21, false);
  END IF;

  -- TBS
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('TBS')) THEN
    UPDATE public.partners
    SET
      name_ar = 'تي بي إس للقياسات الحيوية',
      logo = '/partners/tbs.jpg',
      href = 'https://tbs-biometrics.com/en/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('TBS');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('TBS', 'تي بي إس للقياسات الحيوية', '/partners/tbs.jpg', 'https://tbs-biometrics.com/en/', true, 22, false);
  END IF;

  -- Inner Range
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Inner Range')) THEN
    UPDATE public.partners
    SET
      name_ar = 'إنر رينج',
      logo = '/partners/inner-range.jpg',
      href = 'https://www.innerrange.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Inner Range');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Inner Range', 'إنر رينج', '/partners/inner-range.jpg', 'https://www.innerrange.com/', true, 23, false);
  END IF;

  -- B&K
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('B&K')) THEN
    UPDATE public.partners
    SET
      name_ar = 'بي آند كيه للأنظمة الأمنية',
      logo = '/partners/b-k.jpg',
      href = 'https://bk-securitysystems.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('B&K');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('B&K', 'بي آند كيه للأنظمة الأمنية', '/partners/b-k.jpg', 'https://bk-securitysystems.com/', true, 24, false);
  END IF;

  -- Secuscan
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Secuscan')) THEN
    UPDATE public.partners
    SET
      name_ar = 'سيكيوسكان',
      logo = '/partners/secuscan.jpg',
      href = 'https://www.secuscan.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Secuscan');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Secuscan', 'سيكيوسكان', '/partners/secuscan.jpg', 'https://www.secuscan.com/', true, 25, false);
  END IF;

  -- Magnetic
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Magnetic')) THEN
    UPDATE public.partners
    SET
      name_ar = 'ماجنتيك أوتودور',
      logo = '/partners/magnetic.jpg',
      href = 'https://www.magnetic-access.com/en/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Magnetic');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Magnetic', 'ماجنتيك أوتودور', '/partners/magnetic.jpg', 'https://www.magnetic-access.com/en/', true, 26, false);
  END IF;

  -- HUB
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('HUB')) THEN
    UPDATE public.partners
    SET
      name_ar = 'هاب للمواقف الذكية',
      logo = '/partners/hub.jpg',
      href = 'https://www.hubparking.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('HUB');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('HUB', 'هاب للمواقف الذكية', '/partners/hub.jpg', 'https://www.hubparking.com/', true, 27, false);
  END IF;

  -- Herta
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Herta')) THEN
    UPDATE public.partners
    SET
      name_ar = 'هيرتا سيكيورتي',
      logo = '/partners/herta.jpg',
      href = 'https://hertasecurity.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Herta');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Herta', 'هيرتا سيكيورتي', '/partners/herta.jpg', 'https://hertasecurity.com/', true, 28, false);
  END IF;

  -- Tattile
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Tattile')) THEN
    UPDATE public.partners
    SET
      name_ar = 'تاتيل للرؤية الذكية',
      logo = '/partners/tattile.jpg',
      href = 'https://www.tattile.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Tattile');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Tattile', 'تاتيل للرؤية الذكية', '/partners/tattile.jpg', 'https://www.tattile.com/', true, 29, false);
  END IF;

  -- Schneider Electric
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Schneider Electric')) THEN
    UPDATE public.partners
    SET
      name_ar = 'شنايدر إلكتريك',
      logo = '/partners/schneider-electric.jpg',
      href = 'https://www.se.com/',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Schneider Electric');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Schneider Electric', 'شنايدر إلكتريك', '/partners/schneider-electric.jpg', 'https://www.se.com/', true, 30, true);
  END IF;

  -- IEE SA
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('IEE SA')) THEN
    UPDATE public.partners
    SET
      name_ar = 'آي إي إي',
      logo = '/partners/iee-sa.jpg',
      href = 'https://www.iee-sensing.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('IEE SA');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('IEE SA', 'آي إي إي', '/partners/iee-sa.jpg', 'https://www.iee-sensing.com/', true, 31, false);
  END IF;

  -- Crestron
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Crestron')) THEN
    UPDATE public.partners
    SET
      name_ar = 'كريسترون',
      logo = '/partners/crestron.png',
      href = 'https://www.crestron.com/',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Crestron');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Crestron', 'كريسترون', '/partners/crestron.png', 'https://www.crestron.com/', true, 32, true);
  END IF;

  -- TOA Electronics
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('TOA Electronics')) THEN
    UPDATE public.partners
    SET
      name_ar = 'تي أو إيه للصوتيات',
      logo = '/partners/toa-electronics.jpg',
      href = 'https://www.toaelectronics.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('TOA Electronics');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('TOA Electronics', 'تي أو إيه للصوتيات', '/partners/toa-electronics.jpg', 'https://www.toaelectronics.com/', true, 33, false);
  END IF;

  -- ABSEN
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('ABSEN')) THEN
    UPDATE public.partners
    SET
      name_ar = 'أبسن للشاشات',
      logo = '/partners/absen.png',
      href = 'https://www.absen.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('ABSEN');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('ABSEN', 'أبسن للشاشات', '/partners/absen.png', 'https://www.absen.com/', true, 34, false);
  END IF;

  -- exterity
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('exterity')) THEN
    UPDATE public.partners
    SET
      name_ar = 'إكستيريتي',
      logo = '/partners/exterity.jpg',
      href = 'https://www.exterity.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('exterity');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('exterity', 'إكستيريتي', '/partners/exterity.jpg', 'https://www.exterity.com/', true, 35, false);
  END IF;

  -- Biamp
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Biamp')) THEN
    UPDATE public.partners
    SET
      name_ar = 'بيامب',
      logo = '/partners/biamp.jpg',
      href = 'https://www.biamp.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Biamp');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Biamp', 'بيامب', '/partners/biamp.jpg', 'https://www.biamp.com/', true, 36, false);
  END IF;

  -- Barco
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Barco')) THEN
    UPDATE public.partners
    SET
      name_ar = 'باركو',
      logo = '/partners/barco.jpg',
      href = 'https://www.barco.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Barco');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Barco', 'باركو', '/partners/barco.jpg', 'https://www.barco.com/', true, 37, false);
  END IF;

  -- LundHalsey
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('LundHalsey')) THEN
    UPDATE public.partners
    SET
      name_ar = 'لوند هالسي',
      logo = '/partners/lundhalsey.jpg',
      href = 'https://www.lundhalsey.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('LundHalsey');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('LundHalsey', 'لوند هالسي', '/partners/lundhalsey.jpg', 'https://www.lundhalsey.com/', true, 38, false);
  END IF;

  -- Triple Play
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Triple Play')) THEN
    UPDATE public.partners
    SET
      name_ar = 'تريبل بلاي',
      logo = '/partners/triple-play.png',
      href = 'https://tripleplay.tv/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Triple Play');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Triple Play', 'تريبل بلاي', '/partners/triple-play.png', 'https://tripleplay.tv/', true, 39, false);
  END IF;

  -- GESAB
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('GESAB')) THEN
    UPDATE public.partners
    SET
      name_ar = 'جيساب لغرف التحكم',
      logo = '/partners/gesab.jpg',
      href = 'https://gesab.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('GESAB');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('GESAB', 'جيساب لغرف التحكم', '/partners/gesab.jpg', 'https://gesab.com/', true, 40, false);
  END IF;

  -- LG Electronics
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('LG Electronics')) THEN
    UPDATE public.partners
    SET
      name_ar = 'إل جي إلكترونيكس',
      logo = '/partners/lg-electronics.jpg',
      href = 'https://lg.com',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('LG Electronics');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('LG Electronics', 'إل جي إلكترونيكس', '/partners/lg-electronics.jpg', 'https://lg.com', true, 41, true);
  END IF;

  -- Samsung
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Samsung')) THEN
    UPDATE public.partners
    SET
      name_ar = 'سامسونج',
      logo = '/partners/samsung.jpg',
      href = 'https://www.samsung.com/',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Samsung');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Samsung', 'سامسونج', '/partners/samsung.jpg', 'https://www.samsung.com/', true, 42, true);
  END IF;

  -- Interel
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Interel')) THEN
    UPDATE public.partners
    SET
      name_ar = 'إنترريل',
      logo = '/partners/interel.jpg',
      href = 'https://interel.com/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Interel');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Interel', 'إنترريل', '/partners/interel.jpg', 'https://interel.com/', true, 43, false);
  END IF;

  -- Bsvt
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Bsvt')) THEN
    UPDATE public.partners
    SET
      name_ar = 'بي إس في تي',
      logo = '/partners/bsvt.jpg',
      href = 'https://bsvt.by/en/',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Bsvt');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Bsvt', 'بي إس في تي', '/partners/bsvt.jpg', 'https://bsvt.by/en/', true, 44, false);
  END IF;

  -- lemt
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('lemt')) THEN
    UPDATE public.partners
    SET
      name_ar = 'ليمت',
      logo = '/partners/lemt.jpg',
      href = 'https://www.google.com/search?q=lemt%20official%20website',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('lemt');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('lemt', 'ليمت', '/partners/lemt.jpg', 'https://www.google.com/search?q=lemt%20official%20website', true, 45, false);
  END IF;

  -- Display
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Display')) THEN
    UPDATE public.partners
    SET
      name_ar = 'ديسبلاي',
      logo = '/partners/display.jpg',
      href = 'https://www.google.com/search?q=Display%20official%20website',
      featured = false,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Display');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Display', 'ديسبلاي', '/partners/display.jpg', 'https://www.google.com/search?q=Display%20official%20website', true, 46, false);
  END IF;

  -- Check Point
  IF EXISTS (SELECT 1 FROM public.partners WHERE lower(name_en) = lower('Check Point')) THEN
    UPDATE public.partners
    SET
      name_ar = 'تشيك بوينت سيكيورتي',
      logo = '/partners/check-point.png',
      href = 'https://www.checkpoint.com/',
      featured = true,
      active = true,
      updated_at = now()
    WHERE lower(name_en) = lower('Check Point');
  ELSE
    INSERT INTO public.partners (name_en, name_ar, logo, href, active, sort_order, featured)
    VALUES ('Check Point', 'تشيك بوينت سيكيورتي', '/partners/check-point.png', 'https://www.checkpoint.com/', true, 47, true);
  END IF;

END $$;

-- 3. Verify inserted partners count
SELECT count(*) AS total_partners FROM public.partners;
