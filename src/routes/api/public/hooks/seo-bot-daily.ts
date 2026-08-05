import { createFileRoute } from "@tanstack/react-router";
import { runSeoBot } from "@/lib/seo-bot.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/hooks/seo-bot-daily")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { data: s } = await supabaseAdmin
            .from("seo_bot_settings").select("daily_enabled").eq("id", "main").maybeSingle();
          if (!s?.daily_enabled) {
            return new Response(JSON.stringify({ skipped: true, reason: "daily_enabled is false" }), {
              status: 200, headers: { "content-type": "application/json" },
            });
          }
          const result = await runSeoBot("cron");
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200, headers: { "content-type": "application/json" },
          });
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
            status: 500, headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});