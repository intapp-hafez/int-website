-- Add accept_registration and external_registration_url to public.events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS accept_registration boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS external_registration_url text NOT NULL DEFAULT '';
