
-- Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
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
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- About content: admins can write
CREATE POLICY "Admins can insert about_content"
  ON public.about_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update about_content"
  ON public.about_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete about_content"
  ON public.about_content FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage RLS for about-images bucket: public read, admin write
CREATE POLICY "Public can read about-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'about-images');

CREATE POLICY "Admins can upload about-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'about-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update about-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'about-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete about-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'about-images' AND public.has_role(auth.uid(), 'admin'));
