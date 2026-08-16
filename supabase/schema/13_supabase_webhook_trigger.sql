-- =================================================================
-- 13_supabase_webhook_trigger.sql
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdbzvoitzyvehyeqygmq/sql
-- =================================================================

-- 1. Enable pg_net extension (Supabase built-in asynchronous HTTP client)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Webhook Dispatcher Function
CREATE OR REPLACE FUNCTION public.fn_dispatch_notification_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings jsonb;
  v_webhook_enabled boolean;
  v_webhook_url text;
  v_payload jsonb;
  v_slack_text text;
BEGIN
  -- Read current notification settings from site_settings table
  SELECT value INTO v_settings
  FROM public.site_settings
  WHERE id = 'notification_settings'
  LIMIT 1;

  IF v_settings IS NOT NULL THEN
    v_webhook_enabled := COALESCE((v_settings->>'webhookEnabled')::boolean, false);
    v_webhook_url := TRIM(COALESCE(v_settings->>'webhookUrl', ''));

    -- Only dispatch if webhook is enabled and URL is configured
    IF v_webhook_enabled AND v_webhook_url <> '' AND v_webhook_url ILIKE 'http%' THEN
      
      -- Format human-readable text for Slack / Discord / Teams
      v_slack_text := '🔔 *[' || UPPER(NEW.type) || ']* ' || NEW.title || E'\n' || NEW.message;

      -- Standardized Webhook Payload
      v_payload := jsonb_build_object(
        'event', 'admin_notification.created',
        'timestamp', NEW.created_at,
        'notification', jsonb_build_object(
          'id', NEW.id,
          'type', NEW.type,
          'title', NEW.title,
          'message', NEW.message,
          'href', NEW.href,
          'read', NEW.read,
          'created_at', NEW.created_at
        ),
        'text', v_slack_text,
        'content', v_slack_text
      );

      -- Asynchronous HTTP POST via Supabase pg_net
      PERFORM extensions.http_post(
        v_webhook_url,
        v_payload::text,
        'application/json'
      );

    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block table inserts if external webhook endpoint fails
  RAISE WARNING 'Webhook dispatch exception: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Create Trigger on admin_notifications table
DROP TRIGGER IF EXISTS trg_admin_notifications_webhook ON public.admin_notifications;
CREATE TRIGGER trg_admin_notifications_webhook
AFTER INSERT ON public.admin_notifications
FOR EACH ROW
EXECUTE FUNCTION public.fn_dispatch_notification_webhook();
