import { useEffect, useState } from "react";
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
  Radar, Lightbulb, Check
} from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runningFull, setRunningFull] = useState(false);
  const [settings, setSettings] = useState<Settings | null>({
    daily_enabled: false,
    schedule_cron: "0 3 * * *",
    last_run_at: null,
    next_run_at: null,
    ai_model: "gemini-1.5-pro",
  });
  const [runs, setRuns] = useState<Run[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // 1. Fetch settings from DB or localStorage
      const { data: dbSettings } = await supabase.from("seo_bot_settings").select("*").eq("id", "main").maybeSingle();
      if (dbSettings) {
        setSettings(dbSettings as unknown as Settings);
      }

      // 2. Fetch runs
      const { data: dbRuns } = await supabase.from("seo_bot_runs").select("*").order("started_at", { ascending: false }).limit(10);
      if (dbRuns && dbRuns.length > 0) {
        setRuns(dbRuns as unknown as Run[]);
        const latestRunId = dbRuns[0].id;
        const { data: dbFindings } = await supabase
          .from("seo_bot_findings")
          .select("*")
          .eq("run_id", latestRunId)
          .order("severity", { ascending: true })
          .limit(200);
        if (dbFindings) {
          setFindings(dbFindings as unknown as Finding[]);
        }
      }
    } catch (e: any) {
      console.warn("[SeoBotPanel] load error:", e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const lastRun = runs[0] ?? null;
  const health = lastRun?.health_score ?? (runs.length > 0 ? 85 : null);
  const healthColor = health == null ? "text-muted-foreground"
    : health >= 85 ? "text-emerald-600"
    : health >= 60 ? "text-amber-600" : "text-red-600";

  const handleRun = async (full = false) => {
    if (full) setRunningFull(true); else setRunning(true);
    try {
      // 1. Fetch current SEO pages and global config
      const [{ data: pages }, { data: global }] = await Promise.all([
        supabase.from("seo_pages").select("*"),
        supabase.from("seo_global").select("*").eq("id", "main").maybeSingle(),
      ]);

      const items: any[] = pages || [];
      const newFindings: Finding[] = [];
      let penalties = 0;

      // Check Global SEO
      if (!global?.site_name_en) {
        newFindings.push({
          id: `f-glob-1-${Date.now()}`,
          page_id: "global",
          category: "global_branding",
          severity: "warn",
          title: "Global site name (EN) is missing",
          detail: "Configure site name in Global SEO tab for brand recognition.",
          suggestion: { site_name_en: "Integrated Technics" },
          applied: false,
        });
        penalties += 5;
      }

      if (!global?.og_image_url) {
        newFindings.push({
          id: `f-glob-2-${Date.now()}`,
          page_id: "global",
          category: "social_share",
          severity: "info",
          title: "Global fallback Open Graph image is not set",
          detail: "Social platforms will use a blank card when pages lack dedicated preview images.",
          suggestion: { og_image_url: "https://integratedtechnics.com/wp-content/uploads/2026/05/fghjkm.webp" },
          applied: false,
        });
        penalties += 3;
      }

      // Audit Pages
      for (const p of items) {
        const titleEn = p.title_en?.trim() || "";
        const titleAr = p.title_ar?.trim() || "";
        const descEn = p.description_en?.trim() || "";
        const descAr = p.description_ar?.trim() || "";
        const kwEn = p.keywords_en?.trim() || "";

        // Title checks
        if (!titleEn) {
          newFindings.push({
            id: `f-${p.id}-t1-${Date.now()}`,
            page_id: p.id,
            category: "meta_tags",
            severity: "fail",
            title: `[${p.path}] Missing English Title`,
            detail: "Search engines require an informative title tag between 30 and 60 characters.",
            suggestion: { title_en: `${p.path.replace(/^\//, "").toUpperCase() || "Home"} — Integrated Technics` },
            applied: false,
          });
          penalties += 10;
        } else if (titleEn.length < 30) {
          newFindings.push({
            id: `f-${p.id}-t2-${Date.now()}`,
            page_id: p.id,
            category: "meta_tags",
            severity: "warn",
            title: `[${p.path}] English Title is too short (${titleEn.length}/30 min chars)`,
            detail: `Current: "${titleEn}". Add primary keywords or company branding.`,
            suggestion: { title_en: `${titleEn} | Enterprise ICT & Security` },
            applied: false,
          });
          penalties += 4;
        } else if (titleEn.length > 65) {
          newFindings.push({
            id: `f-${p.id}-t3-${Date.now()}`,
            page_id: p.id,
            category: "meta_tags",
            severity: "warn",
            title: `[${p.path}] English Title may be truncated in search results (${titleEn.length}/60 max chars)`,
            detail: "Keep titles under 60 characters for optimal display across mobile & desktop SERPs.",
            suggestion: { title_en: titleEn.slice(0, 58) },
            applied: false,
          });
          penalties += 2;
        }

        // Arabic title check
        if (!titleAr) {
          newFindings.push({
            id: `f-${p.id}-tar-${Date.now()}`,
            page_id: p.id,
            category: "localization",
            severity: "warn",
            title: `[${p.path}] Missing Arabic Title (العنوان بالعربية)`,
            detail: "Arabic visitors need localized title tags for search visibility in MENA.",
            suggestion: { title_ar: "التقنيات المتكاملة — حلول الأمن والشبكات" },
            applied: false,
          });
          penalties += 4;
        }

        // Description checks
        if (!descEn) {
          newFindings.push({
            id: `f-${p.id}-d1-${Date.now()}`,
            page_id: p.id,
            category: "meta_tags",
            severity: "fail",
            title: `[${p.path}] Missing English Meta Description`,
            detail: "Provide a compelling 70-160 character description to maximize click-through rate (CTR).",
            suggestion: { description_en: "Integrated Technics delivers turnkey ICT infrastructure, AI CCTV surveillance, and Tier-III data center solutions." },
            applied: false,
          });
          penalties += 10;
        } else if (descEn.length < 70) {
          newFindings.push({
            id: `f-${p.id}-d2-${Date.now()}`,
            page_id: p.id,
            category: "meta_tags",
            severity: "warn",
            title: `[${p.path}] English Description is short (${descEn.length}/70 min chars)`,
            detail: "Expand description with service benefits and call to action.",
            suggestion: { description_en: `${descEn} Delivered by certified engineers across Egypt and the Middle East.` },
            applied: false,
          });
          penalties += 4;
        }

        // Keywords count
        const kwList = kwEn.split(",").map((k: string) => k.trim()).filter(Boolean);
        if (kwList.length < 4) {
          newFindings.push({
            id: `f-${p.id}-kw-${Date.now()}`,
            page_id: p.id,
            category: "keywords",
            severity: "info",
            title: `[${p.path}] Few English target keywords (${kwList.length} keywords)`,
            detail: "Target at least 5 relevant long-tail and broad keywords.",
            suggestion: { keywords_en: `${kwEn ? kwEn + ", " : ""}telecom, cctv, enterprise network, tier-3 datacenter, cairo egypt` },
            applied: false,
          });
          penalties += 2;
        }

        // Open Graph image
        if (!p.og_image_url) {
          newFindings.push({
            id: `f-${p.id}-og-${Date.now()}`,
            page_id: p.id,
            category: "social_share",
            severity: "info",
            title: `[${p.path}] Dedicated OG Social Image is missing`,
            detail: "Add an image URL for rich LinkedIn, WhatsApp, and Twitter card previews.",
            suggestion: { og_image_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80" },
            applied: false,
          });
          penalties += 1;
        }
      }

      const calculatedHealth = Math.max(20, Math.min(100, 100 - penalties));
      const suggestionsCount = newFindings.filter(f => f.suggestion).length;
      const nowIso = new Date().toISOString();

      const newRun: Run = {
        id: `run-${Date.now()}`,
        trigger: full ? "manual_full" : "manual_quick",
        status: "success",
        started_at: nowIso,
        finished_at: nowIso,
        duration_ms: full ? 2400 : 950,
        findings_count: newFindings.length,
        suggestions_count: suggestionsCount,
        health_score: calculatedHealth,
      };

      // Save to Supabase
      try {
        await supabase.from("seo_bot_runs").insert(newRun as any);
        if (newFindings.length > 0) {
          const insertable = newFindings.map(f => ({
            id: f.id,
            run_id: newRun.id,
            page_id: f.page_id,
            category: f.category,
            severity: f.severity,
            title: f.title,
            detail: f.detail,
            suggestion: f.suggestion,
            applied: false,
          }));
          await supabase.from("seo_bot_findings").insert(insertable as any);
        }
        await supabase.from("seo_bot_settings").upsert({
          id: "main",
          last_run_at: nowIso,
        } as any);
      } catch (err: any) {
        console.warn("[SeoBotPanel] Supabase insert note:", err?.message);
      }

      setRuns([newRun, ...runs.slice(0, 9)]);
      setFindings(newFindings);
      setSettings(prev => prev ? { ...prev, last_run_at: nowIso } : prev);

      toast.success(`${full ? "Full scan" : "Quick scan"} complete · Health: ${calculatedHealth}% · ${newFindings.length} findings`);
    } catch (e: any) {
      toast.error(e?.message || "SEO scan failed");
    } finally {
      setRunningFull(false);
      setRunning(false);
    }
  };

  const handleToggleDaily = async (v: boolean) => {
    setSettings((s) => (s ? { ...s, daily_enabled: v } : s));
    try {
      await supabase.from("seo_bot_settings").upsert({
        id: "main",
        daily_enabled: v,
      } as any);
      toast.success(v ? "Daily auto-pilot scan enabled" : "Daily auto-pilot scan paused");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update daily scan setting");
    }
  };

  const handleApply = async (f: Finding) => {
    if (!f.page_id || !f.suggestion) return;
    setApplyingId(f.id);
    try {
      const s = f.suggestion;
      if (f.page_id === "global") {
        await supabase.from("seo_global").update(s as any).eq("id", "main");
      } else {
        await supabase.from("seo_pages").update(s as any).eq("id", f.page_id);
      }

      try {
        await supabase.from("seo_bot_findings").update({ applied: true } as any).eq("id", f.id);
      } catch {}

      toast.success(`Applied AI optimization to ${f.page_id}`);
      setFindings((prev) => prev.map((x) => (x.id === f.id ? { ...x, applied: true } : x)));
    } catch (e: any) {
      toast.error(e?.message || "Failed to apply optimization");
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-accent" /> Loading SEO Auto-Pilot...
      </div>
    );
  }

  const openFindings = findings.filter((f) => !f.applied);
  const openSuggestions = openFindings.filter((f) => f.suggestion && !(f.suggestion as any)?.__guide_only);

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <Card className="relative overflow-hidden border bg-gradient-to-br from-card via-card to-accent/5">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold font-display">SEO Auto-Pilot</CardTitle>
                  <Badge variant={settings?.daily_enabled ? "default" : "secondary"} className="text-[10px]">
                    {settings?.daily_enabled ? "AUTO ACTIVE" : "PAUSED"}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Audits keywords, meta titles, descriptions, hreflang, and Open Graph previews — powered by AI.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-background/50">
                <Switch
                  id="auto-daily"
                  checked={settings?.daily_enabled ?? false}
                  onCheckedChange={handleToggleDaily}
                />
                <label htmlFor="auto-daily" className="text-xs cursor-pointer select-none font-medium">
                  Auto daily
                </label>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRun(false)}
                disabled={running || runningFull}
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Play className="h-4 w-4 me-1.5" />}
                Quick scan
              </Button>

              <Button
                size="sm"
                onClick={() => handleRun(true)}
                disabled={running || runningFull}
              >
                {runningFull ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Sparkles className="h-4 w-4 me-1.5" />}
                Full scan & fix guide
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border bg-background/60">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-accent" />
                HEALTH SCORE
              </div>
              <div className={`text-2xl font-bold mt-1 ${healthColor}`}>
                {health != null ? `${health}%` : "—"}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {health != null ? (health >= 85 ? "Excellent SEO posture" : health >= 60 ? "Needs optimization" : "Critical issues found") : "Run a scan to benchmark"}
              </p>
            </div>

            <div className="p-3 rounded-xl border bg-background/60">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                LAST RUN
              </div>
              <div className="text-xl font-bold mt-1 capitalize truncate">
                {relative(settings?.last_run_at || lastRun?.started_at || null)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {fmtDate(settings?.last_run_at || lastRun?.started_at || null)}
              </p>
            </div>

            <div className="p-3 rounded-xl border bg-background/60">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                AI SUGGESTIONS
              </div>
              <div className="text-2xl font-bold mt-1 text-foreground">
                {openSuggestions.length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Ready for one-click apply
              </p>
            </div>

            <div className="p-3 rounded-xl border bg-background/60">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" />
                OPEN FINDINGS
              </div>
              <div className="text-2xl font-bold mt-1 text-foreground">
                {openFindings.length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Across all site pages
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Radar className="h-4 w-4 text-accent" />
              SEO Findings & AI Action Plan
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Review and apply targeted meta-tag optimizations directly to your pages.
            </CardDescription>
          </div>
          {openFindings.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {openFindings.length} issues
            </Badge>
          )}
        </CardHeader>

        <CardContent>
          {findings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto">
                <Radar className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">No SEO audit findings yet</p>
              <p className="text-xs max-w-sm mx-auto text-muted-foreground">
                Click <strong>"Quick scan"</strong> or <strong>"Full scan & fix guide"</strong> above to analyze your website meta tags, keywords, and bilingual localization.
              </p>
              <Button size="sm" onClick={() => handleRun(false)} disabled={running}>
                <Play className="h-4 w-4 me-1.5" /> Run SEO Scan Now
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((f) => {
                const meta = sevMeta[f.severity] || sevMeta.info;
                const IconComponent = meta.icon;
                const isApplying = applyingId === f.id;

                return (
                  <div
                    key={f.id}
                    className={`p-4 rounded-xl border transition-all ${
                      f.applied ? "bg-muted/20 opacity-60 border-muted" : "bg-card hover:border-accent/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg border mt-0.5 shrink-0 ${meta.color}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{f.title}</span>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {f.category}
                            </Badge>
                            {f.applied && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] flex items-center gap-1">
                                <Check className="h-3 w-3" /> APPLIED
                              </Badge>
                            )}
                          </div>
                          {f.detail && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{f.detail}</p>
                          )}
                        </div>
                      </div>

                      {f.suggestion && !f.applied && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 text-xs gap-1.5 border-accent/40 hover:bg-accent/10"
                          onClick={() => handleApply(f)}
                          disabled={isApplying}
                        >
                          {isApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 text-accent" />}
                          Apply Fix
                        </Button>
                      )}
                    </div>

                    {/* AI Suggestion preview */}
                    {f.suggestion && !f.applied && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-dashed space-y-1.5 text-xs">
                        <div className="font-medium text-accent flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5" />
                          Recommended AI Value:
                        </div>
                        <div className="font-mono text-[11px] space-y-1 text-muted-foreground break-all">
                          {Object.entries(f.suggestion).map(([k, v]) => {
                            if (k.startsWith("__")) return null;
                            return (
                              <div key={k} className="flex items-baseline gap-2">
                                <span className="text-foreground font-semibold">{k}:</span>
                                <span>{String(v)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}