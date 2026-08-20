-- Add RLS policies for admin management of product categories
CREATE POLICY "Categories insertable by authenticated"
  ON public.product_categories FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Categories updatable by authenticated"
  ON public.product_categories FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Categories deletable by authenticated"
  ON public.product_categories FOR DELETE TO authenticated
  USING (true);
