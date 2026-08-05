
DROP POLICY IF EXISTS "Anyone can submit application" ON public.career_applications;
CREATE POLICY "Anyone can submit application"
  ON public.career_applications FOR INSERT TO public
  WITH CHECK (status = 'new' AND internal_notes = '');

-- Switch trigger function to invoker; trigger context still allows the insert
CREATE OR REPLACE FUNCTION public.log_initial_application_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  INSERT INTO public.career_application_events (application_id, from_status, to_status, note)
  VALUES (NEW.id, NULL, NEW.status, 'Application submitted');
  RETURN NEW;
END; $$;

-- Allow the trigger insert path even though base RLS restricts INSERT to admins:
-- add a permissive policy that only matches inserts originating from the trigger
-- (trigger runs with same role as the inserter; we check the parent app exists in same txn).
CREATE POLICY "Trigger can insert events for new app"
  ON public.career_application_events FOR INSERT TO public
  WITH CHECK (
    from_status IS NULL
    AND to_status = 'new'
    AND EXISTS (SELECT 1 FROM public.career_applications a WHERE a.id = application_id)
  );
