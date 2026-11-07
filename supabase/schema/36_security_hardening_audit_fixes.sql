-- =================================================================
-- Migration 36: Live Chat & Resume Storage Security Hardening
-- Resolves Findings SEC-01 and SEC-02 from SECURITY_AUDIT.md
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql/new
-- =================================================================

-- 1. FIX SEC-01: Drop dangerous public SELECT on chat messages
DROP POLICY IF EXISTS "Anyone can read chat messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Staff can read chat messages" ON public.live_chat_messages;

CREATE POLICY "Staff can read chat messages"
    ON public.live_chat_messages FOR SELECT
    TO authenticated
    USING (public.is_staff(auth.uid()));

-- Provide a secure RPC for visitors to access only their active session messages
CREATE OR REPLACE FUNCTION public.get_visitor_chat_messages(
    p_session_id UUID,
    p_session_token TEXT
)
RETURNS SETOF public.live_chat_messages
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT m.*
    FROM public.live_chat_messages m
    JOIN public.live_chat_sessions s ON s.id = m.session_id
    WHERE s.id = p_session_id
      AND s.session_token = p_session_token
    ORDER BY m.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_visitor_chat_messages(UUID, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.get_visitor_chat_messages(UUID, TEXT) TO anon, authenticated;

-- 2. FIX SEC-02: Restrict resume file upload extensions in storage
DROP POLICY IF EXISTS "Anyone can upload a resume" ON storage.objects;

CREATE POLICY "Anyone can upload a resume"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'career-resumes'
    AND lower(storage.extension(name)) IN ('pdf', 'doc', 'docx')
);

-- Ensure only staff can read resume objects
DROP POLICY IF EXISTS "Staff can read resumes" ON storage.objects;
CREATE POLICY "Staff can read resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'career-resumes'
    AND public.is_staff(auth.uid())
);

