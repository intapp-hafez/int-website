-- ============================================================================
-- 38_add_all_remaining_page_titles.sql
-- Add remaining section titles across all pages to public.site_titles
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql/new
-- ============================================================================

INSERT INTO public.site_titles (key, page, section, badge_en, badge_ar, title_en, title_ar, subtitle_en, subtitle_ar)
VALUES
  (
    'projects.clientele', 'projects', 'Clientele Wall & Reference Network',
    'Trusted By Leading Enterprise Clients', 'قائمة الشركاء والعملاء الاستراتيجيين',
    'Our Clientele Wall & Reference Network', 'عملاؤنا وسجل الثقة والاعتماد',
    '150+ enterprise clients across sovereign ministries, Tier-1 banks, and mega commercial projects.',
    'أكثر من 150 عميلاً استراتيجياً ومؤسسة سيادية وبنكاً كبيراً في مصر والمنطقة.'
  ),
  (
    'industries.sectors', 'industries', 'Sectors Grid',
    'Industry Sectors', 'قطاعات العمل',
    'Sectors We Serve', 'القطاعات التي نخدمها',
    'Engineered low-current and mission-critical systems designed for your sector''s operational standards.',
    'أنظمة تيار خفيف وحلول بنية تحتية مصممة خصيصاً وفق المعايير التشغيلية لكل قطاع.'
  ),
  (
    'products.track_quote', 'products', 'Quote Request Tracking',
    'Quote Tracker', 'تتبع عروض الأسعار',
    'Track Your Quote Request', 'تتبع طلب عرض السعر',
    'Enter your 8-character quote number to check preparation status and formal approvals.',
    'أدخل رقم العرض المكون من 8 خانات للتحقق من حالة مراجعة واعتماد عرض السعر.'
  ),
  (
    'careers.track', 'careers', 'Application Tracking',
    'Status Tracker', 'متابعة الطلبات',
    'Track Your Job Application', 'تتبع حالة طلب التوظيف',
    'Enter your reference number to view the progress and milestones of your application.',
    'أدخل رقم المرجع الذي استلمته بعد التقديم لعرض حالة وتطورات طلبك.'
  ),
  (
    'news.updates', 'news', 'Latest Updates Grid',
    'Latest Updates', 'أحدث الأخبار',
    'Latest News & Insights', 'أحدث الأخبار والمقالات',
    'Stay informed on technical achievements, company milestones, and upcoming events.',
    'ابقَ على اطلاع بأحدث إنجازاتنا الهندسية ومشاريعنا وفعالياتنا.'
  ),
  (
    'news.related', 'news', 'Related News',
    'More Stories', 'المزيد',
    'Related News & Articles', 'أخبار ومقالات ذات صلة',
    'Explore more insights and updates from Integrated Technics.',
    'استكشف المزيد من الأخبار والتحليلات ذات الصلة من إنترجريتد تكنيكس.'
  ),
  (
    'training.faq', 'training', 'Training FAQ Page',
    'Training', 'التدريب',
    'Training FAQ', 'الأسئلة الشائعة عن التدريب',
    'Everything you need to know about registration, dates, trainers and certificates.',
    'كل ما تحتاج معرفته عن التسجيل والمواعيد والمدربين والشهادات.'
  ),
  (
    'training.portal', 'training', 'Learner Portal (My Training)',
    'Learner Portal', 'بوابة المتدربين',
    'My Training & Certificates', 'تدريباتي وشهادات الحضور',
    'Track your pending requests, approved sessions and downloadable certificates.',
    'تابع طلباتك المسجلة والجلسات المعتمدة وقم بتحميل شهادات الحضور الرسمية.'
  ),
  (
    'contact.channels', 'contact', 'Quick Contact Channels',
    'Direct Channels', 'قنوات مباشرة',
    'Quick Contact Channels', 'قنوات الاتصال المباشر',
    'Reach our sales, support, and engineering teams directly.',
    'تواصل مباشرة مع فرق المبيعات والدعم الفني والهندسة.'
  ),
  (
    'contact.form', 'contact', 'Inquiry & RFP Form',
    'Get in Touch', 'تواصل معنا',
    'Send an Inquiry or RFP', 'أرسل تفاصيل مشروعك أو استفسارك',
    'Fill in the details below and a certified solutions architect will review your project requirements.',
    'املأ النموذج أدناه وسيتولى مهندس حلول متخصص مراجعة متطلباتك والرد عليك.'
  ),
  (
    'contact.map', 'contact', 'Headquarters & Branches Map',
    'Our Location', 'موقعنا',
    'Headquarters Location', 'موقع المقر الرئيسي',
    'Visit our engineering headquarters in Cairo or connect with our regional branches.',
    'تفضل بزيارة مقرنا الهندسي في القاهرة أو تواصل مع فروعنا الإقليمية.'
  ),
  (
    'page.policies', 'global', 'Privacy Policy & Governance',
    'Data Privacy & Governance', 'الخصوصية والأمان',
    'Privacy Policy & Compliance', 'سياسة الخصوصية والأمان',
    'Our commitment to safeguarding enterprise client data, project secrecy, and regulatory compliance.',
    'التزامنا الراسخ بحماية بيانات العملاء وخصوصية المشروعات والامتثال لأعلى المعايير الدولية.'
  )
ON CONFLICT (key) DO UPDATE SET
  page = EXCLUDED.page,
  section = EXCLUDED.section,
  badge_en = COALESCE(public.site_titles.badge_en, EXCLUDED.badge_en),
  badge_ar = COALESCE(public.site_titles.badge_ar, EXCLUDED.badge_ar),
  title_en = COALESCE(public.site_titles.title_en, EXCLUDED.title_en),
  title_ar = COALESCE(public.site_titles.title_ar, EXCLUDED.title_ar),
  subtitle_en = COALESCE(public.site_titles.subtitle_en, EXCLUDED.subtitle_en),
  subtitle_ar = COALESCE(public.site_titles.subtitle_ar, EXCLUDED.subtitle_ar);

