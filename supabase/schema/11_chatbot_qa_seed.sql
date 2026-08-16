-- =================================================================
-- 11_chatbot_qa_seed.sql
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql
-- =================================================================

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

-- Enable RLS
ALTER TABLE public.chatbot_qa ENABLE ROW LEVEL SECURITY;

-- Public can read all active chatbot Q&A
DROP POLICY IF EXISTS "Chatbot Q&A is publicly readable" ON public.chatbot_qa;
CREATE POLICY "Chatbot Q&A is publicly readable"
  ON public.chatbot_qa FOR SELECT
  USING (true);

-- Admins can insert/update/delete chatbot Q&A
DROP POLICY IF EXISTS "Admins can manage chatbot_qa" ON public.chatbot_qa;
CREATE POLICY "Admins can manage chatbot_qa"
  ON public.chatbot_qa FOR ALL
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

-- Seed Enterprise Q&A
INSERT INTO public.chatbot_qa (question_en, question_ar, answer_en, answer_ar, keywords, sort_order, active)
VALUES
  (
    'What services do you offer?',
    'ما الخدمات التي تقدمونها؟',
    'We provide turnkey Security Systems (CCTV & Access Control), Enterprise Network Infrastructure, Data Centers, Audio/Video Boardrooms, and Technology Consultation.',
    'نقدم حلولاً متكاملة لأنظمة الأمن والمراقبة (CCTV والتحكم بالدخول)، والبنية التحتية للشبكات، ومراكز البيانات، وتجهيز قاعات الاجتماعات الصوتية والمرئية، والاستشارات التقنية.',
    'services products solutions cctv network security خدمات منتجات حلول شبكات امن',
    1,
    true
  ),
  (
    'How can I request a price quote or proposal?',
    'كيف يمكنني طلب عرض سعر أو دراسة مشروع؟',
    'You can request a proposal directly via our Contact page, by clicking "Request a Quote" on any Service page, or by chatting with our engineers on WhatsApp.',
    'يمكنك طلب عرض سعر مباشرة عبر صفحة "اتصل بنا"، أو بالنقر على "طلب عرض سعر" في أي صفحة خدمة، أو بالتواصل المباشر مع مهندسينا عبر واتساب.',
    'quote pricing cost proposal proposal boq سعر تكلفة عرض اسعار مناقصة',
    2,
    true
  ),
  (
    'What industries do you serve?',
    'ما القطاعات التي تخدمونها؟',
    'We serve Government, Banking & Financial Institutions, Healthcare & Hospitals, Education & Campuses, Retail & Commercial Malls, Hospitality, and Industrial Mega-Projects.',
    'نخدم القطاعات الحكومية، البنوك والمؤسسات المالية، المستشفيات والرعاية الصحية، التعليم والجامعات، المراكز التجارية، الفنادق والمشاريع الصناعية الكبرى.',
    'industries sectors banking healthcare government قطاعات بنوك مستشفيات حكومة مصانع',
    3,
    true
  ),
  (
    'How do I contact technical support or open a maintenance ticket?',
    'كيف أتواصل مع الدعم الفني أو أفتح تذكرة صيانة؟',
    'You can open a support ticket directly from your Client Workspace under Support Tickets, or reach our 24/7 engineering helpdesk via WhatsApp or email.',
    'يمكنك فتح تذكرة دعم فني مباشرة من لوحة تحكم العميل عبر قسم "تذاكر الدعم"، أو التواصل مع فريق الصيانة 24/7 عبر واتساب والبريد الإلكتروني.',
    'support maintenance ticket helpdesk sla صيانة دعم تذكرة طوارئ بلاغ',
    4,
    true
  ),
  (
    'Where are your offices located and what regions do you cover?',
    'أين تقع مكاتبكم وما النطاق الجغرافي لخدماتكم؟',
    'Our headquarters are based in Cairo, Egypt, delivering enterprise infrastructure projects across Egypt, Saudi Arabia, and the wider MENA region.',
    'يقع مقرنا الرئيسي في القاهرة، مصر، وننفذ المشاريع الكبرى في جميع أنحاء جمهورية مصر العربية والمملكة العربية السعودية ومنطقة الشرق الأوسط.',
    'location office address cairo egypt ksa mena عنوان موقع مقر القاهرة مصر السعودية',
    5,
    true
  )
ON CONFLICT DO NOTHING;
