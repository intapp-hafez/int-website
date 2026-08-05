INSERT INTO storage.buckets (id, name, public) VALUES ('slide-images', 'slide-images', true);

CREATE POLICY "Slide images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'slide-images');

CREATE POLICY "Admins can upload slide images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'slide-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update slide images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'slide-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete slide images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'slide-images' AND has_role(auth.uid(), 'admin'::app_role));