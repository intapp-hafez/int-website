-- Part 1: enum types. Run this FIRST, then 02_schema.sql, then 03_lookups_and_grants.sql.

DO $guard$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $guard$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('lead', 'slide', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.career_app_status AS ENUM ('new','reviewed','shortlisted','interviewed','offered','accepted','rejected','withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $guard$ BEGIN
  CREATE TYPE public.career_employment_type AS ENUM ('full_time','part_time','contract','internship');
EXCEPTION WHEN duplicate_object THEN null; END $guard$;

DO $$ BEGIN
  CREATE TYPE public.career_experience_level AS ENUM ('intern','junior','mid','senior','lead');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.career_remote_policy AS ENUM ('onsite','hybrid','remote');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_priority AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM ('new','open','in_progress','waiting_client','resolved','closed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'helpdesk_manager';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technician';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client_user';
