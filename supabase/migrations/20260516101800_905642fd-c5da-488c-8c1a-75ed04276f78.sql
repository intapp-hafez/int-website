
-- Job postings: richer fields
DO $$ BEGIN
  CREATE TYPE public.career_experience_level AS ENUM ('intern','junior','mid','senior','lead');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.career_remote_policy AS ENUM ('onsite','hybrid','remote');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.career_jobs
  ADD COLUMN IF NOT EXISTS experience_level public.career_experience_level NOT NULL DEFAULT 'mid',
  ADD COLUMN IF NOT EXISTS min_years_experience integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS openings integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deadline date,
  ADD COLUMN IF NOT EXISTS salary_min numeric,
  ADD COLUMN IF NOT EXISTS salary_max numeric,
  ADD COLUMN IF NOT EXISTS salary_currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS remote_policy public.career_remote_policy NOT NULL DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS responsibilities_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsibilities_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requirements_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requirements_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nice_to_have_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nice_to_have_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS benefits_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS benefits_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS apply_email text NOT NULL DEFAULT '';

-- Applications: richer candidate detail
ALTER TABLE public.career_applications
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS current_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_company text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS highest_education text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS university text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nationality text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS expected_salary numeric,
  ADD COLUMN IF NOT EXISTS salary_currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS earliest_start_date date,
  ADD COLUMN IF NOT EXISTS notice_period_days integer,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS portfolio_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS consent_processing boolean NOT NULL DEFAULT false;
