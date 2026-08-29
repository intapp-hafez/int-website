-- Training registrations: approval workflow + completion certificates.
-- Run in the Supabase SQL editor (after 21_trainings.sql).

ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS trainer_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notify_emails text NOT NULL DEFAULT '';

ALTER TABLE public.training_registrations
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS certificate_no text,
  ADD COLUMN IF NOT EXISTS admin_note text NOT NULL DEFAULT '';

-- New registrations start as pending until an admin approves them.
ALTER TABLE public.training_registrations ALTER COLUMN status SET DEFAULT 'pending';
UPDATE public.training_registrations SET status = 'pending' WHERE status = 'new';

CREATE UNIQUE INDEX IF NOT EXISTS training_registrations_certificate_no_key
  ON public.training_registrations(certificate_no)
  WHERE certificate_no IS NOT NULL;

-- Anonymous learners may only create pending rows (never self-approve).
DROP POLICY IF EXISTS "Anyone can register for an active training" ON public.training_registrations;
CREATE POLICY "Anyone can register for an active training" ON public.training_registrations
  FOR INSERT WITH CHECK (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM public.trainings t WHERE t.id = training_id AND t.active = true)
  );
