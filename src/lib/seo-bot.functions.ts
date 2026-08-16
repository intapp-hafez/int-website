import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type FindingRow = {
  id: string;
  run_id: string;
  page_id: string | null;
  category: string;
  severity: string;
  title: string;
  detail: string | null;
  suggestion: Record<string, string> | null;
  applied: boolean;
  created_at: string;
};

const attachSupabaseBearer = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next(token ? { headers: { Authorization: `Bearer ${token}` } } : {});
});

async function isAdmin(supabaseAdmin: any, userId?: string) {
  if (!userId) return false;
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

async function ensureAdmin(supabaseAdmin: any, userId?: string) {
  if (!userId || !(await isAdmin(supabaseAdmin, userId))) throw new Error("Forbidden");
}

export const getSeoBotState = createServerFn({ method: "GET" })
  .middleware([attachSupabaseBearer, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = (context as any)?.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!userId || !(await isAdmin(supabaseAdmin, userId))) {
      return { settings: null, runs: [], findings: [] };
    }
    const [settings, runs, lastRun] = await Promise.all([
      supabaseAdmin.from("seo_bot_settings").select("*").eq("id", "main").maybeSingle(),
      supabaseAdmin.from("seo_bot_runs").select("*").order("started_at", { ascending: false }).limit(10),
      supabaseAdmin.from("seo_bot_runs").select("id").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    let findings: FindingRow[] = [];
    if (lastRun.data?.id) {
      const { data } = await supabaseAdmin
        .from("seo_bot_findings")
        .select("*")
        .eq("run_id", lastRun.data.id)
        .order("severity", { ascending: true })
        .limit(200);
      findings = (data ?? []) as unknown as FindingRow[];
    }
    return {
      settings: settings.data,
      runs: runs.data ?? [],
      findings,
    };
  });

export const runSeoBotNow = createServerFn({ method: "POST" })
  .middleware([attachSupabaseBearer, requireSupabaseAuth])
  .inputValidator((d?: { full?: boolean }) => d ?? {})
  .handler(async ({ context, data }) => {
    const userId = (context as any)?.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await ensureAdmin(supabaseAdmin, userId);
    const { runSeoBot } = await import("./seo-bot.server");
    return await runSeoBot("manual", { full: !!data?.full });
  });

export const updateSeoBotSettings = createServerFn({ method: "POST" })
  .middleware([attachSupabaseBearer, requireSupabaseAuth])
  .inputValidator((d: { daily_enabled?: boolean; schedule_cron?: string }) => d)
  .handler(async ({ context, data }) => {
    const userId = (context as any)?.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await ensureAdmin(supabaseAdmin, userId);
    const patch = {
      ...(typeof data.daily_enabled === "boolean" ? { daily_enabled: data.daily_enabled } : {}),
      ...(typeof data.schedule_cron === "string" ? { schedule_cron: data.schedule_cron } : {}),
    };
    const { error } = await supabaseAdmin.from("seo_bot_settings").update(patch as never).eq("id", "main");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const applyFindingSuggestion = createServerFn({ method: "POST" })
  .middleware([attachSupabaseBearer, requireSupabaseAuth])
  .inputValidator((d: { finding_id: string }) => d)
  .handler(async ({ context, data }) => {
    const userId = (context as any)?.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await ensureAdmin(supabaseAdmin, userId);
    const { data: f, error } = await supabaseAdmin
      .from("seo_bot_findings").select("*").eq("id", data.finding_id).maybeSingle();
    if (error || !f) throw new Error(error?.message || "Finding not found");
    if (!f.page_id || !f.suggestion) throw new Error("Nothing to apply");
    const s = (f.suggestion ?? {}) as Record<string, string>;
    const patch = {
      ...(s.keywords_en ? { keywords_en: s.keywords_en } : {}),
      ...(s.keywords_ar ? { keywords_ar: s.keywords_ar } : {}),
      ...(s.title_en ? { title_en: s.title_en } : {}),
      ...(s.title_ar ? { title_ar: s.title_ar } : {}),
      ...(s.description_en ? { description_en: s.description_en } : {}),
      ...(s.description_ar ? { description_ar: s.description_ar } : {}),
    };
    const { error: uErr } = await supabaseAdmin.from("seo_pages").update(patch as never).eq("id", f.page_id);
    if (uErr) throw new Error(uErr.message);
    await supabaseAdmin.from("seo_bot_findings").update({ applied: true }).eq("id", f.id);
    return { ok: true };
  });