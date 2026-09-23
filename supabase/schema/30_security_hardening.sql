-- =================================================================
-- Migration 30: Security hardening (run in the Supabase SQL editor)
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql/new
-- =================================================================

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role NOT IN ('user','client_user'))
$$;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

ALTER FUNCTION public.handle_new_user_role() SET search_path = public;
ALTER FUNCTION public.get_admin_users() SET search_path = public;
ALTER FUNCTION public.fn_dispatch_notification_webhook() SET search_path = public;

-- Live chat
DROP POLICY IF EXISTS "Staff can delete chat messages" ON public.live_chat_messages;
CREATE POLICY "Staff can delete chat messages" ON public.live_chat_messages FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Anyone can update chat messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Staff can update chat messages" ON public.live_chat_messages;
CREATE POLICY "Staff can update chat messages" ON public.live_chat_messages FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can delete chat session" ON public.live_chat_sessions;
CREATE POLICY "Staff can delete chat session" ON public.live_chat_sessions FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Anyone can select sessions" ON public.live_chat_sessions;
DROP POLICY IF EXISTS "Staff can select sessions" ON public.live_chat_sessions;
CREATE POLICY "Staff can select sessions" ON public.live_chat_sessions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE OR REPLACE FUNCTION public.get_live_chat_session_status(_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT status FROM public.live_chat_sessions WHERE id = _id
$$;
GRANT EXECUTE ON FUNCTION public.get_live_chat_session_status(uuid) TO anon, authenticated;

-- CMS content: staff manage, public reads active rows
DROP POLICY IF EXISTS "Admins manage projects" ON public.projects;
DROP POLICY IF EXISTS "Staff manage projects" ON public.projects;
CREATE POLICY "Staff manage projects" ON public.projects FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Public reads active projects" ON public.projects;
CREATE POLICY "Public reads active projects" ON public.projects FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins manage partners" ON public.partners;
DROP POLICY IF EXISTS "Staff manage partners" ON public.partners;
CREATE POLICY "Staff manage partners" ON public.partners FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Public reads active partners" ON public.partners;
CREATE POLICY "Public reads active partners" ON public.partners FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
DROP POLICY IF EXISTS "Staff manage products" ON public.products;
CREATE POLICY "Staff manage products" ON public.products FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Public reads active products" ON public.products;
CREATE POLICY "Public reads active products" ON public.products FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage solutions" ON public.solutions;
DROP POLICY IF EXISTS "Staff manage solutions" ON public.solutions;
CREATE POLICY "Staff manage solutions" ON public.solutions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Public reads active solutions" ON public.solutions;
CREATE POLICY "Public reads active solutions" ON public.solutions FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can update about_content" ON public.about_content;
CREATE POLICY "Admins can update about_content" ON public.about_content FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Admins can insert about_content" ON public.about_content;
CREATE POLICY "Admins can insert about_content" ON public.about_content FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Admins can delete about_content" ON public.about_content;
CREATE POLICY "Admins can delete about_content" ON public.about_content FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Categories deletable by authenticated" ON public.product_categories;
DROP POLICY IF EXISTS "Categories deletable by staff" ON public.product_categories;
CREATE POLICY "Categories deletable by staff" ON public.product_categories FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Slides are publicly readable" ON public.homepage_slides;
CREATE POLICY "Slides are publicly readable" ON public.homepage_slides FOR SELECT USING (active = true OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Chatbot Q&A is publicly readable" ON public.chatbot_qa;
CREATE POLICY "Chatbot Q&A is publicly readable" ON public.chatbot_qa FOR SELECT USING (active = true OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Public can view published services" ON public.services;
CREATE POLICY "Public can view published services" ON public.services FOR SELECT USING (published = true OR public.is_staff(auth.uid()));

-- Public submissions: constrained
DROP POLICY IF EXISTS "Public can submit reviews" ON public.reviews;
CREATE POLICY "Public can submit reviews" ON public.reviews FOR INSERT WITH CHECK (approved = false AND rating BETWEEN 1 AND 5 AND length(text) <= 2000);
ALTER TABLE public.client_assessments ALTER COLUMN client_id SET DEFAULT auth.uid();
DROP POLICY IF EXISTS "Users can create assessments" ON public.client_assessments;
CREATE POLICY "Users can create assessments" ON public.client_assessments FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());
DROP POLICY IF EXISTS "anyone can insert install events" ON public.pwa_install_events;
CREATE POLICY "anyone can insert install events" ON public.pwa_install_events FOR INSERT WITH CHECK (length(event_type) <= 40 AND coalesce(length(platform),0) <= 40 AND coalesce(length(user_agent),0) <= 500);
DROP POLICY IF EXISTS "Trigger inserts assignments" ON public.support_ticket_assignments;
DROP POLICY IF EXISTS "Managers insert assignments" ON public.support_ticket_assignments;
CREATE POLICY "Managers insert assignments" ON public.support_ticket_assignments FOR INSERT TO authenticated WITH CHECK (public.can_manage_tickets(auth.uid()));

-- Sensitive settings: admin / staff only
DROP POLICY IF EXISTS "SMTP settings publicly readable" ON public.smtp_settings;
DROP POLICY IF EXISTS "Admins read SMTP settings" ON public.smtp_settings;
CREATE POLICY "Admins read SMTP settings" ON public.smtp_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Security scans readable" ON public.security_scans;
DROP POLICY IF EXISTS "Security remediations readable" ON public.security_remediations;
DROP POLICY IF EXISTS "Security settings readable" ON public.security_settings;
DROP POLICY IF EXISTS "Authenticated users can view presets" ON public.permission_presets;
DROP POLICY IF EXISTS "Staff can view presets" ON public.permission_presets;
CREATE POLICY "Staff can view presets" ON public.permission_presets FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "seo_bot_settings readable" ON public.seo_bot_settings;
CREATE POLICY "seo_bot_settings readable" ON public.seo_bot_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- Storage: writes require staff (or the owner's own folder)
DO $$
DECLARE r record; expr text; owner_expr text := '(storage.foldername(name))[1] = auth.uid()::text';
  staff_names text[] := ARRAY['Anyone can upload about images','Authenticated users can update about images','Anyone can delete about images','Authenticated users can upload about images','Anyone can update about images','Authenticated users can upload solution designs','Authenticated users can delete solution designs','Authenticated users can update solution designs','Authenticated users can delete documents','Authenticated users can upload documents','Authenticated users can update documents','Documents are publicly accessible','Solution designs are publicly accessible'];
  owner_names text[] := ARRAY['Anyone can upload an avatar.','Anyone can update an avatar.','Anyone can delete an avatar.','Authenticated users can upload lead attachments'];
  mixed_names text[] := ARRAY['Authenticated users can read lead attachments'];
BEGIN
  FOR r IN SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
           AND policyname = ANY(staff_names || owner_names || mixed_names) LOOP
    expr := coalesce(r.qual, r.with_check, 'true');
    IF r.policyname = ANY(staff_names) THEN expr := format('(%s) AND public.is_staff(auth.uid())', expr);
    ELSIF r.policyname = ANY(owner_names) THEN expr := format('(%s) AND %s', expr, owner_expr);
    ELSE expr := format('(%s) AND (public.is_staff(auth.uid()) OR %s)', expr, owner_expr);
    END IF;
    EXECUTE format('DROP POLICY %I ON storage.objects', r.policyname);
    IF r.cmd = 'INSERT' THEN
      EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated WITH CHECK (%s)', r.policyname, expr);
    ELSIF r.cmd = 'UPDATE' THEN
      EXECUTE format('CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', r.policyname, expr, expr);
    ELSE
      EXECUTE format('CREATE POLICY %I ON storage.objects FOR %s TO authenticated USING (%s)', r.policyname, r.cmd, expr);
    END IF;
  END LOOP;
END $$;

-- Learner self-lookup: requires matching email AND phone
CREATE OR REPLACE FUNCTION public.lookup_learner_trainings(_email text, _phone text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'status', r.status, 'created_at', r.created_at, 'approved_at', r.approved_at,
    'completed_at', r.completed_at, 'certificate_no', r.certificate_no, 'admin_note', r.admin_note,
    'training', jsonb_build_object('title_en', t.title_en, 'title_ar', t.title_ar, 'trainer', t.trainer,
      'location', t.location, 'start_date', t.start_date, 'end_date', t.end_date, 'kind', t.kind)
  ) ORDER BY r.created_at DESC), '[]'::jsonb)
  FROM public.training_registrations r LEFT JOIN public.trainings t ON t.id = r.training_id
  WHERE length(coalesce(_email,'')) >= 5 AND length(regexp_replace(coalesce(_phone,''), '\D', '', 'g')) >= 6
    AND lower(r.email) = lower(trim(_email))
    AND right(regexp_replace(r.phone, '\D', '', 'g'), 8) = right(regexp_replace(_phone, '\D', '', 'g'), 8)
$$;
GRANT EXECUTE ON FUNCTION public.lookup_learner_trainings(text, text) TO anon, authenticated;
