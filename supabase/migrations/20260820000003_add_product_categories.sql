CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories publicly readable"
  ON public.product_categories FOR SELECT TO public
  USING (true);

INSERT INTO public.product_categories (name_en, name_ar) VALUES
('Network & Security', 'الشبكات والأمن'),
('Gate Security', 'أمن البوابات'),
('Data Center Solution', 'حلول مراكز البيانات'),
('Routing and Switching', 'التوجيه والتبديل'),
('Enterprise Security Solution', 'حلول أمن المؤسسات'),
('Wireless Broadband Connectivity', 'اتصالات النطاق العريض اللاسلكية');
