import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Bot, Loader2, Play, Sparkles, Activity, ShieldAlert,
  CheckCircle2, AlertTriangle, Info, Clock, History, Wand2, ListChecks,
  Radar, Lightbulb
} from "lucide-react";
import {
  getSeoBotState, runSeoBotNow, updateSeoBotSettings, applyFindingSuggestion,
} from "@/lib/seo-bot.functions";

type Finding = {
  id: string;
  page_id: string | null;
  category: string;
  severity: "info" | "warn" | "fail" | string;
  title: string;
  detail: string | null;
  suggestion: Record<string, string> | null;
  applied: boolean;
};

type Run = {
  id: string;
  trigger: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  findings_count: number;
  suggestions_count: number;
  health_score: number | null;
};

type Settings = {
  daily_enabled: boolean;
  schedule_cron: string;
  last_run_at: string | null;
  next_run_at: string | null;
  ai_model: string;
};

const sevMeta = {
  fail: { color: "text-red-600 bg-red-500/10 border-red-500/30", icon: ShieldAlert, label: "Critical" },
  warn: { color: "text-amber-600 bg-amber-500/10 border-amber-500/30", icon: AlertTriangle, label: "Warning" },
  info: { color: "text-sky-600 bg-sky-500/10 border-sky-500/30", icon: Info, label: "Info" },
} as Record<string, { color: string; icon: typeof Info; label: string }>;

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function relative(iso: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function SeoBotPanel() {
  const fetchState = useServerFn(getSeoBotState);
  const runNow = useServerFn(runSeoBotNow);
  const updateSettings = useServerFn(updateSeoBotSettings);
  const applySuggestion = useServerFn(applyFindingSuggestion);

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runningFull, setRunningFull] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [backendAuthMissing, setBackendAuthMissing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        setBackendAuthMissing(true);
        setSettings(null);
        setRuns([]);
        setFindings([]);
        return;
      }
      setBackendAuthMissing(false);
      const r = await fetchState();
      setSettings((r?.settings ?? null) as Settings | null);
      setRuns((r?.runs ?? []) as unknown as Run[]);
      setFindings((r?.findings ?? []) as unknown as Finding[]);
    } catch (e) {
      setSettings(null);
      setRuns([]);
      setFindings([]);
      let msg = "Failed to load SEO bot";
      if (e instanceof Response) {
        msg = `SEO bot unavailable (${e.status})`;
      } else if (e instanceof Error && e.message) {
        msg = e.message;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const lastRun = runs[0] ?? null;
  const health = lastRun?.health_score ?? null;
  const healthColor = health == null ? "text-muted-foreground"
    : health >= 85 ? "text-emerald-600"
    : health >= 60 ? "text-amber-600" : "text-red-600";

  const handleRun = async (full = false) => {
    if (full) setRunningFull(true); else setRunning(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        setBackendAuthMissing(true);
        toast.error("Sign in with a backend account to run SEO scans");
        return;
      }
      const res = await runNow({ data: { full } });
      toast.success(`${full ? "Full scan" : "Scan"} complete · health ${res.health_score}% · ${res.findings_count} findings`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunningFull(false);
      setRunning(false);
    }
  };

  const handleToggleDaily = async (v: boolean) => {
    setSettings((s) => (s ? { ...s, daily_enabled: v } : s));
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        setBackendAuthMissing(true);
        toast.error("Sign in with a backend account to update SEO bot settings");
        return;
      }
      await updateSettings({ data: { daily_enabled: v } });
      toast.success(v ? "Daily auto-run enabled" : "Daily auto-run paused");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleApply = async (f: Finding) => {
    setApplyingId(f.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        setBackendAuthMissing(true);
        toast.error("Sign in with a backend account to apply SEO suggestions");
        return;
      }
      await applySuggestion({ data: { finding_id: f.id } });
      toast.success(`Applied to ${f.page_id}`);
      setFindings((prev) => prev.map((x) => (x.id === f.id ? { ...x, applied: true } : x)));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading SEO bot…
      </div>
    );
  }

  if (backendAuthMissing) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardContent className="p-5 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h2 className="font-semibold">SEO Auto-Pilot is unavailable</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in with a backend admin account to load scans, update settings, or apply suggestions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const suggestions = findings.filter((f) => f.category === "ai-suggestion" && !f.applied);
  const issues = findings.filter((f) => f.category !== "ai-suggestion");

  return (
    <div className="space-y-4">
      {/* Hero status */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background ${settings?.daily_enabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-semibold">SEO Auto-Pilot</h2>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                    {settings?.daily_enabled ? "Live" : "Paused"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Scans keywords, meta tags, hreflang, OG images & indexing daily — powered by AI.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <span className="text-xs text-muted-foreground">Auto daily</span>
                <Switch checked={!!settings?.daily_enabled} onCheckedChange={handleToggleDaily} />
              </div>
              <Button variant="outline" onClick={() => handleRun(false)} disabled={running || runningFull}>
                {running ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Play className="h-4 w-4 me-2" />}
                {running ? "Scanning…" : "Quick scan"}
              </Button>
              <Button onClick={() => handleRun(true)} disabled={running || runningFull}>
                {runningFull ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Radar className="h-4 w-4 me-2" />}
                {runningFull ? "Deep scanning…" : "Full scan & fix guide"}
              </Button>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric icon={Activity} label="Health score"
              value={health != null ? `${health}%` : "—"} valueClass={healthColor} />
            <Metric icon={Clock} label="Last run" value={relative(settings?.last_run_at ?? null)}
              hint={fmtDate(settings?.last_run_at ?? null)} />
            <Metric icon={Sparkles} label="AI suggestions"
              value={String(lastRun?.suggestions_count ?? 0)} />
            <Metric icon={ListChecks} label="Open findings"
              value={String(issues.filter((i) => !i.applied).length)} />
          </div>

          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Next automatic scan: <span className="font-medium text-foreground">{fmtDate(settings?.next_run_at ?? null)}</span>
            <span className="opacity-60">· schedule {settings?.schedule_cron} UTC</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* AI suggestions */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" /> AI keyword & meta suggestions
            </CardTitle>
            <CardDescription>One-click apply per page.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              <div className="p-4 space-y-3">
                {suggestions.length === 0 && (
                  <EmptyState icon={Sparkles} text="No pending suggestions. Run a scan to refresh." />
                )}
                {suggestions.map((f) => (
                  <div key={f.id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">{f.page_id}</Badge>
                        <span className="text-sm font-medium truncate">{f.title}</span>
                      </div>
                      <Button size="sm" variant="default" onClick={() => handleApply(f)}
                        disabled={applyingId === f.id}>
                        {applyingId === f.id ? <Loader2 className="h-3.5 w-3.5 me-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 me-1.5" />}
                        Apply
                      </Button>
                    </div>
                    {f.detail && <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>}
                    {f.suggestion?.rationale_ar && (
                      <p className="mt-0.5 text-xs text-muted-foreground" dir="rtl">{f.suggestion.rationale_ar}</p>
                    )}
                    {f.suggestion && (
                      <div className="mt-2 grid sm:grid-cols-2 gap-2 text-xs">
                        {f.suggestion.title_en && (
                          <KV label="Title (EN)" value={f.suggestion.title_en} />
                        )}
                        {f.suggestion.title_ar && (
                          <KV label="العنوان (AR)" value={f.suggestion.title_ar} dir="rtl" />
                        )}
                        {f.suggestion.description_en && (
                          <KV label="Description (EN)" value={f.suggestion.description_en} />
                        )}
                        {f.suggestion.description_ar && (
                          <KV label="الوصف (AR)" value={f.suggestion.description_ar} dir="rtl" />
                        )}
                        {f.suggestion.keywords_en && (
                          <KV label="Keywords (EN)" value={f.suggestion.keywords_en} />
                        )}
                        {f.suggestion.keywords_ar && (
                          <KV label="الكلمات المفتاحية (AR)" value={f.suggestion.keywords_ar} dir="rtl" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Findings + history */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" /> Issues detected
              </CardTitle>
              <CardDescription>From the most recent scan — each item includes a bilingual fix guide.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[420px]">
                <div className="p-4 space-y-2">
                  {issues.length === 0 && <EmptyState icon={CheckCircle2} text="No issues — all green." />}
                  {issues.map((f) => {
                    const meta = sevMeta[f.severity] ?? sevMeta.info;
                    const Icon = meta.icon;
                    return (
                      <div key={f.id} className={`rounded-md border p-2.5 ${meta.color}`}>
                        <div className="flex items-start gap-2">
                          <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{f.title}</span>
                              {f.page_id && <Badge variant="outline" className="font-mono text-[9px]">{f.page_id}</Badge>}
                              <Badge variant="outline" className="text-[9px]">{f.category}</Badge>
                            </div>
                            {f.detail && <p className="text-[11px] opacity-80 mt-0.5">{f.detail}</p>}
                            {f.suggestion?.title_ar && (
                              <p className="text-[11px] opacity-80 mt-0.5" dir="rtl">{f.suggestion.title_ar}</p>
                            )}
                            {(f.suggestion?.guide_en || f.suggestion?.guide_ar) && (
                              <div className="mt-1.5 rounded border border-current/20 bg-background/60 p-2 space-y-1">
                                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide opacity-70">
                                  <Lightbulb className="h-3 w-3" /> How to fix · طريقة الحل
                                </div>
                                {f.suggestion.guide_en && (
                                  <p className="text-[11px] text-foreground/80">{f.suggestion.guide_en}</p>
                                )}
                                {f.suggestion.guide_ar && (
                                  <p className="text-[11px] text-foreground/80" dir="rtl">{f.suggestion.guide_ar}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" /> Recent scans
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {runs.length === 0 && <div className="p-4"><EmptyState icon={History} text="No scans yet." /></div>}
                {runs.map((r) => (
                  <div key={r.id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-[9px] uppercase">{r.trigger}</Badge>
                      <span className="text-muted-foreground truncate">{fmtDate(r.started_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {r.health_score != null && (
                        <span className={r.health_score >= 85 ? "text-emerald-600" : r.health_score >= 60 ? "text-amber-600" : "text-red-600"}>
                          {r.health_score}%
                        </span>
                      )}
                      <span className="text-muted-foreground">{r.findings_count} findings</span>
                      <Badge variant={r.status === "completed" ? "default" : r.status === "failed" ? "destructive" : "secondary"} className="text-[9px]">
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, hint, valueClass }: {
  icon: typeof Info; label: string; value: string; hint?: string; valueClass?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`mt-1 text-xl font-semibold ${valueClass ?? ""}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{hint}</div>}
    </div>
  );
}

function KV({ label, value, dir }: { label: string; value: string; dir?: "rtl" }) {
  return (
    <div className="rounded border bg-muted/30 p-2">
      <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</div>
      <div className="text-xs mt-0.5 break-words" dir={dir}>{value}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Info; text: string }) {
  return (
    <div className="text-center text-xs text-muted-foreground py-8">
      <Icon className="h-6 w-6 mx-auto mb-2 opacity-50" />
      {text}
    </div>
  );
}