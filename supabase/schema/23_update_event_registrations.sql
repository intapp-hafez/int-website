-- Add new columns to event_registrations

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS organization text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS job_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS number_of_representatives integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS dates_to_attend text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sector text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS willing_to_travel text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS transportation_requirement text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS check_in_details text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS check_out_details text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS special_requests text NOT NULL DEFAULT '';
