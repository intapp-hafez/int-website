-- ==========================================================
-- Migration 17: Header Icons Setting (Cart & Quote Tracking)
-- ==========================================================
-- Ensures the `site_settings` table record `main` includes the
-- `headerIcons` configuration:
--   { "cart": true, "tracking": true }
-- ==========================================================

DO $$
BEGIN
  -- If record 'main' exists in public.site_settings, ensure headerIcons is initialized
  IF EXISTS (SELECT 1 FROM public.site_settings WHERE id = 'main') THEN
    UPDATE public.site_settings
    SET value = jsonb_set(
      CASE 
        WHEN value ? 'headerIcons' THEN value 
        ELSE jsonb_set(value, '{headerIcons}', '{"cart": true, "tracking": true}'::jsonb, true)
      END,
      '{headerIcons}',
      COALESCE(value->'headerIcons', '{"cart": true, "tracking": true}'::jsonb),
      true
    ),
    updated_at = now()
    WHERE id = 'main';
  ELSE
    -- If 'main' record does not exist yet, create it with baseline defaults
    INSERT INTO public.site_settings (id, value, updated_at)
    VALUES (
      'main',
      jsonb_build_object(
        'email', 'info@integratedtechnics.com',
        'phone', '+20 100 741 9344',
        'whatsapp', '+201007419344',
        'headerIcons', jsonb_build_object('cart', true, 'tracking', true),
        'visibility', jsonb_build_object(
          'home', true,
          'about', true,
          'services', true,
          'shop', true,
          'projects', true,
          'industries', true,
          'careers', true,
          'news', true,
          'partners', true,
          'contact', true
        )
      ),
      now()
    );
  END IF;
END $$;
