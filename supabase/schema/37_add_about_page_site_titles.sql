-- ============================================================================
-- 37_add_about_page_site_titles.sql
-- Add remaining About page section titles to site_titles table
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql/new
-- ============================================================================

INSERT INTO public.site_titles (key, page, section, badge_en, badge_ar, title_en, title_ar, subtitle_en, subtitle_ar)
VALUES
  (
    'about.overview', 'about', 'Company Overview & Story',
    'Who We Are & History', 'من نحن وقصتنا',
    'Architecting the Future of Enterprise Technology', 'نبذة عن إنترجريتد تكنيكس',
    'Integrated Technics stands as a premier regional technology engineering and systems integration firm, delivering certified turnkey infrastructure for high-demand enterprise environments.',
    'تأسست شركة إنترجريتد تكنيكس لتكون الشريك الهندسي المعتمد للهيئات والمؤسسات الكبرى في تصميم وتنفيذ البنية التحتية التكنولوجية وحلول الأمن المتكاملة.'
  ),
  (
    'about.triad', 'about', 'Strategic Compass & Triad',
    'Strategic Compass & Values', 'بوصلتنا الاستراتيجية وقيمنا',
    'Vision, Mission & Core Values', 'الرؤية، الرسالة والقيم الجوهرية',
    'The foundational pillars that guide our engineering strategy, stringent quality standards, and ethical commitment to enterprise clients.',
    'الركائز الأساسية التي تقود استراتيجيتنا الهندسية، معايير الجودة الصارمة، والتزامنا الأخلاقي المستمر تجاه عملائنا.'
  ),
  (
    'about.values', 'about', 'Core Values Section',
    'Uncompromising Principles', 'ركائزنا ومبادئنا الراسخة',
    'The Core Values Driving Our Engineering', 'القيم الجوهرية التي تحكم عملنا',
    'Six immutable principles that govern every cable run, command center configuration, and client relationship.',
    'ستة معايير لا مساومة عليها تحكم كل تمديد كابل، تجهيز غرفة عمليات، وشراكة نبنيها مع كبرى المؤسسات.'
  ),
  (
    'about.certifications', 'about', 'Certifications & Standards',
    'Quality Certifications', 'الاعتمادات والمعايير',
    'Certified Standards & Compliance', 'الشهادات والاعتمادات الدولية',
    'Engineered in accordance with rigorous global standards',
    'نلتزم بأعلى معايير السلامة والجودة العالمية'
  ),
  (
    'about.team', 'about', 'Leadership & Engineering Team',
    'Engineering Leadership', 'قادة الهندسة والتنفيذ',
    'Leadership & Engineering Team', 'فريق القيادة والهندسة المعتمد',
    'Certified systems architects, project leaders and engineering directors transforming complexity into reliable turnkey outcomes.',
    'مهندسون معتمدون وقادة مشاريع ومستشارون يحولون التعقيد إلى نتائج موثوقة لأكثر من 500 مشروع قومي وخاص.'
  ),
  (
    'about.cta', 'about', 'Call to Action Section',
    'Call to Action', 'دعوة للتواصل',
    'Ready to Engineer Your Next Turnkey Facility?', 'جاهز لبدء مشروعك الهندسي القادم؟',
    'Connect with our certified systems architects for an on-site technical assessment and formal proposal delivered within 24-48 hours.',
    'تواصل مع كبار مهندسينا للحصول على دراسة جدوى مجانية وعرض فني ومالي مفصل خلال 24-48 ساعة.'
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

