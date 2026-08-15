-- ===== 20260509205659_795c0da3-106e-42b2-b7db-ee37c8067d75.sql =====
create table if not exists public.about_content (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  hero_image_url text,
  hero_focal_x numeric not null default 50,
  hero_focal_y numeric not null default 50,
  hero_zoom numeric not null default 1,
  hero_mirror_rtl boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.about_content enable row level security;

drop policy if exists "About content is publicly readable" on public.about_content;
DROP POLICY IF EXISTS "About content is publicly readable" ON public.about_content;
create policy "About content is publicly readable"
  on public.about_content for select
  using (true);

insert into public.about_content (id) values ('main') on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('about-images', 'about-images', true)
on conflict (id) do nothing;

drop policy if exists "About images are publicly readable" on storage.objects;
DROP POLICY IF EXISTS "About images are publicly readable" ON storage.objects;
create policy "About images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'about-images');

drop policy if exists "Anyone can upload about images" on storage.objects;
DROP POLICY IF EXISTS "Anyone can upload about images" ON storage.objects;
create policy "Anyone can upload about images"
  on storage.objects for insert
  with check (bucket_id = 'about-images');

drop policy if exists "Anyone can update about images" on storage.objects;
DROP POLICY IF EXISTS "Anyone can update about images" ON storage.objects;
create policy "Anyone can update about images"
  on storage.objects for update
  using (bucket_id = 'about-images');

drop policy if exists "Anyone can delete about images" on storage.objects;
DROP POLICY IF EXISTS "Anyone can delete about images" ON storage.objects;
create policy "Anyone can delete about images"
  on storage.objects for delete
  using (bucket_id = 'about-images');

-- ===== 20260509211155_6b8407e4-c338-40c9-98b6-751bd805dd9c.sql =====
-- Roles enum + user_roles table
DO $guard$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $guard$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Policies: users can read their own roles; admins can read all
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- About content: admins can write
DROP POLICY IF EXISTS "Admins can insert about_content" ON public.about_content;
CREATE POLICY "Admins can insert about_content"
  ON public.about_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update about_content" ON public.about_content;
CREATE POLICY "Admins can update about_content"
  ON public.about_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete about_content" ON public.about_content;
CREATE POLICY "Admins can delete about_content"
  ON public.about_content FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage RLS for about-images bucket: public read, admin write
DROP POLICY IF EXISTS "Public can read about-images" ON storage.objects;
CREATE POLICY "Public can read about-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'about-images');

DROP POLICY IF EXISTS "Admins can upload about-images" ON storage.objects;
CREATE POLICY "Admins can upload about-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'about-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update about-images" ON storage.objects;
CREATE POLICY "Admins can update about-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'about-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete about-images" ON storage.objects;
CREATE POLICY "Admins can delete about-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'about-images' AND public.has_role(auth.uid(), 'admin'));

-- ===== 20260510083344_f4805a95-c38d-4851-9436-84f6eb0832f7.sql =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE IF NOT EXISTS public.homepage_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  subtitle_en text NOT NULL DEFAULT '',
  subtitle_ar text NOT NULL DEFAULT '',
  cta_en text NOT NULL DEFAULT '',
  cta_ar text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '/',
  image text NOT NULL DEFAULT '/placeholder.svg',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Slides are publicly readable" ON public.homepage_slides;
CREATE POLICY "Slides are publicly readable" ON public.homepage_slides FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert slides" ON public.homepage_slides;
CREATE POLICY "Admins can insert slides" ON public.homepage_slides FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update slides" ON public.homepage_slides;
CREATE POLICY "Admins can update slides" ON public.homepage_slides FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete slides" ON public.homepage_slides;
CREATE POLICY "Admins can delete slides" ON public.homepage_slides FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_homepage_slides_updated_at ON public.homepage_slides;
CREATE TRIGGER update_homepage_slides_updated_at BEFORE UPDATE ON public.homepage_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_homepage_slides_sort ON public.homepage_slides (sort_order);

-- ===== 20260510083836_08e2374c-4576-4b35-81e5-3287f5efb811.sql =====
INSERT INTO storage.buckets (id, name, public) VALUES ('slide-images','slide-images',true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Slide images are publicly viewable" ON storage.objects;
CREATE POLICY "Slide images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'slide-images');

DROP POLICY IF EXISTS "Admins can upload slide images" ON storage.objects;
CREATE POLICY "Admins can upload slide images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'slide-images' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update slide images" ON storage.objects;
CREATE POLICY "Admins can update slide images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'slide-images' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete slide images" ON storage.objects;
CREATE POLICY "Admins can delete slide images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'slide-images' AND has_role(auth.uid(), 'admin'::app_role));

-- ===== 20260510122641_265f2358-b4b1-4339-abcc-25e8d270d509.sql =====
-- Notification type enum
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('lead', 'slide', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.notification_type NOT NULL DEFAULT 'system',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '/dashboard/admin',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.admin_notifications;
CREATE POLICY "Admins can insert notifications"
  ON public.admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete notifications" ON public.admin_notifications;
CREATE POLICY "Admins can delete notifications"
  ON public.admin_notifications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS admin_notifications_updated_at ON public.admin_notifications;
CREATE TRIGGER admin_notifications_updated_at
  BEFORE UPDATE ON public.admin_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS admin_notifications_created_at_idx
  ON public.admin_notifications (created_at DESC);

ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- ===== 20260512090404_43fa967f-ec64-4ad6-a566-14a2eaa5b5c5.sql =====
CREATE TABLE IF NOT EXISTS public.chatbot_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en text NOT NULL DEFAULT '',
  question_ar text NOT NULL DEFAULT '',
  answer_en text NOT NULL DEFAULT '',
  answer_ar text NOT NULL DEFAULT '',
  keywords text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_qa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chatbot Q&A is publicly readable" ON public.chatbot_qa;
CREATE POLICY "Chatbot Q&A is publicly readable"
  ON public.chatbot_qa FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can insert chatbot_qa" ON public.chatbot_qa;
CREATE POLICY "Admins can insert chatbot_qa"
  ON public.chatbot_qa FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update chatbot_qa" ON public.chatbot_qa;
CREATE POLICY "Admins can update chatbot_qa"
  ON public.chatbot_qa FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete chatbot_qa" ON public.chatbot_qa;
CREATE POLICY "Admins can delete chatbot_qa"
  ON public.chatbot_qa FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_chatbot_qa_updated_at ON public.chatbot_qa;
CREATE TRIGGER update_chatbot_qa_updated_at
  BEFORE UPDATE ON public.chatbot_qa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.chatbot_qa (question_en, question_ar, answer_en, answer_ar, keywords, sort_order) VALUES
('What services do you offer?', 'ما الخدمات التي تقدمونها؟', 'We provide turnkey security, ICT, AV, and data center integration services for enterprises across the region.', 'نقدم خدمات متكاملة للأمن وتقنية المعلومات والاتصالات والصوتيات والمرئيات ومراكز البيانات للشركات في المنطقة.', 'services خدمات', 1),
('How can I request a quotation?', 'كيف أطلب عرض سعر؟', 'You can submit a request through our Contact page or your client workspace, and our team will respond within one business day.', 'يمكنك إرسال طلبك من خلال صفحة الاتصال أو من مساحة العميل، وسيرد فريقنا خلال يوم عمل واحد.', 'quote quotation pricing سعر عرض', 2),
('How do I contact support?', 'كيف أتواصل مع الدعم؟', 'Open a ticket from your workspace under Support Tickets, or email support@integratedtechnics.com.', 'افتح تذكرة من مساحة العمل في قسم تذاكر الدعم، أو راسلنا على support@integratedtechnics.com.', 'support help دعم مساعدة', 3),
('What industries do you serve?', 'ما القطاعات التي تخدمونها؟', 'We serve government, banking, healthcare, education, retail, hospitality, and oil & gas sectors.', 'نخدم قطاعات الحكومة والبنوك والرعاية الصحية والتعليم والتجزئة والضيافة والنفط والغاز.', 'industries sectors قطاعات', 4);

-- ===== 20260512102453_5e5db2f8-5905-44d5-8350-01b8021b31ad.sql =====
CREATE TABLE IF NOT EXISTS public.pwa_install_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  platform TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pwa_install_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can insert install events" ON public.pwa_install_events;
CREATE POLICY "anyone can insert install events"
ON public.pwa_install_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admins can view install events" ON public.pwa_install_events;
CREATE POLICY "admins can view install events"
ON public.pwa_install_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_pwa_install_events_type_created ON public.pwa_install_events(event_type, created_at DESC);

-- ===== 20260514100248_f953fd50-aee5-4095-bff6-a4c6737cc28d.sql =====
-- ============ SEO GLOBAL ============
CREATE TABLE IF NOT EXISTS public.seo_global (
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

DROP POLICY IF EXISTS "SEO global is publicly readable" ON public.seo_global;
CREATE POLICY "SEO global is publicly readable" ON public.seo_global
  FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can insert seo_global" ON public.seo_global;
CREATE POLICY "Admins can insert seo_global" ON public.seo_global
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update seo_global" ON public.seo_global;
CREATE POLICY "Admins can update seo_global" ON public.seo_global
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete seo_global" ON public.seo_global;
CREATE POLICY "Admins can delete seo_global" ON public.seo_global
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS seo_global_updated_at ON public.seo_global;
CREATE TRIGGER seo_global_updated_at BEFORE UPDATE ON public.seo_global
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.seo_global (id) VALUES ('main') ON CONFLICT DO NOTHING;

-- ============ SEO PAGES ============
CREATE TABLE IF NOT EXISTS public.seo_pages (
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

DROP POLICY IF EXISTS "SEO pages are publicly readable" ON public.seo_pages;
CREATE POLICY "SEO pages are publicly readable" ON public.seo_pages
  FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can insert seo_pages" ON public.seo_pages;
CREATE POLICY "Admins can insert seo_pages" ON public.seo_pages
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update seo_pages" ON public.seo_pages;
CREATE POLICY "Admins can update seo_pages" ON public.seo_pages
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete seo_pages" ON public.seo_pages;
CREATE POLICY "Admins can delete seo_pages" ON public.seo_pages
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS seo_pages_updated_at ON public.seo_pages;
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
CREATE TABLE IF NOT EXISTS public.smtp_settings (
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
DROP POLICY IF EXISTS "Admins can view smtp_settings" ON public.smtp_settings;
CREATE POLICY "Admins can view smtp_settings" ON public.smtp_settings
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can insert smtp_settings" ON public.smtp_settings;
CREATE POLICY "Admins can insert smtp_settings" ON public.smtp_settings
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update smtp_settings" ON public.smtp_settings;
CREATE POLICY "Admins can update smtp_settings" ON public.smtp_settings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete smtp_settings" ON public.smtp_settings;
CREATE POLICY "Admins can delete smtp_settings" ON public.smtp_settings
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS smtp_settings_updated_at ON public.smtp_settings;
CREATE TRIGGER smtp_settings_updated_at BEFORE UPDATE ON public.smtp_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.smtp_settings (id) VALUES ('main') ON CONFLICT DO NOTHING;

-- ===== 20260515131925_df480131-aff5-4476-95b8-045ec18c72ab.sql =====
-- Status enum for application workflow
DO $$ BEGIN
  CREATE TYPE public.career_app_status AS ENUM ('new','reviewed','shortlisted','interviewed','offered','accepted','rejected','withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $guard$ BEGIN
  CREATE TYPE public.career_employment_type AS ENUM ('full_time','part_time','contract','internship');
EXCEPTION WHEN duplicate_object THEN null; END $guard$;

-- Jobs
CREATE TABLE IF NOT EXISTS public.career_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  department_en text NOT NULL DEFAULT '',
  department_ar text NOT NULL DEFAULT '',
  location_en text NOT NULL DEFAULT '',
  location_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  employment_type public.career_employment_type NOT NULL DEFAULT 'full_time',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.career_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active jobs are publicly readable" ON public.career_jobs;
CREATE POLICY "Active jobs are publicly readable"
  ON public.career_jobs FOR SELECT TO public
  USING (active = true OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage jobs insert" ON public.career_jobs;
CREATE POLICY "Admins manage jobs insert" ON public.career_jobs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins manage jobs update" ON public.career_jobs;
CREATE POLICY "Admins manage jobs update" ON public.career_jobs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins manage jobs delete" ON public.career_jobs;
CREATE POLICY "Admins manage jobs delete" ON public.career_jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS career_jobs_updated_at ON public.career_jobs;
CREATE TRIGGER career_jobs_updated_at BEFORE UPDATE ON public.career_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Applications
CREATE TABLE IF NOT EXISTS public.career_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text NOT NULL UNIQUE DEFAULT ('A-' || to_char(now(),'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  job_id uuid REFERENCES public.career_jobs(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  cover_letter text NOT NULL DEFAULT '',
  resume_url text NOT NULL DEFAULT '',
  linkedin_url text NOT NULL DEFAULT '',
  status public.career_app_status NOT NULL DEFAULT 'new',
  internal_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit application" ON public.career_applications;
CREATE POLICY "Anyone can submit application" ON public.career_applications FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Admins view applications" ON public.career_applications;
CREATE POLICY "Admins view applications" ON public.career_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins update applications" ON public.career_applications;
CREATE POLICY "Admins update applications" ON public.career_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins delete applications" ON public.career_applications;
CREATE POLICY "Admins delete applications" ON public.career_applications FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS career_applications_updated_at ON public.career_applications;
CREATE TRIGGER career_applications_updated_at BEFORE UPDATE ON public.career_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS career_applications_status_idx ON public.career_applications(status);
CREATE INDEX IF NOT EXISTS career_applications_job_idx ON public.career_applications(job_id);

-- Application events (audit trail)
CREATE TABLE IF NOT EXISTS public.career_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.career_applications(id) ON DELETE CASCADE,
  from_status public.career_app_status,
  to_status public.career_app_status NOT NULL,
  note text NOT NULL DEFAULT '',
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.career_application_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view events" ON public.career_application_events;
CREATE POLICY "Admins view events" ON public.career_application_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins insert events" ON public.career_application_events;
CREATE POLICY "Admins insert events" ON public.career_application_events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS career_app_events_app_idx ON public.career_application_events(application_id, created_at DESC);

-- Auto-log initial event on insert
CREATE OR REPLACE FUNCTION public.log_initial_application_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.career_application_events (application_id, from_status, to_status, note)
  VALUES (NEW.id, NULL, NEW.status, 'Application submitted');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS career_applications_initial_event ON public.career_applications;
CREATE TRIGGER career_applications_initial_event AFTER INSERT ON public.career_applications
  FOR EACH ROW EXECUTE FUNCTION public.log_initial_application_event();

-- ===== 20260515131948_0cda17e6-c586-40a8-b31b-3e72b2db6e19.sql =====
DROP POLICY IF EXISTS "Anyone can submit application" ON public.career_applications;
DROP POLICY IF EXISTS "Anyone can submit application" ON public.career_applications;
CREATE POLICY "Anyone can submit application"
  ON public.career_applications FOR INSERT TO public
  WITH CHECK (status = 'new' AND internal_notes = '');

-- Switch trigger function to invoker; trigger context still allows the insert
CREATE OR REPLACE FUNCTION public.log_initial_application_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  INSERT INTO public.career_application_events (application_id, from_status, to_status, note)
  VALUES (NEW.id, NULL, NEW.status, 'Application submitted');
  RETURN NEW;
END; $$;

-- Allow the trigger insert path even though base RLS restricts INSERT to admins:
-- add a permissive policy that only matches inserts originating from the trigger
-- (trigger runs with same role as the inserter; we check the parent app exists in same txn).
DROP POLICY IF EXISTS "Trigger can insert events for new app" ON public.career_application_events;
CREATE POLICY "Trigger can insert events for new app"
  ON public.career_application_events FOR INSERT TO public
  WITH CHECK (
    from_status IS NULL
    AND to_status = 'new'
    AND EXISTS (SELECT 1 FROM public.career_applications a WHERE a.id = application_id)
  );

-- ===== 20260516101800_905642fd-c5da-488c-8c1a-75ed04276f78.sql =====
-- Job postings: richer fields
DO $$ BEGIN
  CREATE TYPE public.career_experience_level AS ENUM ('intern','junior','mid','senior','lead');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.career_remote_policy AS ENUM ('onsite','hybrid','remote');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.career_jobs
  ADD COLUMN IF NOT EXISTS experience_level public.career_experience_level NOT NULL DEFAULT 'mid',
  ADD COLUMN IF NOT EXISTS min_years_experience integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS openings integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deadline date,
  ADD COLUMN IF NOT EXISTS salary_min numeric,
  ADD COLUMN IF NOT EXISTS salary_max numeric,
  ADD COLUMN IF NOT EXISTS salary_currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS remote_policy public.career_remote_policy NOT NULL DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS responsibilities_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsibilities_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requirements_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requirements_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nice_to_have_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nice_to_have_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS benefits_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS benefits_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS apply_email text NOT NULL DEFAULT '';

-- Applications: richer candidate detail
ALTER TABLE public.career_applications
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS current_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_company text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS highest_education text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS university text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nationality text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS expected_salary numeric,
  ADD COLUMN IF NOT EXISTS salary_currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS earliest_start_date date,
  ADD COLUMN IF NOT EXISTS notice_period_days integer,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS portfolio_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS consent_processing boolean NOT NULL DEFAULT false;

-- ===== 20260517164727_edc922eb-cf41-4c19-9716-1254b604c9bf.sql =====
-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  sku text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  category_en text NOT NULL DEFAULT '',
  category_ar text NOT NULL DEFAULT '',
  price numeric,
  currency text NOT NULL DEFAULT 'USD',
  image_url text NOT NULL DEFAULT '',
  gallery text[] NOT NULL DEFAULT '{}',
  stock_status text NOT NULL DEFAULT 'in_stock',
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active products publicly readable" ON public.products;
CREATE POLICY "Active products publicly readable"
  ON public.products FOR SELECT TO public
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins insert products" ON public.products;
CREATE POLICY "Admins insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update products" ON public.products;
CREATE POLICY "Admins update products"
  ON public.products FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete products" ON public.products;
CREATE POLICY "Admins delete products"
  ON public.products FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);

-- CAREER EVENTS: allow admin edit/delete
DROP POLICY IF EXISTS "Admins update events" ON public.career_application_events;
CREATE POLICY "Admins update events"
  ON public.career_application_events FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete events" ON public.career_application_events;
CREATE POLICY "Admins delete events"
  ON public.career_application_events FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ===== 20260517165923_60d30f39-c207-4198-a4c5-139a3ec45a29.sql =====
-- Leads (DB-backed) for quote requests
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'quote_request',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  product_id UUID,
  product_name TEXT NOT NULL DEFAULT '',
  product_slug TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit lead" ON public.leads;
CREATE POLICY "Anyone can submit lead" ON public.leads
  FOR INSERT TO public WITH CHECK (status = 'new');

DROP POLICY IF EXISTS "Admins view leads" ON public.leads;
CREATE POLICY "Admins view leads" ON public.leads
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update leads" ON public.leads;
CREATE POLICY "Admins update leads" ON public.leads
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete leads" ON public.leads;
CREATE POLICY "Admins delete leads" ON public.leads
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Product images publicly readable" ON storage.objects;
CREATE POLICY "Product images publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins upload product images" ON storage.objects;
CREATE POLICY "Admins upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update product images" ON storage.objects;
CREATE POLICY "Admins update product images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete product images" ON storage.objects;
CREATE POLICY "Admins delete product images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

-- ===== 20260518193545_57b682f0-cf06-4155-bbdb-34099d423eee.sql =====
CREATE TABLE IF NOT EXISTS public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view lead notes" ON public.lead_notes;
CREATE POLICY "Admins view lead notes" ON public.lead_notes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins insert lead notes" ON public.lead_notes;
CREATE POLICY "Admins insert lead notes" ON public.lead_notes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins update lead notes" ON public.lead_notes;
CREATE POLICY "Admins update lead notes" ON public.lead_notes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins delete lead notes" ON public.lead_notes;
CREATE POLICY "Admins delete lead notes" ON public.lead_notes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_lead_notes_updated_at ON public.lead_notes;
CREATE TRIGGER trg_lead_notes_updated_at
  BEFORE UPDATE ON public.lead_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-notify admins when a new lead arrives
CREATE OR REPLACE FUNCTION public.notify_admins_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lang_label text;
  product_part text;
BEGIN
  lang_label := CASE WHEN NEW.lang = 'ar' THEN 'AR' ELSE 'EN' END;
  product_part := CASE WHEN COALESCE(NEW.product_name, '') <> '' THEN ' — ' || NEW.product_name ELSE '' END;

  INSERT INTO public.admin_notifications (type, title, message, href, read)
  VALUES (
    'lead'::notification_type,
    'New quote request (' || lang_label || ')' || product_part,
    COALESCE(NEW.full_name, 'Unknown') || ' · ' || COALESCE(NEW.email, '') ||
      CASE WHEN COALESCE(NEW.company, '') <> '' THEN ' · ' || NEW.company ELSE '' END,
    '/dashboard/admin/leads/quotes/' || NEW.id::text,
    false
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_new_lead ON public.leads;
CREATE TRIGGER trg_notify_admins_new_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_lead();

-- ===== 20260518193557_68f6421e-c282-416d-8203-64c8eae75dc0.sql =====
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_lead() FROM PUBLIC, anon, authenticated;

-- ===== 20260518194632_088c7608-89b1-43e2-aa55-e03d8168fdee.sql =====
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'helpdesk_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technician';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client_user';

-- ===== 20260518194726_d05403f3-1ff9-4ed8-b0a7-b37386d6daf0.sql =====
DO $$ BEGIN
  CREATE TYPE public.ticket_priority AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM ('new','open','in_progress','waiting_client','resolved','closed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.can_manage_tickets(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::app_role,'helpdesk_manager'::app_role)
  );
$$;
REVOKE EXECUTE ON FUNCTION public.can_manage_tickets(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_tickets(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no text UNIQUE,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  status public.ticket_status NOT NULL DEFAULT 'new',
  description text NOT NULL DEFAULT '',
  branch text NOT NULL DEFAULT '',
  device_serial text NOT NULL DEFAULT '',
  lang text NOT NULL DEFAULT 'en',
  client_id uuid,
  assigned_to uuid,
  created_by uuid,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_client ON public.support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to);

CREATE OR REPLACE FUNCTION public.generate_ticket_no()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  yr text := to_char(now(),'YYYY');
  next_n int;
BEGIN
  IF NEW.ticket_no IS NULL OR NEW.ticket_no = '' THEN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(ticket_no,'^TIC-\d{4}-',''),'')::int),0) + 1
      INTO next_n FROM public.support_tickets WHERE ticket_no LIKE 'TIC-'||yr||'-%';
    NEW.ticket_no := 'TIC-'||yr||'-'||lpad(next_n::text,6,'0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_generate_ticket_no ON public.support_tickets;
DROP TRIGGER IF EXISTS trg_generate_ticket_no ON public.support_tickets;
CREATE TRIGGER trg_generate_ticket_no BEFORE INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_no();

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Managers view all tickets" ON public.support_tickets;
CREATE POLICY "Managers view all tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Technicians view assigned tickets" ON public.support_tickets;
CREATE POLICY "Technicians view assigned tickets" ON public.support_tickets FOR SELECT TO authenticated USING (assigned_to = auth.uid());
DROP POLICY IF EXISTS "Clients view own tickets" ON public.support_tickets;
CREATE POLICY "Clients view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (client_id = auth.uid() OR created_by = auth.uid());
DROP POLICY IF EXISTS "Clients create own tickets" ON public.support_tickets;
CREATE POLICY "Clients create own tickets" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK ((client_id = auth.uid() OR created_by = auth.uid()) AND status IN ('new'::ticket_status,'open'::ticket_status));
DROP POLICY IF EXISTS "Managers insert tickets" ON public.support_tickets;
CREATE POLICY "Managers insert tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (public.can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Managers update tickets" ON public.support_tickets;
CREATE POLICY "Managers update tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.can_manage_tickets(auth.uid())) WITH CHECK (public.can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Technicians update assigned tickets" ON public.support_tickets;
CREATE POLICY "Technicians update assigned tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (assigned_to = auth.uid()) WITH CHECK (assigned_to = auth.uid());
DROP POLICY IF EXISTS "Managers delete tickets" ON public.support_tickets;
CREATE POLICY "Managers delete tickets" ON public.support_tickets FOR DELETE TO authenticated USING (public.can_manage_tickets(auth.uid()));

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid,
  body text NOT NULL DEFAULT '',
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Managers view ticket messages" ON public.support_ticket_messages;
CREATE POLICY "Managers view ticket messages" ON public.support_ticket_messages FOR SELECT TO authenticated USING (public.can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Technicians view assigned ticket messages" ON public.support_ticket_messages;
CREATE POLICY "Technicians view assigned ticket messages" ON public.support_ticket_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.assigned_to = auth.uid()));
DROP POLICY IF EXISTS "Clients view own ticket public messages" ON public.support_ticket_messages;
CREATE POLICY "Clients view own ticket public messages" ON public.support_ticket_messages FOR SELECT TO authenticated
  USING (is_internal = false AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.client_id = auth.uid() OR t.created_by = auth.uid())));
DROP POLICY IF EXISTS "Staff insert messages" ON public.support_ticket_messages;
CREATE POLICY "Staff insert messages" ON public.support_ticket_messages FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND (public.can_manage_tickets(auth.uid())
    OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.assigned_to = auth.uid())));
DROP POLICY IF EXISTS "Clients reply on own tickets" ON public.support_ticket_messages;
CREATE POLICY "Clients reply on own tickets" ON public.support_ticket_messages FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND is_internal = false AND
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.client_id = auth.uid() OR t.created_by = auth.uid())));
DROP POLICY IF EXISTS "Managers delete messages" ON public.support_ticket_messages;
CREATE POLICY "Managers delete messages" ON public.support_ticket_messages FOR DELETE TO authenticated USING (public.can_manage_tickets(auth.uid()));

CREATE TABLE IF NOT EXISTS public.support_ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  uploaded_by uuid,
  file_url text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  size_bytes bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON public.support_ticket_attachments(ticket_id);
ALTER TABLE public.support_ticket_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Managers view attachments" ON public.support_ticket_attachments;
CREATE POLICY "Managers view attachments" ON public.support_ticket_attachments FOR SELECT TO authenticated USING (public.can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Technicians view assigned attachments" ON public.support_ticket_attachments;
CREATE POLICY "Technicians view assigned attachments" ON public.support_ticket_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.assigned_to = auth.uid()));
DROP POLICY IF EXISTS "Clients view own ticket attachments" ON public.support_ticket_attachments;
CREATE POLICY "Clients view own ticket attachments" ON public.support_ticket_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.client_id = auth.uid() OR t.created_by = auth.uid())));
DROP POLICY IF EXISTS "Users insert own attachments on accessible tickets" ON public.support_ticket_attachments;
CREATE POLICY "Users insert own attachments on accessible tickets" ON public.support_ticket_attachments FOR INSERT TO authenticated WITH CHECK (
  uploaded_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (
      public.can_manage_tickets(auth.uid()) OR t.assigned_to = auth.uid() OR t.client_id = auth.uid() OR t.created_by = auth.uid()
    )));
DROP POLICY IF EXISTS "Managers delete attachments" ON public.support_ticket_attachments;
CREATE POLICY "Managers delete attachments" ON public.support_ticket_attachments FOR DELETE TO authenticated USING (public.can_manage_tickets(auth.uid()));

CREATE TABLE IF NOT EXISTS public.support_ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  actor_id uuid,
  event_type text NOT NULL,
  from_value text NOT NULL DEFAULT '',
  to_value text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON public.support_ticket_events(ticket_id);
ALTER TABLE public.support_ticket_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Managers view events" ON public.support_ticket_events;
CREATE POLICY "Managers view events" ON public.support_ticket_events FOR SELECT TO authenticated USING (public.can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Technicians view assigned events" ON public.support_ticket_events;
CREATE POLICY "Technicians view assigned events" ON public.support_ticket_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.assigned_to = auth.uid()));
DROP POLICY IF EXISTS "Clients view own ticket events" ON public.support_ticket_events;
CREATE POLICY "Clients view own ticket events" ON public.support_ticket_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.client_id = auth.uid() OR t.created_by = auth.uid())));
DROP POLICY IF EXISTS "Staff insert events" ON public.support_ticket_events;
CREATE POLICY "Staff insert events" ON public.support_ticket_events FOR INSERT TO authenticated WITH CHECK (
  public.can_manage_tickets(auth.uid())
  OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.assigned_to = auth.uid()));
DROP POLICY IF EXISTS "Trigger creates ticket events" ON public.support_ticket_events;
CREATE POLICY "Trigger creates ticket events" ON public.support_ticket_events FOR INSERT TO public WITH CHECK (event_type = 'created');

CREATE OR REPLACE FUNCTION public.on_support_ticket_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.support_ticket_events (ticket_id, actor_id, event_type, to_value, note)
  VALUES (NEW.id, NEW.created_by, 'created', NEW.status::text, 'Ticket opened');
  INSERT INTO public.admin_notifications (type, title, message, href, read)
  VALUES (
    'system'::notification_type,
    'New support ticket — ' || COALESCE(NEW.ticket_no,'TIC'),
    COALESCE(NEW.subject,'') || ' · ' || COALESCE(NEW.priority::text,'medium'),
    '/dashboard/admin/helpdesk/tickets/' || NEW.id::text,
    false
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_on_support_ticket_created ON public.support_tickets;
DROP TRIGGER IF EXISTS trg_on_support_ticket_created ON public.support_tickets;
CREATE TRIGGER trg_on_support_ticket_created AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.on_support_ticket_created();

INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments','ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Ticket attachments managers all" ON storage.objects;
DROP POLICY IF EXISTS "Ticket attachments managers all" ON storage.objects;
CREATE POLICY "Ticket attachments managers all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'ticket-attachments' AND public.can_manage_tickets(auth.uid()))
  WITH CHECK (bucket_id = 'ticket-attachments' AND public.can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Ticket attachments own folder read" ON storage.objects;
DROP POLICY IF EXISTS "Ticket attachments own folder read" ON storage.objects;
CREATE POLICY "Ticket attachments own folder read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Ticket attachments own folder write" ON storage.objects;
DROP POLICY IF EXISTS "Ticket attachments own folder write" ON storage.objects;
CREATE POLICY "Ticket attachments own folder write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Ticket attachments own folder update" ON storage.objects;
DROP POLICY IF EXISTS "Ticket attachments own folder update" ON storage.objects;
CREATE POLICY "Ticket attachments own folder update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Ticket attachments own folder delete" ON storage.objects;
DROP POLICY IF EXISTS "Ticket attachments own folder delete" ON storage.objects;
CREATE POLICY "Ticket attachments own folder delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ===== 20260518200316_d5f34afb-c20f-41a7-b684-780322714dc1.sql =====
-- =========================================
-- Registries
-- =========================================
CREATE TABLE IF NOT EXISTS public.support_sla_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  first_response_minutes integer NOT NULL DEFAULT 60,
  resolve_minutes integer NOT NULL DEFAULT 480,
  business_hours_only boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  default_sla_policy_id uuid REFERENCES public.support_sla_policies(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  branch_id uuid REFERENCES public.support_branches(id) ON DELETE SET NULL,
  client_id uuid,
  active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================
-- Assignment history
-- =========================================
CREATE TABLE IF NOT EXISTS public.support_ticket_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  assigned_to uuid,
  assigned_by uuid,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sta_ticket ON public.support_ticket_assignments(ticket_id, created_at DESC);

-- =========================================
-- Extend support_tickets with SLA fields
-- =========================================
ALTER TABLE public.support_tickets
  ADD COLUMN sla_policy_id uuid REFERENCES public.support_sla_policies(id) ON DELETE SET NULL,
  ADD COLUMN first_response_due_at timestamptz,
  ADD COLUMN resolve_due_at timestamptz,
  ADD COLUMN first_response_at timestamptz;

-- =========================================
-- updated_at triggers
-- =========================================
DROP TRIGGER IF EXISTS trg_sla_updated ON public.support_sla_policies;
CREATE TRIGGER trg_sla_updated BEFORE UPDATE ON public.support_sla_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_cat_updated ON public.support_categories;
CREATE TRIGGER trg_cat_updated BEFORE UPDATE ON public.support_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_br_updated ON public.support_branches;
CREATE TRIGGER trg_br_updated BEFORE UPDATE ON public.support_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_dev_updated ON public.support_devices;
CREATE TRIGGER trg_dev_updated BEFORE UPDATE ON public.support_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Apply SLA on ticket insert (pick by priority, fallback to category default)
-- =========================================
CREATE OR REPLACE FUNCTION public.apply_ticket_sla()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pol record;
BEGIN
  IF NEW.sla_policy_id IS NULL THEN
    -- try category default
    SELECT sp.* INTO pol
    FROM public.support_categories c
    JOIN public.support_sla_policies sp ON sp.id = c.default_sla_policy_id
    WHERE c.value = NEW.category AND sp.active = true
    LIMIT 1;
    -- fallback: by priority
    IF pol.id IS NULL THEN
      SELECT * INTO pol FROM public.support_sla_policies
      WHERE active = true AND priority = NEW.priority
      ORDER BY sort_order ASC LIMIT 1;
    END IF;
    IF pol.id IS NOT NULL THEN
      NEW.sla_policy_id := pol.id;
    END IF;
  ELSE
    SELECT * INTO pol FROM public.support_sla_policies WHERE id = NEW.sla_policy_id;
  END IF;

  IF pol.id IS NOT NULL THEN
    IF NEW.first_response_due_at IS NULL THEN
      NEW.first_response_due_at := NEW.created_at + (pol.first_response_minutes || ' minutes')::interval;
    END IF;
    IF NEW.resolve_due_at IS NULL THEN
      NEW.resolve_due_at := NEW.created_at + (pol.resolve_minutes || ' minutes')::interval;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_apply_sla ON public.support_tickets;
CREATE TRIGGER trg_apply_sla BEFORE INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.apply_ticket_sla();

-- =========================================
-- First-response stamp (on first non-internal staff message)
-- =========================================
CREATE OR REPLACE FUNCTION public.stamp_first_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t record;
BEGIN
  IF NEW.is_internal = true THEN RETURN NEW; END IF;
  SELECT id, client_id, created_by, first_response_at INTO t FROM public.support_tickets WHERE id = NEW.ticket_id;
  IF t.first_response_at IS NOT NULL THEN RETURN NEW; END IF;
  -- only count staff (not the ticket creator/client) as first response
  IF NEW.author_id IS NOT NULL AND NEW.author_id <> COALESCE(t.client_id, t.created_by) THEN
    UPDATE public.support_tickets SET first_response_at = now() WHERE id = NEW.ticket_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_first_response ON public.support_ticket_messages;
CREATE TRIGGER trg_first_response AFTER INSERT ON public.support_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.stamp_first_response();

-- =========================================
-- Assignment change → history + event + notification
-- =========================================
CREATE OR REPLACE FUNCTION public.on_ticket_assignment_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.assigned_to::text,'') = COALESCE(OLD.assigned_to::text,'') THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.support_ticket_assignments (ticket_id, assigned_to, assigned_by, note)
  VALUES (NEW.id, NEW.assigned_to, auth.uid(), 'Assignment updated');
  INSERT INTO public.support_ticket_events (ticket_id, actor_id, event_type, from_value, to_value, note)
  VALUES (NEW.id, auth.uid(), 'assigned', COALESCE(OLD.assigned_to::text,''), COALESCE(NEW.assigned_to::text,''), 'Ticket reassigned');
  INSERT INTO public.admin_notifications (type, title, message, href, read)
  VALUES (
    'system'::notification_type,
    'Ticket reassigned — ' || COALESCE(NEW.ticket_no,'TIC'),
    COALESCE(NEW.subject,''),
    '/dashboard/admin/helpdesk/tickets/' || NEW.id::text,
    false
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assignment_change ON public.support_tickets;
CREATE TRIGGER trg_assignment_change AFTER UPDATE OF assigned_to ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.on_ticket_assignment_change();

-- =========================================
-- RLS
-- =========================================
ALTER TABLE public.support_sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_assignments ENABLE ROW LEVEL SECURITY;

-- Public read for active rows (registries); admins/managers see all
DROP POLICY IF EXISTS "Read active SLA" ON public.support_sla_policies;
CREATE POLICY "Read active SLA" ON public.support_sla_policies FOR SELECT USING (active = true OR can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Admins manage SLA" ON public.support_sla_policies;
CREATE POLICY "Admins manage SLA" ON public.support_sla_policies FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Read active categories" ON public.support_categories;
CREATE POLICY "Read active categories" ON public.support_categories FOR SELECT USING (active = true OR can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Admins manage categories" ON public.support_categories;
CREATE POLICY "Admins manage categories" ON public.support_categories FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Read active branches" ON public.support_branches;
CREATE POLICY "Read active branches" ON public.support_branches FOR SELECT USING (active = true OR can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Admins manage branches" ON public.support_branches;
CREATE POLICY "Admins manage branches" ON public.support_branches FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Managers read devices" ON public.support_devices;
CREATE POLICY "Managers read devices" ON public.support_devices FOR SELECT USING (can_manage_tickets(auth.uid()) OR (client_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage devices" ON public.support_devices;
CREATE POLICY "Admins manage devices" ON public.support_devices FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Assignment history
DROP POLICY IF EXISTS "Managers view assignments" ON public.support_ticket_assignments;
CREATE POLICY "Managers view assignments" ON public.support_ticket_assignments FOR SELECT USING (can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Assignee views own assignments" ON public.support_ticket_assignments;
CREATE POLICY "Assignee views own assignments" ON public.support_ticket_assignments FOR SELECT USING (assigned_to = auth.uid());
DROP POLICY IF EXISTS "Managers insert assignments" ON public.support_ticket_assignments;
CREATE POLICY "Managers insert assignments" ON public.support_ticket_assignments FOR INSERT TO authenticated WITH CHECK (can_manage_tickets(auth.uid()));
DROP POLICY IF EXISTS "Trigger inserts assignments" ON public.support_ticket_assignments;
CREATE POLICY "Trigger inserts assignments" ON public.support_ticket_assignments FOR INSERT WITH CHECK (true);

-- ===== 20260519094619_3caf9443-37b1-49f3-9da7-6abc98245f6e.sql =====
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

DROP POLICY IF EXISTS "Admins manage invoice recipients" ON public.support_invoice_recipients;
CREATE POLICY "Admins manage invoice recipients"
ON public.support_invoice_recipients
FOR ALL
TO authenticated
USING (has_role(auth.uid(),'admin'::app_role))
WITH CHECK (has_role(auth.uid(),'admin'::app_role));

DROP TRIGGER IF EXISTS trg_support_invoice_recipients_updated ON public.support_invoice_recipients;
CREATE TRIGGER trg_support_invoice_recipients_updated
BEFORE UPDATE ON public.support_invoice_recipients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 20260519131856_ce7a2d32-633d-46dd-9c2b-ef22234370ce.sql =====
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ===== 20260520103025_0b6f9450-2b72-4de8-844a-c22f336ad065.sql =====
CREATE TABLE IF NOT EXISTS public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active news publicly readable" ON public.news_posts;
CREATE POLICY "Active news publicly readable" ON public.news_posts
  FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins insert news" ON public.news_posts;
CREATE POLICY "Admins insert news" ON public.news_posts
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update news" ON public.news_posts;
CREATE POLICY "Admins update news" ON public.news_posts
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete news" ON public.news_posts;
CREATE POLICY "Admins delete news" ON public.news_posts
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_news_posts_updated_at ON public.news_posts;
CREATE TRIGGER trg_news_posts_updated_at BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "News images publicly readable" ON storage.objects;
CREATE POLICY "News images publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'news-images');
DROP POLICY IF EXISTS "Admins upload news images" ON storage.objects;
CREATE POLICY "Admins upload news images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins update news images" ON storage.objects;
CREATE POLICY "Admins update news images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins delete news images" ON storage.objects;
CREATE POLICY "Admins delete news images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'::app_role));

-- ===== 20260520122016_21752500-92f4-4fac-ac58-fbd0d9b2b5d0.sql =====
ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS seo_title_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description_ar text NOT NULL DEFAULT '';

-- ===== 20260608220543_5ec97f6d-498a-4f9b-bfe3-af99e623cad8.sql =====
create table if not exists public.seo_bot_settings (
  id text primary key default 'main',
  daily_enabled boolean not null default true,
  schedule_cron text not null default '0 3 * * *',
  ai_model text not null default 'google/gemini-3-flash-preview',
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.seo_bot_settings to authenticated;
grant all on public.seo_bot_settings to service_role;
alter table public.seo_bot_settings enable row level security;
DROP POLICY IF EXISTS "seo_bot_settings readable" ON public.seo_bot_settings;
create policy "seo_bot_settings readable" on public.seo_bot_settings for select using (true);
DROP POLICY IF EXISTS "seo_bot_settings admin write" ON public.seo_bot_settings;
create policy "seo_bot_settings admin write" on public.seo_bot_settings for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
insert into public.seo_bot_settings (id) values ('main') on conflict (id) do nothing;

create table if not exists public.seo_bot_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null default 'manual',
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  findings_count integer not null default 0,
  suggestions_count integer not null default 0,
  health_score integer,
  summary jsonb,
  error text
);
create index if not exists seo_bot_runs_started_at_idx on public.seo_bot_runs (started_at desc);
grant select on public.seo_bot_runs to authenticated;
grant all on public.seo_bot_runs to service_role;
alter table public.seo_bot_runs enable row level security;
DROP POLICY IF EXISTS "seo_bot_runs admin read" ON public.seo_bot_runs;
create policy "seo_bot_runs admin read" on public.seo_bot_runs for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create table if not exists public.seo_bot_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.seo_bot_runs(id) on delete cascade,
  page_id text,
  category text not null,
  severity text not null default 'info',
  title text not null,
  detail text,
  suggestion jsonb,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists seo_bot_findings_run_idx on public.seo_bot_findings (run_id);
create index if not exists seo_bot_findings_page_idx on public.seo_bot_findings (page_id);
grant select, update on public.seo_bot_findings to authenticated;
grant all on public.seo_bot_findings to service_role;
alter table public.seo_bot_findings enable row level security;
DROP POLICY IF EXISTS "seo_bot_findings admin read" ON public.seo_bot_findings;
create policy "seo_bot_findings admin read" on public.seo_bot_findings for select to authenticated using (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "seo_bot_findings admin update" ON public.seo_bot_findings;
create policy "seo_bot_findings admin update" on public.seo_bot_findings for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('seo-bot-daily');
exception when others then null;
end $$;

select cron.schedule(
  'seo-bot-daily',
  '0 3 * * *',
  $cron$
  select net.http_post(
    url := 'https://your-domain.com/api/webhooks/seo-bot-daily',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwb25mYmt5cXFhZ214YXhmbWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDY3NDMsImV4cCI6MjA5MzkyMjc0M30.SUnn8fzK_RIOWQ3VVsJG80bG3nv-vpiBmgUL1AOCXzg"}'::jsonb,
    body := '{"trigger":"cron"}'::jsonb
  );
  $cron$
);

-- ===== 20260610155811_4d2f6ecf-45af-4cfe-926e-f1863d888392.sql =====
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS meta_title_en text,
  ADD COLUMN IF NOT EXISTS meta_title_ar text,
  ADD COLUMN IF NOT EXISTS meta_description_en text,
  ADD COLUMN IF NOT EXISTS meta_description_ar text,
  ADD COLUMN IF NOT EXISTS meta_keywords text,
  ADD COLUMN IF NOT EXISTS og_image text,
  ADD COLUMN IF NOT EXISTS canonical_url text;

-- ===== 20260611173047_c5312f35-dcc4-4295-a09c-fdb1bcbd9362.sql =====
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';

-- ===== 20260612153600_40863e74-53cc-459e-829a-ba054e148a56.sql =====
UPDATE public.career_applications SET full_name='Ahmed Mostafa', email='ahmed.mostafa@example.com', phone='+20 100 111 2233', city='Cairo', country='Egypt' WHERE id='0ffc6fa0-013b-4fa1-a1ce-4a4332240ded';
UPDATE public.career_applications SET full_name='Fatma Hassan', email='fatma.hassan@example.com', phone='+20 122 444 7788', city='Alexandria', country='Egypt' WHERE id='3129dce7-28de-44c9-b8d0-9700c5fb9ace';
UPDATE public.career_applications SET full_name='Youssef Ibrahim', email='youssef.ibrahim@example.com', phone='+20 111 888 2211', city='Giza', country='Egypt' WHERE id='e9279f73-7e4d-4c7d-8a57-f59bdea20454';
UPDATE public.career_applications SET full_name='Nour Saeed', email='nour.saeed@example.com', phone='+20 106 909 4747', city='Mansoura', country='Egypt' WHERE id='382b98be-eea4-468d-8ad1-e111e0bbfe5a';
UPDATE public.career_applications SET full_name='Laila Mansour', email='laila.mansour@example.com', phone='+20 128 222 9090', city='Tanta', country='Egypt' WHERE id='6ce142b4-0361-41ac-b590-9ef7dd9931e2';
UPDATE public.career_applications SET full_name='Omar Khalil', email='omar.khalil@example.com', phone='+20 109 333 1212', city='Hurghada', country='Egypt' WHERE id='7e314c8c-5735-41ee-950f-463c051f7628';

-- ===== 20260806215939_add_gender_to_career_applications.sql =====

