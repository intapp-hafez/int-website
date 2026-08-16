-- =================================================================
-- 15_faqs_table.sql
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql
-- =================================================================

-- 1. Create FAQs table
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en text NOT NULL DEFAULT '',
  question_ar text NOT NULL DEFAULT '',
  answer_en text NOT NULL DEFAULT '',
  answer_ar text NOT NULL DEFAULT '',
  category_en text NOT NULL DEFAULT 'General',
  category_ar text NOT NULL DEFAULT 'عام',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Public can view active faqs" ON public.faqs;
CREATE POLICY "Public can view active faqs" ON public.faqs FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins manage faqs" ON public.faqs;
CREATE POLICY "Admins manage faqs" ON public.faqs FOR ALL TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Trigger for updated_at
DROP TRIGGER IF EXISTS trg_faqs_updated_at ON public.faqs;
CREATE TRIGGER trg_faqs_updated_at BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Seed Enterprise Bilingual FAQs
INSERT INTO public.faqs (
  question_en, question_ar, answer_en, answer_ar, category_en, category_ar, active, sort_order
) VALUES
(
  'What industries and enterprise sectors do you serve?',
  'ما القطاعات والمجالات التي تخدمونها؟',
  'Integrated Technics serves government entities, banking & financial institutions, healthcare networks, oil & gas facilities, telecommunications operators, and commercial mega-campuses across Egypt and the MENA region.',
  'تقدم إنترجريتد تكنيكس خدماتها للجهات الحكومية، القطاع المصرفي والبنوك، مجمعات الرعاية الصحية، قطاع البترول والغاز، مشغلي الاتصالات، والمشاريع التجارية الكبرى في مصر والشرق الأوسط.',
  'General',
  'عام',
  true,
  1
),
(
  'What types of security surveillance and CCTV systems do you engineer?',
  'ما نوعية أنظمة المراقبة والكاميرات CCTV التي تقومون بتنفيذها؟',
  'We engineer turnkey IP surveillance solutions ranging from 4K/8K AI-driven cameras, Automated Number Plate Recognition (ANPR), perimeter thermal radar, and explosive-proof ATEX cameras to centralized multi-tier video management systems (VMS) with video wall command centers.',
  'نقوم بتصميم وتنفيذ حلول المراقبة الذكية المتكاملة بدقة 4K و8K المدعومة بالذكاء الاصطناعي، أنظمة التعرف على لوحات السيارات، الرادارات الحرارية لتأمين الأسوار، والكاميرات المقاومة للانفجار مع ربطها بغرف تحكم مركزية وشاشات عرض موحدة.',
  'Security & CCTV',
  'الأنظمة الأمنية والمراقبة',
  true,
  2
),
(
  'Do you design and build certified Tier-3 / Tier-4 data centers?',
  'هل تقومون بتصميم وبناء مراكز بيانات معتمدة من المستوى الثالث Tier-3؟',
  'Yes. We provide end-to-end data center turnkey delivery including precision cooling (CRAC/InRow), modular UPS power backup, clean-agent fire suppression (FM-200 / Novec 1230), environmental DCIM monitoring, and certified structured copper/fiber cabling.',
  'نعم. نقدم حلول مراكز البيانات الشاملة التي تشمل التبريد الدقيق، أنظمة الطاقة غير المنقطعة UPS المعيارية، أنظمة إطفاء الحرائق بالغازات النظيفة، أنظمة المراقبة البيئية DCIM، وتمديدات كابلات الفايبر والنحاس المعتمدة.',
  'Data Centers & Networks',
  'مراكز البيانات والشبكات',
  true,
  3
),
(
  'What post-deployment SLA support and maintenance packages are available?',
  'ما باقات الصيانة واتفاقيات مستوى الخدمة (SLA) المتاحة بعد التنفيذ؟',
  'We provide 24/7/365 proactive NOC monitoring, guaranteed on-site emergency dispatch within 2 hours, preventative quarterly maintenance audits, and full spare-parts replacement warranties tailored to critical enterprise operations.',
  'نوفر مراقبة استباقية لغرف العمليات على مدار الساعة 24/7، استجابة موقعية طارئة مضمونة خلال ساعتين، زيارات صيانة وقائية دورية، وضمان استبدال قطع الغيار الأصلية المعتمدة.',
  'Maintenance & SLAs',
  'الصيانة ومستويات الخدمة',
  true,
  4
),
(
  'Can your solutions integrate with our existing legacy infrastructure?',
  'هل يمكن دمج حلولكم مع أنظمتنا الحالية ومعداتنا السابقة؟',
  'Yes. Our certified systems architects specialize in vendor-agnostic interoperability using standard open APIs (ONVIF, BACnet, Modbus, REST, SNMP) to unify legacy equipment with state-of-the-art management platforms seamlessly.',
  'نعم. يتخصص مهندسونا المعتمدون في التكامل بين مختلف الأنظمة والمصنعين عبر البروتوكولات المفتوحة (ONVIF، BACnet، Modbus، REST، SNMP) لربط الأنظمة القائمة مع منصات الإدارة الحديثة بدون تعارض.',
  'Integration',
  'التكامل والربط البرمجي',
  true,
  5
),
(
  'What interactive audio/visual and smart boardroom technologies do you supply?',
  'ما حلول القاعات الذكية والأنظمة الصوتية والمرئية التي تقدمونها؟',
  'We install unified conferencing rooms featuring beamforming microphone arrays, automated speaker tracking 4K PTZ cameras, wireless screen sharing, ultra-narrow LED video walls, and centralized touch automation (Crestron/Extron).',
  'نقوم بتجهيز قاعات المؤتمرات التفاعلية بمصفوفات ميكروفونات ذكية لتتبع المتحدثين، كاميرات 4K PTZ آلية، شاشات عرض عملاقة بدون حواف، وأنظمة تحكم أوتوماتيكي ذكي تعمل باللمس.',
  'Audio & Visual',
  'الصوتيات والمرئيات',
  true,
  6
),
(
  'How do I request a technical site survey or commercial quotation?',
  'كيف يمكنني طلب معاينة موقعية أو عرض أسعار لمشروعي؟',
  'You can submit your project details via our /contact page, request a direct technical callback on WhatsApp, or email sales@integratedtechnics.com. A senior solutions engineer will contact you within 24 hours.',
  'يمكنك إرسال تفاصيل مشروعك عبر صفحة التواصل، أو طلب محادثة مباشرة عبر واتساب، أو مراسلتنا على sales@integratedtechnics.com، وسيتواصل معك مهندس حلول معتمد خلال 24 ساعة.',
  'General',
  'عام',
  true,
  7
);
