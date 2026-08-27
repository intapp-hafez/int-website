-- 24_permissions_and_presets.sql

-- Add permissions JSONB column to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS permissions JSONB;

-- Create permission_presets table
CREATE TABLE IF NOT EXISTS public.permission_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description_en text,
  description_ar text,
  is_builtin boolean DEFAULT false,
  perms JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.permission_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage presets" ON public.permission_presets;
CREATE POLICY "Admins can manage presets"
  ON public.permission_presets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can view presets" ON public.permission_presets;
CREATE POLICY "Authenticated users can view presets"
  ON public.permission_presets FOR SELECT TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_permission_presets_updated_at ON public.permission_presets;
CREATE TRIGGER trg_permission_presets_updated_at BEFORE UPDATE ON public.permission_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
