-- ============================================================================
-- 35_site_titles.sql
-- Dynamic Page & Section Titles Management for Integrated Technics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.site_titles (
  key text PRIMARY KEY,
  page text NOT NULL DEFAULT 'home',
  section text NOT NULL DEFAULT 'General',
  badge_en text,
  badge_ar text,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  subtitle_en text,
  subtitle_ar text,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.site_titles ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Site titles publicly readable" ON public.site_titles;
CREATE POLICY "Site titles publicly readable" ON public.site_titles
  FOR SELECT USING (true);

-- Admin & authenticated full management
DROP POLICY IF EXISTS "Admins manage site titles" ON public.site_titles;
CREATE POLICY "Admins manage site titles" ON public.site_titles
  FOR ALL USING (auth.role() = 'authenticated');

-- Seed initial default titles
INSERT INTO public.site_titles (key, page, section, badge_en, badge_ar, title_en, title_ar, subtitle_en, subtitle_ar)
VALUES
  (
    'home.hero', 'home', 'Hero Section',
    'Enterprise System Integration', 'تكامل الأنظمة المؤسسية',
    'Integrated Technics for Enterprise Excellence', 'حلول أمنية وتقنية متكاملة للمؤسسات الرائدة',
    'Turnkey integration across security, networks, audio-visual and data centers — delivered end-to-end by certified engineers.', 'حلول جاهزة وشاملة في الأمن والشبكات والأنظمة الصوتية والمرئية ومراكز البيانات — يقدمها مهندسون معتمدون من البداية إلى التشغيل.'
  ),
  (
    'home.wheel', 'home', 'Interactive Wheel Hub',
    'Core Disciplines', 'مجالات التخصص',
    'Interactive Systems Architecture', 'هندسة الأنظمة التفاعلية',
    'Explore our core engineering disciplines through our unified architecture wheel.', 'استكشف مجالاتنا الهندسية المتكاملة من خلال عجلة المعمارية التفاعلية.'
  ),
  (
    'home.solutions', 'home', 'Solutions Section',
    'Integrated Solutions', 'الحلول المتكاملة',
    'Turnkey Engineering Systems', 'أنظمة هندسية متكاملة',
    'End-to-end design, supply, installation, testing and commissioning for critical infrastructure.', 'تصميم وتوريد وتركيب واختبار وتشغيل متكامل للبنى التحتية الحيوية.'
  ),
  (
    'home.services', 'home', 'Services Section',
    'Our Services', 'خدماتنا الأساسية',
    'Core Services', 'خدماتنا الأساسية',
    'End-to-end design, integration and support for mission-critical infrastructure.', 'تصميم وتكامل ودعم شامل للبنى التحتية الحرجة.'
  ),
  (
    'home.products', 'home', 'Systems Catalog Section',
    'Enterprise Systems', 'أنظمة المؤسسات',
    'Certified Hardware & Technology Ecosystem', 'أجهزة ومنظومات تقنية معتمدة',
    'Enterprise-grade equipment and hardware platforms from global OEM partners.', 'أحدث الأجهزة والمعدات المؤسسية من شركائنا العالميين المعتمدين.'
  ),
  (
    'home.projects', 'home', 'Projects Section',
    'Case Studies', 'مشاريع مختارة',
    'Featured Projects', 'مشاريع مختارة',
    'Selected case studies across the region.', 'نماذج من أعمالنا ومشاريعنا المنفذة في المنطقة.'
  ),
  (
    'home.industries', 'home', 'Industries Section',
    'Industries', 'القطاعات',
    'Industries We Serve', 'القطاعات التي نخدمها',
    'Trusted across regulated, high-availability sectors.', 'موثوق بنا في القطاعات عالية الأهمية والحساسية.'
  ),
  (
    'home.partners', 'home', 'Partners Section',
    'Ecosystem', 'شركاء التكنولوجيا',
    'Technology Partners', 'شركاؤنا التقنيون',
    'Authorized partner of the world''s leading vendors.', 'شريك معتمد لأبرز الشركات العالمية ومصنعي التكنولوجيا.'
  ),
  (
    'home.why', 'home', 'Why Choose Us Section',
    'Why Us', 'لماذا تختارنا',
    'Why Choose Us', 'لماذا تختارنا',
    'Architectures designed for operational reality, backed by OEM certifications and round-the-clock SLAs.', 'معماريات مصممة لواقعك التشغيلي، مدعومة باعتمادات المصنّعين واتفاقيات دعم على مدار الساعة.'
  ),
  (
    'home.testimonials', 'home', 'Testimonials Section',
    'Testimonials', 'آراء العملاء',
    'What Our Clients Say', 'ماذا يقول عملاؤنا',
    'Feedback from enterprise leaders and project directors across Egypt.', 'شهادات وتقييمات من قيادات المؤسسات ومديري المشاريع في مصر.'
  ),
  (
    'home.recommendations', 'home', 'Smart Advisor Section',
    'Smart Advisor', 'المستشار الذكي',
    'Find the Right Solution for Your Facility', 'اكتشف الحل الأمثل لمنشأتك',
    'Answer a few questions to get tailored architecture and system recommendations.', 'أجب عن بضعة أسئلة للحصول على توصيات معمارية وأنظمة مخصصة لاحتياجاتك.'
  ),
  (
    'home.news', 'home', 'Latest News Section',
    'Insights', 'الأخبار والمقالات',
    'Latest News', 'آخر الأخبار',
    'Updates and insights from across our engineering projects.', 'تحديثات ومقالات ورؤى من واقع مشاريعنا الهندسية.'
  ),
  (
    'home.cta', 'home', 'Call to Action Section',
    'Get Started', 'ابدأ الآن',
    'Start Your Project With Us Today', 'ابدأ مشروعك معنا اليوم',
    'Talk to a solutions architect and receive a tailored proposal in 48 hours.', 'تحدث مع مهندس حلول واحصل على عرض مخصص خلال 48 ساعة.'
  ),
  (
    'page.about', 'about', 'Header Banner',
    'About Us', 'من نحن',
    'About Integrated Technics', 'عن Integrated Technics',
    'Two decades engineering complex systems for the region''s most demanding enterprises.', 'عقدان من هندسة الأنظمة المعقدة لأكثر المؤسسات تطلبًا في المنطقة.'
  ),
  (
    'page.services', 'services', 'Header Banner',
    'Specialized Services', 'خدماتنا المتخصصة',
    'Comprehensive Engineering Services', 'خدمات هندسية متكاملة',
    'End-to-end design, implementation, and lifecycle management for enterprise low-current & ICT infrastructure.', 'تصميم وتنفيذ وإدارة شاملة للبنى التحتية للتيار الخفيف وتكنولوجيا المعلومات.'
  ),
  (
    'page.solutions', 'solutions', 'Header Banner',
    'Turnkey Solutions', 'حلول متكاملة',
    'Enterprise Technology Solutions', 'حلول تقنية للمؤسسات',
    'Explore integrated systems engineered for enterprise scale, security, and reliability.', 'استكشف أنظمة متكاملة مصممة لتلائم حجم المؤسسات وأعلى معايير الأمان والاعتمادية.'
  ),
  (
    'page.products', 'products', 'Header Banner',
    'Systems Catalog', 'كتالوج الأنظمة',
    'Certified Hardware & Technology Systems', 'أجهزة ومنظومات تقنية معتمدة',
    'Browse certified enterprise hardware, switches, servers, IP surveillance, and access control solutions.', 'استعرض أجهزة المؤسسات المعتمدة ومحولات الشبكة والخوادم وكاميرات المراقبة وأنظمة التحكم بالدخول.'
  ),
  (
    'page.projects', 'projects', 'Header Banner',
    'Our Portfolio', 'سجل مشاريعنا',
    'Engineering Projects Portfolio', 'سجل المشاريع والأعمال الهندسية',
    'Showcasing delivered enterprise security, networking, AV and smart building installations across Egypt.', 'استعراض للمشاريع المنفذة في الأمن والشبكات والصوتيات والمباني الذكية في مصر.'
  ),
  (
    'page.industries', 'industries', 'Header Banner',
    'Sectors', 'القطاعات',
    'Industries We Serve', 'القطاعات التي نخدمها',
    'Specialized low-current and ICT systems tailored to regulatory and operational demands of critical sectors.', 'أنظمة تيار خفيف وتكنولوجيا معلومات مخصصة للمتطلبات التشغيلية والتنظيمية للقطاعات الحيوية.'
  ),
  (
    'page.partners', 'partners', 'Header Banner',
    'Global Alliances', 'تحالفات عالمية',
    'Technology Partners & Vendor Ecosystem', 'منظومة الشركاء والموردين العالميين',
    'We partner with world-renowned technology brands to deliver certified turnkey solutions.', 'نتعاون مع كبرى الشركات العالمية لتقديم حلول معتمدة ومتكاملة.'
  ),
  (
    'page.careers', 'careers', 'Header Banner',
    'Join Our Team', 'انضم إلى فريقنا',
    'Build the Future With Integrated Technics', 'اصنع مستقبلك مع إنتجريتد تكنيكس',
    'Explore open engineering, project management, and technology career opportunities.', 'استكشف الوظائف الشاغرة للمهندسين ومديري المشاريع والمتخصصين في التكنولوجيا.'
  ),
  (
    'page.news', 'news', 'Header Banner',
    'Press & Articles', 'الأخبار والمقالات',
    'News, Insights & Technology Updates', 'أحدث الأخبار والمقالات والتقنيات',
    'Stay updated with industry trends, project milestones, and tech announcements.', 'تابع أحدث اتجاهات الصناعة وإنجازات مشاريعنا وأخبار التكنولوجيا.'
  ),
  (
    'page.events', 'events', 'Header Banner',
    'Events & Expos', 'الفعاليات والمعارض',
    'Upcoming Events & Industry Conferences', 'الفعاليات القادمة والمؤتمرات التقنية',
    'Connect with our engineering leaders at international technology exhibitions and workshops.', 'تواصل مع قياداتنا الهندسية في المعارض وورش العمل التقنية الدولية.'
  ),
  (
    'page.training', 'training', 'Header Banner',
    'Academy', 'أكاديمية التدريب',
    'Professional Engineering Training & Certifications', 'برامج تدريب هندسية وشهادات معتمدة',
    'Hands-on training courses in low-current, networking, security, and smart building integration.', 'دورات تدريبية عملية في مجالات التيار الخفيف والشبكات والأنظمة الأمنية والمباني الذكية.'
  ),
  (
    'page.contact', 'contact', 'Header Banner',
    'Get In Touch', 'تواصل معنا',
    'Let''s Architect Your Infrastructure', 'لنبني معاً بنيتك التحتية المتكاملة',
    'Talk directly to our senior certified engineers. Tailored proposals within 24–48 hours.', 'تحدث مباشرة مع كبار مهندسينا المعتمدين. عروض أسعار ودراسات فنية خلال 24–48 ساعة.'
  ),
  (
    'page.faqs', 'faqs', 'Header Banner',
    'FAQ', 'الأسئلة الشائعة',
    'Frequently Asked Questions', 'الأسئلة الأكثر شيوعاً',
    'Everything you need to know about our turnkey integration process, warranties, and support.', 'كل ما تحتاج لمعرفته حول مراحل تنفيذ المشاريع وفترات الضمان وخدمات الدعم الفني.'
  ),
  (
    'global.footer', 'global', 'Footer Section',
    NULL, NULL,
    'Integrated Technics', 'إنتجريتد تكنيكس',
    'Integrated security and ICT solutions for the enterprises that power the region.', 'حلول أمنية وتقنية متكاملة للمؤسسات الرائدة في المنطقة.'
  )
ON CONFLICT (key) DO NOTHING;

