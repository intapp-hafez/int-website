-- =================================================================
-- Migration 31: Security hardening follow-up (run in the Supabase SQL editor)
-- Fixes the findings not covered by 30_security_hardening.sql:
--   - live_chat_sessions: anyone can update any session
--   - product_categories: any signed-in user can insert/update categories
--   - live_chat_messages: unbounded anonymous inserts
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

-- 2. Live chat sessions: only staff may change sessions.
DROP POLICY IF EXISTS "Anyone can update chat session" ON public.live_chat_sessions;
DROP POLICY IF EXISTS "Staff can update chat session" ON public.live_chat_sessions;
CREATE POLICY "Staff can update chat session"
    ON public.live_chat_sessions FOR UPDATE
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- 3. Live chat messages: visitors may post as 'visitor'/'system' with a
--    length cap; anything else requires staff.
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

-- 4. Product categories: only staff may create or change categories.
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
