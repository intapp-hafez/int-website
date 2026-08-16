-- =================================================================
-- 12_notification_settings.sql
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql
-- =================================================================

-- 1. Ensure site_settings table exists
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Settings publicly readable" ON public.site_settings;
CREATE POLICY "Settings publicly readable" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage settings" ON public.site_settings;
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Initial Seed for Notification Settings
INSERT INTO public.site_settings (id, value, updated_at)
VALUES (
  'notification_settings',
  '{
    "enabled": {
      "lead": true,
      "ticket": true,
      "career": true,
      "chat": true,
      "security": true,
      "slide": true,
      "system": true
    },
    "categoryEmails": {
      "lead": "sales@integratedtechnics.com, commercial@integratedtechnics.com",
      "ticket": "support@integratedtechnics.com, helpdesk@integratedtechnics.com",
      "career": "hr@integratedtechnics.com, careers@integratedtechnics.com",
      "chat": "livechat@integratedtechnics.com, sales@integratedtechnics.com",
      "security": "security@integratedtechnics.com, it-admin@integratedtechnics.com",
      "slide": "marketing@integratedtechnics.com",
      "system": "devops@integratedtechnics.com, admin@integratedtechnics.com"
    },
    "frequency": "instant",
    "soundEnabled": true,
    "soundTone": "chime",
    "soundVolume": 0.8,
    "desktopEnabled": true,
    "emailEnabled": true,
    "emailRecipients": "admin@integratedtechnics.com",
    "emailFrequency": "instant",
    "whatsappEnabled": true,
    "whatsappPhone": "+201007419344",
    "webhookEnabled": false,
    "webhookUrl": "",
    "dndEnabled": false,
    "dndStart": "22:00",
    "dndEnd": "08:00",
    "priorityFilter": "all"
  }'::jsonb,
  now()
)
ON CONFLICT (id) DO NOTHING;
