-- Add responsible_emails to support_categories table
ALTER TABLE IF EXISTS public.support_categories
ADD COLUMN IF NOT EXISTS responsible_emails text NOT NULL DEFAULT '';
