-- =================================================================
-- Migration 32: Re-open visitor live chat + public training sign-ups
-- Run in the Supabase SQL editor (after 30/31 if you ran them).
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql/new
-- =================================================================

-- 1. The message->session sync trigger must run as its owner so the
--    sessions UPDATE policy can be locked to staff without breaking
--    the visitor chat widget.
CREATE OR REPLACE FUNCTION public.sync_live_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.live_chat_sessions
        SET
            last_message = NEW.message,
            last_message_at = NEW.created_at,
            updated_at = now(),
            unread_admin = CASE
                WHEN NEW.sender_type = 'visitor' THEN unread_admin + 1
                ELSE unread_admin
            END,
            unread_visitor = CASE
                WHEN NEW.sender_type = 'agent' THEN unread_visitor + 1
                ELSE unread_visitor
            END
        WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$;

-- 2. Live chat: visitors may create sessions and post messages; only
--    staff may change sessions.
GRANT SELECT, INSERT ON public.live_chat_sessions TO anon;
GRANT SELECT, INSERT ON public.live_chat_messages TO anon;

DROP POLICY IF EXISTS "Public can create chat session" ON public.live_chat_sessions;
CREATE POLICY "Public can create chat session"
    ON public.live_chat_sessions FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update chat session" ON public.live_chat_sessions;
DROP POLICY IF EXISTS "Staff can update chat session" ON public.live_chat_sessions;
CREATE POLICY "Staff can update chat session"
    ON public.live_chat_sessions FOR UPDATE
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Visitors can insert chat messages" ON public.live_chat_messages;
CREATE POLICY "Visitors can insert chat messages"
    ON public.live_chat_messages FOR INSERT
    WITH CHECK (
        length(message) <= 4000
        AND (
            sender_type IN ('visitor', 'system')
            OR public.is_staff(auth.uid())
        )
    );

-- 3. Product categories: only staff may create or change categories.
DROP POLICY IF EXISTS "Categories insertable by authenticated" ON public.product_categories;
DROP POLICY IF EXISTS "Categories updatable by authenticated" ON public.product_categories;
DROP POLICY IF EXISTS "Categories insertable by staff" ON public.product_categories;
DROP POLICY IF EXISTS "Categories updatable by staff" ON public.product_categories;
CREATE POLICY "Categories insertable by staff"
    ON public.product_categories FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Categories updatable by staff"
    ON public.product_categories FOR UPDATE
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- 4. Public learners can submit a pending registration for an active training.
GRANT INSERT ON public.training_registrations TO anon;
DROP POLICY IF EXISTS "Anyone can register for an active training" ON public.training_registrations;
CREATE POLICY "Anyone can register for an active training"
    ON public.training_registrations FOR INSERT
    WITH CHECK (
        status = 'pending'
        AND EXISTS (SELECT 1 FROM public.trainings t WHERE t.id = training_id AND t.active = true)
    );
