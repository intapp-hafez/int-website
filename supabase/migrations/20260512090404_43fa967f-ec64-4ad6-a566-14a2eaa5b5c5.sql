CREATE TABLE public.chatbot_qa (
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

CREATE POLICY "Chatbot Q&A is publicly readable"
  ON public.chatbot_qa FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert chatbot_qa"
  ON public.chatbot_qa FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update chatbot_qa"
  ON public.chatbot_qa FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete chatbot_qa"
  ON public.chatbot_qa FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_chatbot_qa_updated_at
  BEFORE UPDATE ON public.chatbot_qa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.chatbot_qa (question_en, question_ar, answer_en, answer_ar, keywords, sort_order) VALUES
('What services do you offer?', 'ما الخدمات التي تقدمونها؟', 'We provide turnkey security, ICT, AV, and data center integration services for enterprises across the region.', 'نقدم خدمات متكاملة للأمن وتقنية المعلومات والاتصالات والصوتيات والمرئيات ومراكز البيانات للشركات في المنطقة.', 'services خدمات', 1),
('How can I request a quotation?', 'كيف أطلب عرض سعر؟', 'You can submit a request through our Contact page or your client workspace, and our team will respond within one business day.', 'يمكنك إرسال طلبك من خلال صفحة الاتصال أو من مساحة العميل، وسيرد فريقنا خلال يوم عمل واحد.', 'quote quotation pricing سعر عرض', 2),
('How do I contact support?', 'كيف أتواصل مع الدعم؟', 'Open a ticket from your workspace under Support Tickets, or email support@integratedtechnics.com.', 'افتح تذكرة من مساحة العمل في قسم تذاكر الدعم، أو راسلنا على support@integratedtechnics.com.', 'support help دعم مساعدة', 3),
('What industries do you serve?', 'ما القطاعات التي تخدمونها؟', 'We serve government, banking, healthcare, education, retail, hospitality, and oil & gas sectors.', 'نخدم قطاعات الحكومة والبنوك والرعاية الصحية والتعليم والتجزئة والضيافة والنفط والغاز.', 'industries sectors قطاعات', 4);