import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

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

export const getSeoBotState = createServerFn({ method: "GET" }).handler(async () => {
  const [settings, runs, lastRun] = await Promise.all([
    supabase.from("seo_bot_settings").select("*").eq("id", "main").maybeSingle(),
    supabase.from("seo_bot_runs").select("*").order("started_at", { ascending: false }).limit(10),
    supabase.from("seo_bot_runs").select("id").order("started_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  let findings: FindingRow[] = [];
  if (lastRun.data?.id) {
    const { data } = await supabase
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

export const updateSeoBotSettings = createServerFn({ method: "POST" })
  .inputValidator((d: { daily_enabled?: boolean; schedule_cron?: string }) => d)
  .handler(async ({ data }) => {
    const patch = {
      ...(typeof data.daily_enabled === "boolean" ? { daily_enabled: data.daily_enabled } : {}),
      ...(typeof data.schedule_cron === "string" ? { schedule_cron: data.schedule_cron } : {}),
    };
    const { error } = await supabase.from("seo_bot_settings").update(patch as never).eq("id", "main");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const applyFindingSuggestion = createServerFn({ method: "POST" })
  .inputValidator((d: { finding_id: string }) => d)
  .handler(async ({ data }) => {
    const { data: f, error } = await supabase
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
    const { error: uErr } = await supabase.from("seo_pages").update(patch as never).eq("id", f.page_id);
    if (uErr) throw new Error(uErr.message);
    await supabase.from("seo_bot_findings").update({ applied: true }).eq("id", f.id);
    return { ok: true };
  });