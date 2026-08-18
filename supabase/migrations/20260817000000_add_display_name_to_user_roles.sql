-- Add display_name to user_roles so admins can label each staff member
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS display_name text;
