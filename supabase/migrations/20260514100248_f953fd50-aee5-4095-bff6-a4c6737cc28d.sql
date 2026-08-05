
-- ============ SEO GLOBAL ============
CREATE TABLE public.seo_global (
  id text NOT NULL DEFAULT 'main' PRIMARY KEY,
  site_name_en text NOT NULL DEFAULT 'Integrated Technics',
  site_name_ar text NOT NULL DEFAULT 'إنتجريتد تكنيكس',
  default_title_en text NOT NULL DEFAULT 'Integrated Technics — Enterprise Security & ICT Integrator',
  default_title_ar text NOT NULL DEFAULT 'إنتجريتد تكنيكس — تكامل أنظمة الأمن وتكنولوجيا المعلومات للمؤسسات',
  default_description_en text NOT NULL DEFAULT 'Turnkey security, ICT, AV and data center integration delivered end-to-end by certified engineers across the region.',
  default_description_ar text NOT NULL DEFAULT 'حلول متكاملة للأمن وتكنولوجيا المعلومات والصوتيات والمرئيات ومراكز البيانات يقدمها مهندسون معتمدون في جميع أنحاء المنطقة.',
  default_keywords_en text NOT NULL DEFAULT 'security integration, ICT, AV solutions, data center, low current systems, CCTV, access control, fire alarm, structured cabling',
  default_keywords_ar text NOT NULL DEFAULT 'تكامل الأنظمة الأمنية، تكنولوجيا المعلومات، الصوتيات والمرئيات، مراكز البيانات، أنظمة التيار الخفيف، كاميرات مراقبة، التحكم في الوصول، إنذار الحريق',
  og_image_url text DEFAULT NULL,
  gtm_id text DEFAULT NULL,
  ga4_id text DEFAULT NULL,
  fb_pixel_id text DEFAULT NULL,
  google_verification text DEFAULT NULL,
  bing_verification text DEFAULT NULL,
  semrush_verification text DEFAULT NULL,
  hreflang_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_global ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SEO global is publicly readable" ON public.seo_global
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert seo_global" ON public.seo_global
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update seo_global" ON public.seo_global
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete seo_global" ON public.seo_global
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER seo_global_updated_at BEFORE UPDATE ON public.seo_global
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.seo_global (id) VALUES ('main') ON CONFLICT DO NOTHING;

-- ============ SEO PAGES ============
CREATE TABLE public.seo_pages (
  id text NOT NULL PRIMARY KEY,            -- slug e.g. 'home','services'
  path text NOT NULL,                       -- e.g. '/', '/services'
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  keywords_en text NOT NULL DEFAULT '',
  keywords_ar text NOT NULL DEFAULT '',
  og_image_url text DEFAULT NULL,
  noindex boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SEO pages are publicly readable" ON public.seo_pages
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert seo_pages" ON public.seo_pages
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update seo_pages" ON public.seo_pages
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete seo_pages" ON public.seo_pages
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER seo_pages_updated_at BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.seo_pages (id, path, title_en, title_ar, description_en, description_ar, keywords_en, keywords_ar, sort_order) VALUES
('home','/',
 'Integrated Technics — Enterprise Security & ICT Integrator',
 'إنتجريتد تكنيكس — تكامل أنظمة الأمن وتكنولوجيا المعلومات للمؤسسات',
 'Turnkey security, ICT, AV and data center integration delivered end-to-end by certified engineers.',
 'حلول متكاملة للأمن وتكنولوجيا المعلومات والصوتيات والمرئيات ومراكز البيانات يقدمها مهندسون معتمدون.',
 'system integrator, enterprise security, ICT, AV, data center, low current',
 'تكامل الأنظمة، أمن المؤسسات، تكنولوجيا المعلومات، الصوتيات والمرئيات، مراكز البيانات، التيار الخفيف', 1),
('services','/services',
 'Services — Security, ICT, AV & Data Center Solutions',
 'الخدمات — حلول الأمن وتكنولوجيا المعلومات والصوتيات ومراكز البيانات',
 'Explore our security integration, structured cabling, AV, networking, smart building and data center services.',
 'تعرف على خدماتنا في تكامل الأنظمة الأمنية والكابلات المهيكلة والصوتيات والشبكات والمباني الذكية ومراكز البيانات.',
 'security services, structured cabling, networking, smart building, av integration, data center services',
 'خدمات الأمن، الكابلات المهيكلة، الشبكات، المباني الذكية، تكامل الصوتيات والمرئيات، خدمات مراكز البيانات', 2),
('industries','/industries',
 'Industries We Serve — Banking, Energy, Government & More',
 'القطاعات التي نخدمها — البنوك والطاقة والحكومة وأكثر',
 'Tailored low-current and ICT solutions for banking, energy, government, healthcare, education and hospitality sectors.',
 'حلول التيار الخفيف وتكنولوجيا المعلومات مخصصة لقطاعات البنوك والطاقة والحكومة والصحة والتعليم والضيافة.',
 'industries, banking technology, government ICT, healthcare security, education AV, hospitality networks',
 'القطاعات، تقنية البنوك، تكنولوجيا المعلومات الحكومية، أمن الرعاية الصحية، صوتيات ومرئيات التعليم، شبكات الضيافة', 3),
('projects','/projects',
 'Projects & Case Studies — Integrated Technics',
 'المشاريع ودراسات الحالة — إنتجريتد تكنيكس',
 'Browse delivered projects across security, networking, AV and data center for leading enterprises.',
 'استعرض المشاريع المنفذة في مجالات الأمن والشبكات والصوتيات ومراكز البيانات لكبرى المؤسسات.',
 'case studies, integration projects, security projects, data center projects, av projects',
 'دراسات حالة، مشاريع التكامل، مشاريع الأمن، مشاريع مراكز البيانات، مشاريع الصوتيات والمرئيات', 4),
('partners','/partners',
 'Technology Partners — Authorized Vendor Ecosystem',
 'الشركاء التقنيون — منظومة الموردين المعتمدين',
 'Authorized partner of the world''s leading security, networking, AV and data center technology vendors.',
 'شريك معتمد لكبرى الشركات العالمية في الأمن والشبكات والصوتيات ومراكز البيانات.',
 'technology partners, authorized vendor, cisco, hikvision, axis, hpe, juniper',
 'الشركاء التقنيون، موزع معتمد، سيسكو، هيكفيجن، أكسيس، اتش بي اي، جونيبر', 5),
('about','/about',
 'About Integrated Technics — Certified Engineers, Trusted Delivery',
 'عن إنتجريتد تكنيكس — مهندسون معتمدون وتنفيذ موثوق',
 'Learn about our story, mission and the certified engineering team behind every project we deliver.',
 'تعرف على قصتنا ورسالتنا وفريق الهندسة المعتمد الذي يقف وراء كل مشروع ننفذه.',
 'about us, company profile, engineering team, certifications',
 'من نحن، نبذة عن الشركة، فريق الهندسة، الشهادات', 6),
('careers','/careers',
 'Careers at Integrated Technics — Join Our Engineering Team',
 'الوظائف في إنتجريتد تكنيكس — انضم إلى فريق الهندسة',
 'Open roles for engineers, project managers and technicians across security, ICT and AV disciplines.',
 'وظائف شاغرة للمهندسين ومديري المشاريع والفنيين في مجالات الأمن وتكنولوجيا المعلومات والصوتيات والمرئيات.',
 'careers, jobs, engineering jobs, ict jobs, security careers',
 'وظائف، فرص عمل، وظائف هندسية، وظائف تكنولوجيا المعلومات، وظائف أمنية', 7),
('news','/news',
 'News & Insights — Integrated Technics',
 'الأخبار والمقالات — إنتجريتد تكنيكس',
 'Latest company news, project announcements and insights on enterprise security and ICT trends.',
 'أحدث أخبار الشركة وإعلانات المشاريع ورؤى حول اتجاهات أمن المؤسسات وتكنولوجيا المعلومات.',
 'news, insights, security trends, ict news, technology updates',
 'أخبار، رؤى، اتجاهات الأمن، أخبار تكنولوجيا المعلومات، تحديثات تقنية', 8),
('contact','/contact',
 'Contact Us — Request a Proposal | Integrated Technics',
 'تواصل معنا — اطلب عرض سعر | إنتجريتد تكنيكس',
 'Talk to our solution team. Request a proposal, site survey or technical consultation.',
 'تواصل مع فريق الحلول لدينا. اطلب عرض سعر أو زيارة موقعية أو استشارة فنية.',
 'contact, request proposal, site survey, consultation',
 'تواصل، طلب عرض سعر، زيارة موقعية، استشارة', 9);

-- ============ SMTP SETTINGS ============
CREATE TABLE public.smtp_settings (
  id text NOT NULL DEFAULT 'main' PRIMARY KEY,
  host text NOT NULL DEFAULT 'smtp.hostinger.com',
  port integer NOT NULL DEFAULT 465,
  secure boolean NOT NULL DEFAULT true,
  username text NOT NULL DEFAULT '',
  password text NOT NULL DEFAULT '',
  from_email text NOT NULL DEFAULT '',
  from_name text NOT NULL DEFAULT 'Integrated Technics',
  reply_to text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

-- Admin only (contains credentials)
CREATE POLICY "Admins can view smtp_settings" ON public.smtp_settings
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert smtp_settings" ON public.smtp_settings
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update smtp_settings" ON public.smtp_settings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete smtp_settings" ON public.smtp_settings
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER smtp_settings_updated_at BEFORE UPDATE ON public.smtp_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.smtp_settings (id) VALUES ('main') ON CONFLICT DO NOTHING;
