-- =================================================================
-- 10_services_seed.sql
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql
-- =================================================================

CREATE TABLE IF NOT EXISTS public.services (
  slug text PRIMARY KEY,
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  desc_en text NOT NULL DEFAULT '',
  desc_ar text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  icon_name text NOT NULL DEFAULT 'Layers',
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta_title_en text,
  meta_title_ar text,
  meta_description_en text,
  meta_description_ar text,
  meta_keywords text,
  og_image text,
  canonical_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure column exists if table was already created
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Public can read all published services
DROP POLICY IF EXISTS "Public can view published services" ON public.services;
CREATE POLICY "Public can view published services"
  ON public.services FOR SELECT
  USING (true);

-- Admins can insert/update/delete services
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Seed Enterprise Services with "What We Deliver" Features
INSERT INTO public.services (slug, title_en, title_ar, desc_en, desc_ar, image, icon_name, published, sort_order, features)
VALUES
  (
    'security',
    'Security Systems',
    'أنظمة الأمن والمراقبة',
    'Enterprise-grade CCTV surveillance, biometric access control, intrusion detection, perimeter protection, and intelligent command & control centers.',
    'أنظمة مراقبة متطورة CCTV، والتحكم الذكي في الدخول، وأنظمة الإنذار المبكر وحماية المحيط وغرف القيادة والسيطرة المركزية.',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
    'Shield',
    true,
    1,
    '[
      {"en": "AI-powered CCTV surveillance & video analytics", "ar": "كاميرات مراقبة ذكية مدعومة بالذكاء الاصطناعي وتحليل الفيديو"},
      {"en": "Biometric & RFID access control systems", "ar": "أنظمة التحكم في الدخول الحيوية والبطاقات الذكية"},
      {"en": "Perimeter intrusion detection & alarm integration", "ar": "أنظمة حماية المحيط والإنذار المبكر ضد التسلل"},
      {"en": "Centralized Command & Control Center (C4I) consoles", "ar": "غرف تحكم وسيطرة مركزية متكاملة"},
      {"en": "Automated license plate recognition (ALPR/ANPR)", "ar": "أنظمة قراءة لوحات المركبات التلقائية"},
      {"en": "24/7 preventative maintenance & SLA compliance", "ar": "عقود صيانة وقائية 24/7 واستجابة فورية للأعطال"}
    ]'::jsonb
  ),
  (
    'network',
    'Network Infrastructure',
    'البنية التحتية للشبكات',
    'Certified structured cabling systems (Cat6A / Cat7 / Fiber Optics), enterprise LAN/WAN architecture, wireless switching, SDN backbones, and next-gen firewalls.',
    'تمديدات الكابلات الهيكلية المعتمدة (Cat6A / Cat7 والألياف الضوئية)، وهندسة الشبكات المؤسسية السلكية واللاسلكية، والشبكات المعرفة بالبرمجيات (SDN).',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    'Network',
    true,
    2,
    '[
      {"en": "Certified structured cabling (Cat6A / Cat7 / Fiber)", "ar": "تمديدات الكابلات الهيكلية والألياف الضوئية المعتمدة"},
      {"en": "High-availability Core & Edge switching backbones", "ar": "محولات شبكة رئيسية وفرعية عالية التوافرية"},
      {"en": "Enterprise Wi-Fi 6/6E wireless site surveys & tuning", "ar": "تغطية لاسلكية ذكية بمعايير Wi-Fi 6/6E ودراسات مسح ميداني"},
      {"en": "Software-Defined Networking (SDN) & SD-WAN", "ar": "شبكات معرّفة بالبرمجيات وحلول SD-WAN المتطورة"},
      {"en": "Next-Generation Firewall (NGFW) deployment", "ar": "جدران حماية وأمن شبكات من الجيل التالي"},
      {"en": "Full OTDR cable certification & documentation", "ar": "اختبارات واعتماد الكابلات بأجهزة OTDR ومخططات هندسية"}
    ]'::jsonb
  ),
  (
    'audio-video',
    'Audio / Video Systems',
    'الأنظمة الصوتية والمرئية',
    'Smart executive boardrooms, ultra-high-definition LED video walls, interactive digital signage, acoustic room treatment, and unified video conferencing systems.',
    'قاعات الاجتماعات الذكية، وشاشات العرض الجدارية LED فائقة الدقة، واللافتات الرقمية التفاعلية، وأنظمة المؤتمرات المرئية الموحدة.',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
    'MonitorPlay',
    true,
    3,
    '[
      {"en": "Smart interactive boardrooms & touch control panels", "ar": "قاعات اجتماعات ذكية تفاعلية مع شاشات تحكم لمسية"},
      {"en": "Ultra-HD fine-pitch LED & LCD video wall arrays", "ar": "شاشات عرض جدارية LED و LCD فائقة الوضوح"},
      {"en": "Unified Microsoft Teams / Zoom Rooms integration", "ar": "أنظمة مؤتمرات مرئية معتمدة لـ Teams و Zoom"},
      {"en": "Professional acoustic treatment & audio DSP calibration", "ar": "معالجة صوتية هندسية ومعايرة DSP متقدمة"},
      {"en": "Enterprise digital signage & IPTV distribution", "ar": "لافتات رقمية وشبكات توزيع محتوى IPTV مركزي"},
      {"en": "Wireless presentation & BYOD screen sharing", "ar": "حلول العرض اللاسلكي ومشاركة الشاشات الذكية"}
    ]'::jsonb
  ),
  (
    'data-centers',
    'Data Centers',
    'مراكز البيانات',
    'Tier-II/III/IV data center design and construction, precision cooling systems, modular UPS power distribution, containment racks, and DCIM environmental monitoring.',
    'تصميم وبناء مراكز البيانات المصنفة (Tier II/III/IV)، وأنظمة التبريد الدقيق، ووحدات UPS المعيارية، وحلول المراقبة البيئية DCIM.',
    'https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?w=800&q=80',
    'Server',
    true,
    4,
    '[
      {"en": "Tier-II/III/IV certified architectural & MEP layout", "ar": "تصميم معماري وهندسي متوافق مع معايير Tier II/III/IV"},
      {"en": "Precision InRow & perimeter cooling solutions", "ar": "أنظمة تبريد دقيق مع ممرات عزل حراري محكمة"},
      {"en": "Modular N+1 / 2N UPS power & ATS generators", "ar": "وحدات طاقة غير منقطعة UPS ومولدات احتياطية"},
      {"en": "High-density server containment racks & PDU metering", "ar": "كبائن خوادم عالية الكثافة مع قياس ذكي للطاقة PDU"},
      {"en": "DCIM real-time environmental & thermal monitoring", "ar": "أنظمة DCIM للمراقبة البيئية والحرارية اللحظية"},
      {"en": "Clean agent fire suppression (FM200 / NOVEC 1230)", "ar": "أنظمة إطفاء حرائق بالغازات النظيفة الصديقة للبيئة"}
    ]'::jsonb
  ),
  (
    'integration',
    'Integration & Customization',
    'التكامل وتخصيص الأنظمة',
    'Seamless multi-vendor hardware and software orchestration into unified management dashboards, custom API middleware, and automated workflow triggers.',
    'توحيد الأنظمة والبرمجيات متعددة المصنّعين ضمن لوحات تحكم مركزية متكاملة مع واجهات برمجية مخصصة (APIs) وأتمتة العمليات التشغيلية.',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    'Layers',
    true,
    5,
    '[
      {"en": "Unified Single-Pane-of-Glass management dashboard", "ar": "لوحة تحكم مركزية موحدة لجميع الأنظمة التكنولوجية"},
      {"en": "Custom REST / GraphQL API middleware development", "ar": "تطوير واجهات برمجية مخصصة للربط بين الأنظمة"},
      {"en": "BMS & IoT building automation protocol bridging", "ar": "ربط أنظمة إدارة المباني الذكية BMS وبروتوكولات IoT"},
      {"en": "Automated incident triggers & cross-system alerts", "ar": "أتمتة الاستجابة للحوادث والتنبيهات المتقاطعة"},
      {"en": "Legacy protocol modernization & cloud sync", "ar": "تحديث البروتوكولات القديمة والمزامنة السحابية"},
      {"en": "Custom telemetry reporting & analytics export", "ar": "تقارير وتحليلات أداء تشغيلية قابلة للتخصيص"}
    ]'::jsonb
  ),
  (
    'consultation',
    'Technology Consultation',
    'الاستشارات التقنية',
    'Strategic ICT & ELV roadmap planning, technology vendor evaluations, Bill of Quantities (BOQ) preparation, RFP specification design, and value engineering.',
    'التخطيط الاستراتيجي للبنية التحتية وتكنولوجيا المعلومات (ICT & ELV)، وإعداد جداول الكميات (BOQ)، وتصميم كراسات الشروط والمواصفات RFP.',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    'Lightbulb',
    true,
    6,
    '[
      {"en": "Strategic ICT & ELV infrastructure roadmap design", "ar": "وضع خرائط طريق شاملة للبنية التحتية التكنولوجية"},
      {"en": "Detailed Bill of Quantities (BOQ) preparation", "ar": "إعداد وتدقيق جداول الكميات والمواصفات الفنية BOQ"},
      {"en": "Vendor-neutral RFP & tender specifications authoring", "ar": "صياغة كراسات الشروط والمناقصات التقنية المحايدة"},
      {"en": "Value engineering & CAPEX / OPEX optimization", "ar": "الهندسة القيمة وتحسين التكاليف الاستثمارية والتشغيلية"},
      {"en": "Compliance audits against local & global standards", "ar": "مراجعة ومطابقة الأنظمة للمعايير المحلية والدولية"},
      {"en": "Third-party technical QA/QC site inspection", "ar": "فحص وتقييم الجودة الفنية المستقل بالمواقع"}
    ]'::jsonb
  ),
  (
    'project-management',
    'Project Management',
    'إدارة المشاريع الهندسية',
    'PMP-certified project governance, site supervision, vendor coordination, risk mitigation, rigorous QA/QC inspection, and turnkey commissioning.',
    'إدارة هندسية معتمدة وفق معايير PMP، والإشراف الميداني الدقيق، وإدارة المخاطر، وفحوصات الجودة QA/QC، والتسليم الشامل للمشاريع.',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
    'ClipboardList',
    true,
    7,
    '[
      {"en": "PMP-certified governance and milestone tracking", "ar": "إدارة مشاريع معتمدة وفق معايير PMP ومتابعة دقيقة للمراحل"},
      {"en": "Full on-site engineering supervision & coordination", "ar": "إشراف هندسي ميداني وتنسيق متكامل بين المقاولين"},
      {"en": "Proactive risk management & mitigation plans", "ar": "إدارة استباقية للمخاطر وتفادي التأخير"},
      {"en": "Rigorous QA/QC inspection checklists & factory tests", "ar": "فحوصات جودة صارمة واختبارات قبول المصنع (FAT/SAT)"},
      {"en": "Comprehensive As-Built drawings & O&M manuals", "ar": "تسليم المخططات التنفيذية As-Built وكتيبات التشغيل"},
      {"en": "End-to-end testing, commissioning & handover", "ar": "الفحص والتشغيل التجريبي والتسليم النهائي للمشروع"}
    ]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_ar = EXCLUDED.title_ar,
  desc_en = EXCLUDED.desc_en,
  desc_ar = EXCLUDED.desc_ar,
  image = EXCLUDED.image,
  icon_name = EXCLUDED.icon_name,
  published = EXCLUDED.published,
  sort_order = EXCLUDED.sort_order,
  features = EXCLUDED.features;
