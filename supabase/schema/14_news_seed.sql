-- =================================================================
-- 14_news_seed.sql
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql
-- =================================================================

-- 1. Ensure news_posts table exists
CREATE TABLE IF NOT EXISTS public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  excerpt_en text NOT NULL DEFAULT '',
  excerpt_ar text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '',
  body_ar text NOT NULL DEFAULT '',
  category_en text NOT NULL DEFAULT '',
  category_ar text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  published_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  seo_title_en text NOT NULL DEFAULT '',
  seo_title_ar text NOT NULL DEFAULT '',
  seo_description_en text NOT NULL DEFAULT '',
  seo_description_ar text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "News posts publicly readable" ON public.news_posts;
CREATE POLICY "News posts publicly readable" ON public.news_posts FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins manage news posts" ON public.news_posts;
CREATE POLICY "Admins manage news posts" ON public.news_posts FOR ALL TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Seed Data
INSERT INTO public.news_posts (
  slug, title_en, title_ar, excerpt_en, excerpt_ar, body_en, body_ar,
  category_en, category_ar, image_url, published_at, active, featured, sort_order
) VALUES
(
  'cctv-ai-security-capital-expansion',
  'Integrated Technics Expands Turnkey CCTV & AI Security Operations in New Administrative Capital',
  'إنترجريتد تكنيكس توسع عملياتها لأنظمة المراقبة الذكية والذكاء الاصطناعي في العاصمة الإدارية الجديدة',
  'Integrated Technics announces the delivery of integrated AI surveillance and optical fiber infrastructure across government headquarters.',
  'أعلنت شركة إنترجريتد تكنيكس عن تسليم البنية التحتية المتكاملة لأنظمة المراقبة الذكية والألياف الضوئية للمقرات الحكومية بالعاصمة الإدارية.',
  '<p>Integrated Technics is proud to announce the successful deployment of next-generation physical security solutions across key governmental and administrative zones in the New Administrative Capital.</p><h3>Project Highlights</h3><ul><li>Over 2,400 AI-powered 4K cameras with automated license plate recognition (ALPR).</li><li>Redundant optical fiber backbone connecting multi-tier control rooms.</li><li>Centralized command and control software with real-time video analytics.</li></ul>',
  '<p>تفخر شركة إنترجريتد تكنيكس بالإعلان عن الإنجاز الناجح لمشاريع الحلول الأمنية المتقدمة عبر مقرات استراتيجية في العاصمة الإدارية الجديدة.</p><h3>أبرز ملامح المشروع</h3><ul><li>أكثر من 2,400 كاميرا ذكية بدقة 4K مع التعرف التلقائي على لوحات المركبات (ALPR).</li><li>شبكة ألياف ضوئية فائقة السرعة مع مسارات احتياطية لغرف التحكم والمراقبة المركزية.</li><li>منظومة تحكم وإدارة موحدة تدعم التحليلات المرئية الفورية بالذكاء الاصطناعي.</li></ul>',
  'Projects & Expansion',
  'المشاريع والتوسع',
  'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&q=80',
  now() - interval '2 days',
  true,
  true,
  1
),
(
  'strategic-datacenter-partnership-cisco-fortinet',
  'Strategic Partnership with Cisco & Fortinet for Tier-3 Enterprise Data Centers',
  'شراكة استراتيجية مع سيسكو وفورتينت لتجهيز مراكز البيانات المعتمدة من المستوى الثالث',
  'New alliance delivering next-generation cybersecurity, SD-WAN, and high-density computing infrastructure for banks and telecom operators.',
  'تحالف جديد لتقديم حلول الأمن السيبراني المتقدمة والبنية التحتية لمراكز البيانات عالية الكثافة للبنوك وشركات الاتصالات.',
  '<p>As part of our commitment to delivering mission-critical technology, Integrated Technics has finalized top-tier strategic distribution and integration agreements with Cisco Systems and Fortinet.</p><p>This partnership empowers enterprise clients with zero-trust network architectures, next-generation firewalls, and certified Tier-3 modular data center deployments.</p>',
  '<p>في إطار التزامنا بتقديم أعلى معايير البنية التحتية التكنولوجية، أبرمت شركة إنترجريتد تكنيكس اتفاقيات شراكة وتكامل تقني متقدمة مع كبرى الشركات العالمية سيسكو وفورتينت.</p><p>تتيح هذه الشراكة لعملائنا في القطاعين المصرفي والاتصالات الاستفادة من حلول أمن الشبكات القائمة على مبدأ انعدام الثقة (Zero Trust) وتجهيز مراكز بيانات معتمدة من المستوى الثالث.</p>',
  'Partnerships',
  'شراكات استراتيجية',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
  now() - interval '5 days',
  true,
  false,
  2
),
(
  'smart-boardrooms-banking-sector',
  'Delivery of Intelligent Audio/Visual & Boardroom Systems for Top Banking Headquarters',
  'تسليم أنظمة القاعات الذكية والصوتيات والمرئيات للمقرات الرئيسية للبنوك الكبرى',
  'State-of-the-art interactive conferencing, acoustic treatment, and central video matrix deployed for executive governance suites.',
  'تجهيز قاعات المؤتمرات التفاعلية وأحدث أنظمة العرض والمعالجات الصوتية الذكية لمجالس الإدارة بالقطاع المصرفي.',
  '<p>Integrated Technics Audio/Visual division has completed the comprehensive outfitting of multi-purpose auditoriums and executive boardrooms for leading regional financial institutions.</p><ul><li>4K laser projection and ultra-narrow bezel interactive LED video walls.</li><li>Automated beamforming microphone arrays with acoustic echo cancellation.</li><li>Crestron/Extron central touch control panels for unified meeting automation.</li></ul>',
  '<p>أنجز قطاع الأنظمة السمعية والبصرية بشركة إنترجريتد تكنيكس تجهيز قاعات الاجتماعات الرئيسية وقاعات المؤتمرات التفاعلية لعدد من كبرى البنوك والمؤسسات المالية.</p><ul><li>شاشات جدارية تفاعلية فائقة الدقة 4K مع إضاءة ليزرية متقدمة.</li><li>مصفوفات ميكروفونات ذكية تعتمد تقنية التتبع الصوتي المباشر مع عزل الضوضاء والصدى.</li><li>أنظمة تحكم مركزي موحدة تعمل باللمس لتسهيل الاجتماعات الهجينة والافتراضية.</li></ul>',
  'Audio & Visual',
  'الصوتيات والمرئيات',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80',
  now() - interval '10 days',
  true,
  false,
  3
),
(
  'best-infrastructure-integrator-award-2026',
  'Integrated Technics Wins Best Infrastructure Integrator 2026 Award',
  'إنترجريتد تكنيكس تفوز بجائزة أفضل منفذ للبنية التحتية المتكاملة لعام 2026',
  'Recognized for engineering excellence in mission-critical infrastructure, access control, and large-scale industrial IoT integration.',
  'تكريم الشركة لتميزها الهندسي في تنفيذ مشاريع البنية التحتية الحيوية وأنظمة التحكم بالدخول والربط الصناعي.',
  '<p>At the Annual ICT & Security Summit 2026, Integrated Technics was awarded the prestigious trophy for Best Enterprise Infrastructure Integrator, recognizing over two decades of engineering leadership.</p>',
  '<p>خلال فعاليات القمة السنوية لتكنولوجيا المعلومات والأنظمة الأمنية 2026، حصدت شركة إنترجريتد تكنيكس درع التميز كأفضل منفذ للبنية التحتية المتكاملة للمشاريع الكبرى.</p>',
  'Awards & Recognition',
  'جوائز وتكريمات',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80',
  now() - interval '15 days',
  true,
  false,
  4
),
(
  'launch-247-managed-noc-sla-support',
  'Launch of Next-Gen 24/7 Managed NOC & Maintenance SLA Packages',
  'إطلاق باقات المراقبة الاستباقية لغرف العمليات (NOC) على مدار الساعة والصيانة الوقائية',
  'Introducing 24/7 proactive network operations center (NOC) monitoring, preventive maintenance, and guaranteed 2-hour SLA response.',
  'إطلاق باقات المراقبة الاستباقية لغرف العمليات (NOC) على مدار الساعة والصيانة الوقائية مع استجابة فورية خلال ساعتين.',
  '<p>We are excited to announce the expansion of our Managed Services division with 24/7/365 Network Operations Center (NOC) monitoring and specialized SLA maintenance contracts for critical infrastructure.</p>',
  '<p>يسرنا الإعلان عن إطلاق خدمات إدارة وتشغيل الشبكات وغرف العمليات المركزية (NOC) على مدار الساعة مع عقود صيانة سنوية مخصصة تضمن استجابة فورية لحماية استمرارية الأعمال.</p>',
  'Services & SLA',
  'خدمات الصيانة والتشغيل',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80',
  now() - interval '20 days',
  true,
  false,
  5
)
ON CONFLICT (slug) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_ar = EXCLUDED.title_ar,
  excerpt_en = EXCLUDED.excerpt_en,
  excerpt_ar = EXCLUDED.excerpt_ar,
  body_en = EXCLUDED.body_en,
  body_ar = EXCLUDED.body_ar,
  category_en = EXCLUDED.category_en,
  category_ar = EXCLUDED.category_ar,
  image_url = EXCLUDED.image_url,
  featured = EXCLUDED.featured,
  active = EXCLUDED.active;
