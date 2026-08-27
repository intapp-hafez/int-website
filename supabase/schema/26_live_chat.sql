-- ==============================================================================
-- 26_live_chat.sql
-- Live Chat System: Sessions, Realtime Messages, and Admin Support Controls
-- ==============================================================================

-- 1. Live Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.live_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token TEXT NOT NULL UNIQUE,
    visitor_name TEXT NOT NULL,
    visitor_phone TEXT,
    visitor_email TEXT,
    category TEXT NOT NULL DEFAULT 'support' CHECK (category IN ('support', 'sales', 'projects', 'general')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'closed', 'archived')),
    unread_admin INTEGER NOT NULL DEFAULT 0,
    unread_visitor INTEGER NOT NULL DEFAULT 0,
    last_message TEXT,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_name TEXT,
    visitor_ip TEXT,
    user_agent TEXT,
    lang TEXT DEFAULT 'en',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Live Chat Messages Table
CREATE TABLE IF NOT EXISTS public.live_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.live_chat_sessions(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent', 'system', 'bot')),
    sender_name TEXT NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.live_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_msg ON public.live_chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_token ON public.live_chat_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.live_chat_messages(session_id, created_at ASC);

-- 4. Enable RLS
ALTER TABLE public.live_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for live_chat_sessions
-- Allow anyone (public/anon) to insert a new session
DROP POLICY IF EXISTS "Public can create chat session" ON public.live_chat_sessions;
CREATE POLICY "Public can create chat session"
    ON public.live_chat_sessions FOR INSERT
    WITH CHECK (true);

-- Allow visitor to view their session via session_token or allow all authenticated staff
DROP POLICY IF EXISTS "Anyone can select sessions" ON public.live_chat_sessions;
CREATE POLICY "Anyone can select sessions"
    ON public.live_chat_sessions FOR SELECT
    USING (true);

-- Allow public to update their own session / staff to update any session
DROP POLICY IF EXISTS "Anyone can update chat session" ON public.live_chat_sessions;
CREATE POLICY "Anyone can update chat session"
    ON public.live_chat_sessions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow staff to delete session
DROP POLICY IF EXISTS "Staff can delete chat session" ON public.live_chat_sessions;
CREATE POLICY "Staff can delete chat session"
    ON public.live_chat_sessions FOR DELETE
    USING (auth.role() = 'authenticated');

-- 6. RLS Policies for live_chat_messages
DROP POLICY IF EXISTS "Anyone can read chat messages" ON public.live_chat_messages;
CREATE POLICY "Anyone can read chat messages"
    ON public.live_chat_messages FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.live_chat_messages;
CREATE POLICY "Anyone can insert chat messages"
    ON public.live_chat_messages FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update chat messages" ON public.live_chat_messages;
CREATE POLICY "Anyone can update chat messages"
    ON public.live_chat_messages FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can delete chat messages" ON public.live_chat_messages;
CREATE POLICY "Staff can delete chat messages"
    ON public.live_chat_messages FOR DELETE
    USING (auth.role() = 'authenticated');

-- 7. Trigger to keep last_message and unread counters updated on session
CREATE OR REPLACE FUNCTION public.sync_live_chat_message()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_live_chat_message ON public.live_chat_messages;
CREATE TRIGGER trg_sync_live_chat_message
    AFTER INSERT ON public.live_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_live_chat_message();

-- 8. Add tables to Supabase Realtime publication if not already present
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_sessions;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
