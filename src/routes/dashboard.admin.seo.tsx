import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Search, BarChart3, Globe2, ShieldCheck, Languages, CheckCircle2, XCircle, AlertCircle, Play, Bot, Package, Wrench, Plus, Trash2, RefreshCw, Download, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useCanAccess } from "@/lib/permissions-store";
import { toast } from "sonner";
import { SeoBotPanel } from "@/components/admin/seo-bot-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { services as staticServices } from "@/data/site";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/dashboard/admin/seo")({
  head: () => ({ meta: [{ title: "SEO — Admin" }] }),
  component: SeoAdminPage,
});

type Global = {
  id: string;
  site_name_en: string; site_name_ar: string;
  default_title_en: string; default_title_ar: string;
  default_description_en: string; default_description_ar: string;
  default_keywords_en: string; default_keywords_ar: string;
  og_image_url: string | null;
  gtm_id: string | null;
  ga4_id: string | null;
  fb_pixel_id: string | null;
  google_verification: string | null;
  bing_verification: string | null;
  semrush_verification: string | null;
  hreflang_enabled: boolean;
};

type Page = {
  id: string;
  path: string;
  title_en: string; title_ar: string;
  description_en: string; description_ar: string;
  keywords_en: string; keywords_ar: string;
  og_image_url: string | null;
  noindex: boolean;
  sort_order: number;
};

function SeoAdminPage() {
  
  const makeDefaultGlobal = (): Global => ({
    id: "main",
    site_name_en: "", site_name_ar: "",
    default_title_en: "", default_title_ar: "",
    default_description_en: "", default_description_ar: "",
    default_keywords_en: "", default_keywords_ar: "",
    og_image_url: null,
    gtm_id: null, ga4_id: null, fb_pixel_id: null,
    google_verification: null, bing_verification: null, semrush_verification: null,
    hreflang_enabled: false,
  });
  const can = useCanAccess("seo");
  const [tab, setTab] = useState("bot");
  const [global, setGlobal] = useState<Global | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingPageId, setSavingPageId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [g, p] = await Promise.all([
        supabase.from("seo_global").select("*").eq("id", "main").maybeSingle(),
        supabase.from("seo_pages").select("*").order("sort_order", { ascending: true }),
      ]);
      if (g.error) toast.error(g.error.message);
      if (p.error) toast.error(p.error.message);
      setGlobal((g.data as Global) ?? makeDefaultGlobal());
      setPages((p.data ?? []) as Page[]);
    } catch (e) {
      toast.error((e as Error).message || "Failed to load SEO settings");
      setGlobal((prev) => prev ?? makeDefaultGlobal());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  if (!can.view) return <div className="p-8 text-muted-foreground">No access</div>;

  const saveGlobal = async () => {
    if (!global) return;
    setSavingGlobal(true);
    const { id, ...rest } = global;
    const { error } = await supabase.from("seo_global").update(rest).eq("id", id);
    setSavingGlobal(false);
    if (error) toast.error(error.message); else toast.success("Saved global SEO");
  };

  const updateGlobal = (patch: Partial<Global>) =>
    setGlobal((g) => (g ? { ...g, ...patch } : g));

  const updatePage = (id: string, patch: Partial<Page>) =>
    setPages((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const savePage = async (page: Page) => {
    setSavingPageId(page.id);
    const { id, ...rest } = page;
    const { error } = await supabase.from("seo_pages").update(rest).eq("id", id);
    setSavingPageId(null);
    if (error) toast.error(error.message); else toast.success(`Saved ${page.id}`);
  };

  if (loading || !global) return (
    <div className="p-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Search className="h-6 w-6" /> SEO Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage meta titles, descriptions, hreflang, analytics and search engine verifications.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="bot"><Bot className="h-4 w-4 me-2" /> AI Bot</TabsTrigger>
          <TabsTrigger value="global"><Globe2 className="h-4 w-4 me-2" /> Global Defaults</TabsTrigger>
          <TabsTrigger value="pages"><Search className="h-4 w-4 me-2" /> Pages ({pages.length})</TabsTrigger>
          <TabsTrigger value="products"><Package className="h-4 w-4 me-2" /> Product SEO</TabsTrigger>
          <TabsTrigger value="services"><Wrench className="h-4 w-4 me-2" /> Service SEO</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 me-2" /> Analytics</TabsTrigger>
          <TabsTrigger value="verify"><ShieldCheck className="h-4 w-4 me-2" /> Verifications</TabsTrigger>
          <TabsTrigger value="hreflang"><Languages className="h-4 w-4 me-2" /> Hreflang Check</TabsTrigger>
        </TabsList>

        <TabsContent value="bot" className="mt-4">
          <SeoBotPanel />
        </TabsContent>

        {/* GLOBAL */}
        <TabsContent value="global" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Site identity & defaults</CardTitle>
              <CardDescription>Used as fallback when a page has no specific value.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><Label>Site name (EN)</Label><Input value={global.site_name_en} onChange={(e) => updateGlobal({ site_name_en: e.target.value })} /></div>
              <div><Label>Site name (AR)</Label><Input dir="rtl" value={global.site_name_ar} onChange={(e) => updateGlobal({ site_name_ar: e.target.value })} /></div>
              <div><Label>Default title (EN)</Label><Input maxLength={70} value={global.default_title_en} onChange={(e) => updateGlobal({ default_title_en: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{global.default_title_en.length}/70</p></div>
              <div><Label>Default title (AR)</Label><Input dir="rtl" maxLength={70} value={global.default_title_ar} onChange={(e) => updateGlobal({ default_title_ar: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{global.default_title_ar.length}/70</p></div>
              <div className="md:col-span-2"><Label>Default description (EN)</Label><Textarea maxLength={160} rows={2} value={global.default_description_en} onChange={(e) => updateGlobal({ default_description_en: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{global.default_description_en.length}/160</p></div>
              <div className="md:col-span-2"><Label>Default description (AR)</Label><Textarea dir="rtl" maxLength={160} rows={2} value={global.default_description_ar} onChange={(e) => updateGlobal({ default_description_ar: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{global.default_description_ar.length}/160</p></div>
              <div className="md:col-span-2"><Label>Default keywords (EN, comma-separated)</Label><Textarea rows={2} value={global.default_keywords_en} onChange={(e) => updateGlobal({ default_keywords_en: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Default keywords (AR)</Label><Textarea dir="rtl" rows={2} value={global.default_keywords_ar} onChange={(e) => updateGlobal({ default_keywords_ar: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Default Open Graph image URL</Label><Input value={global.og_image_url ?? ""} onChange={(e) => updateGlobal({ og_image_url: e.target.value || null })} placeholder="https://…/og.png" /></div>
              <div className="md:col-span-2 flex items-center gap-3"><Switch checked={global.hreflang_enabled} onCheckedChange={(v) => updateGlobal({ hreflang_enabled: v })} /><Label>Emit hreflang tags (en / ar / x-default)</Label></div>
            </CardContent>
          </Card>
          <Button onClick={saveGlobal} disabled={savingGlobal}>{savingGlobal ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />} Save defaults</Button>
        </TabsContent>

        {/* PAGES */}
        <TabsContent value="pages" className="space-y-4 mt-4">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2"><span className="truncate">{p.id} <span className="text-xs text-muted-foreground font-normal">{p.path}</span></span>
                  <Button size="sm" onClick={() => savePage(p)} disabled={savingPageId === p.id}>{savingPageId === p.id ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />} Save</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-3">
                <div><Label>Title (EN)</Label><Input maxLength={70} value={p.title_en} onChange={(e) => updatePage(p.id, { title_en: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{p.title_en.length}/70</p></div>
                <div><Label>Title (AR)</Label><Input dir="rtl" maxLength={70} value={p.title_ar} onChange={(e) => updatePage(p.id, { title_ar: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{p.title_ar.length}/70</p></div>
                <div className="md:col-span-2"><Label>Description (EN)</Label><Textarea maxLength={160} rows={2} value={p.description_en} onChange={(e) => updatePage(p.id, { description_en: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{p.description_en.length}/160</p></div>
                <div className="md:col-span-2"><Label>Description (AR)</Label><Textarea dir="rtl" maxLength={160} rows={2} value={p.description_ar} onChange={(e) => updatePage(p.id, { description_ar: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{p.description_ar.length}/160</p></div>
                <div><Label>Keywords (EN)</Label><Textarea rows={2} value={p.keywords_en} onChange={(e) => updatePage(p.id, { keywords_en: e.target.value })} /></div>
                <div><Label>Keywords (AR)</Label><Textarea dir="rtl" rows={2} value={p.keywords_ar} onChange={(e) => updatePage(p.id, { keywords_ar: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Open Graph image URL (optional)</Label><Input value={p.og_image_url ?? ""} onChange={(e) => updatePage(p.id, { og_image_url: e.target.value || null })} /></div>
                <div className="md:col-span-2 flex items-center gap-3"><Switch checked={p.noindex} onCheckedChange={(v) => updatePage(p.id, { noindex: v })} /><Label>Hide from search engines (noindex)</Label></div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Injection status</CardTitle>
              <CardDescription>Live status of tracking scripts that will be injected sitewide.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-3">
              <StatusTile label="Google Tag Manager" value={global.gtm_id} hint="GTM-XXXXXXX" />
              <StatusTile label="Google Analytics 4" value={global.ga4_id} hint="G-XXXXXXX" />
              <StatusTile label="Facebook Pixel" value={global.fb_pixel_id} hint="numeric ID" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Tracking IDs</CardTitle><CardDescription>Snippets are injected sitewide once configured.</CardDescription></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><Label>Google Tag Manager (GTM-XXXXXXX)</Label><Input value={global.gtm_id ?? ""} onChange={(e) => updateGlobal({ gtm_id: e.target.value || null })} placeholder="GTM-XXXXXXX" /></div>
              <div><Label>Google Analytics 4 (G-XXXXXXX)</Label><Input value={global.ga4_id ?? ""} onChange={(e) => updateGlobal({ ga4_id: e.target.value || null })} placeholder="G-XXXXXXX" /></div>
              <div><Label>Facebook Pixel ID</Label><Input value={global.fb_pixel_id ?? ""} onChange={(e) => updateGlobal({ fb_pixel_id: e.target.value || null })} placeholder="123456789012345" /></div>
            </CardContent>
          </Card>
          <Button onClick={saveGlobal} disabled={savingGlobal}>{savingGlobal ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />} Save analytics</Button>
        </TabsContent>

        {/* VERIFICATIONS */}
        <TabsContent value="verify" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Site verification meta tags</CardTitle><CardDescription>Paste only the content value (not the full meta tag).</CardDescription></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><Label>Google Search Console</Label><Input value={global.google_verification ?? ""} onChange={(e) => updateGlobal({ google_verification: e.target.value || null })} placeholder="abcd1234…" /></div>
              <div><Label>Bing Webmaster (msvalidate.01)</Label><Input value={global.bing_verification ?? ""} onChange={(e) => updateGlobal({ bing_verification: e.target.value || null })} /></div>
              <div><Label>Semrush</Label><Input value={global.semrush_verification ?? ""} onChange={(e) => updateGlobal({ semrush_verification: e.target.value || null })} /></div>
            </CardContent>
          </Card>
          <Button onClick={saveGlobal} disabled={savingGlobal}>{savingGlobal ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />} Save verifications</Button>
        </TabsContent>

        {/* HREFLANG CHECK */}
        <TabsContent value="hreflang" className="space-y-4 mt-4">
          <HreflangChecker pages={pages} enabled={global.hreflang_enabled} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ProductSeoPanel />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ServiceSeoPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusTile({ label, value, hint }: { label: string; value: string | null; hint: string }) {
  const ok = !!(value && value.trim());
  return (
    <div className={`rounded-lg border p-3 ${ok ? "bg-emerald-500/5 border-emerald-500/30" : "bg-muted/30"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{label}</div>
        {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-1 text-xs text-muted-foreground truncate">
        {ok ? <span className="font-mono">{value}</span> : <span>Not configured · {hint}</span>}
      </div>
      <div className="mt-2"><Badge variant={ok ? "default" : "secondary"} className="text-[10px]">{ok ? "Will be injected sitewide" : "Inactive"}</Badge></div>
    </div>
  );
}

type CheckRow = {
  path: string;
  status: "pending" | "running" | "ok" | "warn" | "fail";
  enHref?: string;
  arHref?: string;
  xDefault?: string;
  message?: string;
};

function HreflangChecker({ pages, enabled }: { pages: Page[]; enabled: boolean }) {
  const [rows, setRows] = useState<CheckRow[]>(() => pages.map((p) => ({ path: p.path, status: "pending" as const })));
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRows(pages.map((p) => ({ path: p.path, status: "pending" as const })));
  }, [pages]);

  const run = async () => {
    setRunning(true);
    const next: CheckRow[] = pages.map((p) => ({ path: p.path, status: "running" as const }));
    setRows([...next]);

    for (let i = 0; i < pages.length; i++) {
      const path = pages[i].path;
      const result = await checkPath(path);
      next[i] = result;
      setRows([...next]);
    }
    setRunning(false);
  };

  const checkPath = (path: string): Promise<CheckRow> =>
    new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1024px;height:768px;border:0;";
      const url = `${path}${path.includes("?") ? "&" : "?"}lang=en&_seocheck=1`;
      iframe.src = url;
      let settled = false;
      const cleanup = () => { try { iframe.remove(); } catch {} };
      const finish = (r: CheckRow) => { if (settled) return; settled = true; cleanup(); resolve(r); };

      const timer = setTimeout(() => {
        try {
          const doc = iframe.contentDocument;
          if (!doc) return finish({ path, status: "fail", message: "Cannot access iframe document" });
          const en = doc.head.querySelector('link[rel="alternate"][hreflang="en"]') as HTMLLinkElement | null;
          const ar = doc.head.querySelector('link[rel="alternate"][hreflang="ar"]') as HTMLLinkElement | null;
          const xd = doc.head.querySelector('link[rel="alternate"][hreflang="x-default"]') as HTMLLinkElement | null;

          if (!en || !ar) {
            return finish({
              path, status: "fail",
              enHref: en?.href, arHref: ar?.href, xDefault: xd?.href,
              message: !enabled ? "Hreflang disabled in Global Defaults" : "Missing en or ar tag",
            });
          }
          const enOk = en.href.includes("lang=en");
          const arOk = ar.href.includes("lang=ar");
          if (!enOk || !arOk) {
            return finish({
              path, status: "warn",
              enHref: en.href, arHref: ar.href, xDefault: xd?.href,
              message: "Tag present but href doesn't contain expected lang query",
            });
          }
          finish({ path, status: "ok", enHref: en.href, arHref: ar.href, xDefault: xd?.href });
        } catch (e: any) {
          finish({ path, status: "fail", message: e?.message || "Inspection failed" });
        }
      }, 2500);

      iframe.onerror = () => { clearTimeout(timer); finish({ path, status: "fail", message: "Failed to load page" }); };
      document.body.appendChild(iframe);
    });

  const okCount = rows.filter((r) => r.status === "ok").length;
  const failCount = rows.filter((r) => r.status === "fail" || r.status === "warn").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Hreflang validation</CardTitle>
            <CardDescription>Loads each public page in a hidden frame and inspects the rendered <code>&lt;link rel="alternate"&gt;</code> tags for <code>en</code>, <code>ar</code> and <code>x-default</code>.</CardDescription>
          </div>
          <Button onClick={run} disabled={running || pages.length === 0}>
            {running ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Play className="h-4 w-4 me-2" />}
            {running ? "Running…" : "Run check"}
          </Button>
        </div>
        {!enabled && (
          <div className="mt-2 text-sm flex items-start gap-2 text-amber-600"><AlertCircle className="h-4 w-4 mt-0.5" /> Hreflang emission is currently disabled in Global Defaults — pages will fail this check.</div>
        )}
        {(okCount + failCount) > 0 && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20">{okCount} OK</Badge>
            {failCount > 0 && <Badge variant="destructive">{failCount} need attention</Badge>}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => (
          <div key={r.path} className="border rounded-md p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <StatusIcon status={r.status} />
                <span className="font-mono text-xs truncate">{r.path}</span>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase">{r.status}</Badge>
            </div>
            {(r.enHref || r.arHref || r.message) && (
              <div className="mt-2 grid sm:grid-cols-2 gap-1 text-xs text-muted-foreground">
                {r.enHref && <div><span className="font-medium text-foreground">en:</span> <span className="font-mono break-all">{r.enHref}</span></div>}
                {r.arHref && <div><span className="font-medium text-foreground">ar:</span> <span className="font-mono break-all">{r.arHref}</span></div>}
                {r.xDefault && <div className="sm:col-span-2"><span className="font-medium text-foreground">x-default:</span> <span className="font-mono break-all">{r.xDefault}</span></div>}
                {r.message && <div className="sm:col-span-2 text-amber-600">{r.message}</div>}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status: CheckRow["status"] }) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "fail") return <XCircle className="h-4 w-4 text-destructive" />;
  if (status === "warn") return <AlertCircle className="h-4 w-4 text-amber-500" />;
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  return <span className="h-2 w-2 rounded-full bg-muted-foreground/40 inline-block ms-1 me-1" />;
}

type ProductRow = {
  id: string; slug: string; name_en: string; name_ar: string;
  meta_title_en: string | null; meta_title_ar: string | null;
  meta_description_en: string | null; meta_description_ar: string | null;
  meta_keywords: string | null; og_image: string | null; canonical_url: string | null;
};

function ProductSeoPanel() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string>("");
  const [draft, setDraft] = useState<ProductRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,name_en,name_ar,meta_title_en,meta_title_ar,meta_description_en,meta_description_ar,meta_keywords,og_image,canonical_url")
        .order("name_en", { ascending: true });
      if (error) toast.error(error.message);
      else setItems((data ?? []) as ProductRow[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!sel) { setDraft(null); return; }
    const found = items.find((x) => x.id === sel) ?? null;
    setDraft(found ? { ...found } : null);
  }, [sel, items]);

  const upd = (patch: Partial<ProductRow>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase.from("products").update({
      meta_title_en: draft.meta_title_en, meta_title_ar: draft.meta_title_ar,
      meta_description_en: draft.meta_description_en, meta_description_ar: draft.meta_description_ar,
      meta_keywords: draft.meta_keywords, og_image: draft.og_image, canonical_url: draft.canonical_url,
    }).eq("id", draft.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Saved product SEO"); setItems((p) => p.map((x) => x.id === draft.id ? draft : x)); }
  };

  const hasSeo = (r: ProductRow) =>
    !!(r.meta_title_en || r.meta_title_ar || r.meta_description_en || r.meta_description_ar || r.meta_keywords || r.og_image || r.canonical_url);

  const createFromProduct = () => {
    if (!draft) return;
    upd({
      meta_title_en: draft.name_en || "",
      meta_title_ar: draft.name_ar || "",
      meta_description_en: "",
      meta_description_ar: "",
      meta_keywords: "",
      og_image: "",
      canonical_url: `/shop/${draft.slug}`,
    });
    toast.message("Prefilled — click Save to create the SEO record");
  };

  const deleteSeo = async () => {
    if (!draft) return;
    if (!confirm("Clear all SEO fields for this product?")) return;
    setSaving(true);
    const cleared = { meta_title_en: null, meta_title_ar: null, meta_description_en: null, meta_description_ar: null, meta_keywords: null, og_image: null, canonical_url: null };
    const { error } = await supabase.from("products").update(cleared).eq("id", draft.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      const next = { ...draft, ...cleared } as ProductRow;
      setDraft(next);
      setItems((p) => p.map((x) => x.id === draft.id ? next : x));
      toast.success("Product SEO cleared");
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading products…</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Select a product</CardTitle>
          <CardDescription>Edit per-product meta tags (title, description, keywords, OG image, canonical).</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={sel} onValueChange={setSel}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder={items.length ? "Choose a product…" : "No products yet"} /></SelectTrigger>
            <SelectContent>
              {items.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name_en || p.name_ar || p.slug} <span className="text-muted-foreground text-xs">/shop/{p.slug}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <SeoBulkImport
        kind="product"
        items={items.map((p) => ({ slug: p.slug, label: p.name_en || p.slug }))}
        onApplied={async () => {
          const { data } = await supabase
            .from("products")
            .select("id,slug,name_en,name_ar,meta_title_en,meta_title_ar,meta_description_en,meta_description_ar,meta_keywords,og_image,canonical_url")
            .order("name_en", { ascending: true });
          setItems((data ?? []) as ProductRow[]);
        }}
      />

      {draft && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="truncate">{draft.name_en || draft.slug} <span className="text-xs text-muted-foreground font-normal">/shop/{draft.slug}</span></span>
                <div className="flex items-center gap-2">
                  {hasSeo(draft) ? (
                    <Badge variant="secondary" className="text-[10px]">SEO set</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={createFromProduct} disabled={saving}>
                      <Plus className="h-4 w-4 me-1" /> Create from product
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={deleteSeo} disabled={saving || !hasSeo(draft)}>
                    <Trash2 className="h-4 w-4 me-1" /> Clear
                  </Button>
                  <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />} Save</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <div><Label>Title (EN)</Label><Input maxLength={70} value={draft.meta_title_en ?? ""} onChange={(e) => upd({ meta_title_en: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{(draft.meta_title_en ?? "").length}/70</p></div>
              <div><Label>Title (AR)</Label><Input dir="rtl" maxLength={70} value={draft.meta_title_ar ?? ""} onChange={(e) => upd({ meta_title_ar: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{(draft.meta_title_ar ?? "").length}/70</p></div>
              <div className="md:col-span-2"><Label>Description (EN)</Label><Textarea maxLength={160} rows={2} value={draft.meta_description_en ?? ""} onChange={(e) => upd({ meta_description_en: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{(draft.meta_description_en ?? "").length}/160</p></div>
              <div className="md:col-span-2"><Label>Description (AR)</Label><Textarea dir="rtl" maxLength={160} rows={2} value={draft.meta_description_ar ?? ""} onChange={(e) => upd({ meta_description_ar: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{(draft.meta_description_ar ?? "").length}/160</p></div>
              <div className="md:col-span-2"><Label>Keywords (comma-separated)</Label><Textarea rows={2} value={draft.meta_keywords ?? ""} onChange={(e) => upd({ meta_keywords: e.target.value })} /></div>
              <div><Label>Open Graph image URL</Label><Input value={draft.og_image ?? ""} onChange={(e) => upd({ og_image: e.target.value || null })} placeholder="https://…/og.png" /></div>
              <div><Label>Canonical URL</Label><Input value={draft.canonical_url ?? ""} onChange={(e) => upd({ canonical_url: e.target.value || null })} placeholder="https://…/shop/slug" /></div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ServiceSeoPanel() {
  type Row = { id: string; path: string; title_en: string; title_ar: string; description_en: string; description_ar: string; keywords_en: string; keywords_ar: string; og_image_url: string | null; noindex: boolean; sort_order: number; };
  const [sel, setSel] = useState<string>("");
  const [draft, setDraft] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const [tick, setTick] = useState(0);

  const svc = staticServices.find((s) => s.slug === sel);
  const rowId = sel ? `service-${sel}` : "";
  const path = sel ? `/services/${sel}` : "";

  useEffect(() => {
    if (!sel) { setDraft(null); setExists(false); return; }
    setLoading(true);
    supabase.from("seo_pages").select("*").eq("id", rowId).maybeSingle().then(({ data }) => {
      if (data) { setDraft(data as Row); setExists(true); }
      else {
        setDraft({
          id: rowId, path, sort_order: 0, noindex: false, og_image_url: null,
          title_en: svc?.title.en ?? "", title_ar: svc?.title.ar ?? "",
          description_en: svc?.desc.en ?? "", description_ar: svc?.desc.ar ?? "",
          keywords_en: "", keywords_ar: "",
        });
        setExists(false);
      }
      setLoading(false);
    });
  }, [sel, tick]);

  const upd = (patch: Partial<Row>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase.from("seo_pages").upsert(draft, { onConflict: "id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else { setExists(true); toast.success(exists ? "Updated service SEO" : "Created service SEO"); }
  };

  const resetFromDefaults = () => {
    if (!sel) return;
    setDraft({
      id: rowId, path, sort_order: 0, noindex: false, og_image_url: null,
      title_en: svc?.title.en ?? "", title_ar: svc?.title.ar ?? "",
      description_en: svc?.desc.en ?? "", description_ar: svc?.desc.ar ?? "",
      keywords_en: "", keywords_ar: "",
    });
    toast.message("Reset to service defaults — click Save to persist");
  };

  const remove = async () => {
    if (!exists || !rowId) return;
    if (!confirm("Delete this service SEO record? The service will fall back to global defaults.")) return;
    setSaving(true);
    const { error } = await supabase.from("seo_pages").delete().eq("id", rowId);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      setExists(false);
      setDraft({
        id: rowId, path, sort_order: 0, noindex: false, og_image_url: null,
        title_en: svc?.title.en ?? "", title_ar: svc?.title.ar ?? "",
        description_en: svc?.desc.en ?? "", description_ar: svc?.desc.ar ?? "",
        keywords_en: "", keywords_ar: "",
      });
      toast.success("Service SEO deleted");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Select a service</CardTitle>
          <CardDescription>Edit per-service meta tags. Creates a seo_pages entry on first save.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={sel} onValueChange={setSel}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Choose a service…" /></SelectTrigger>
            <SelectContent>
              {staticServices.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>
                  {s.title.en} <span className="text-muted-foreground text-xs">/services/{s.slug}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <SeoBulkImport
        kind="service"
        items={staticServices.map((s) => ({ slug: s.slug, label: s.title.en }))}
        onApplied={() => setTick((t) => t + 1)}
      />

      {loading && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}

      {draft && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="truncate">{svc?.title.en} <span className="text-xs text-muted-foreground font-normal">{draft.path}</span></span>
              <div className="flex items-center gap-2">
                <Badge variant={exists ? "default" : "secondary"} className="text-[10px]">
                  {exists ? "Custom SEO" : "Not created"}
                </Badge>
                <Button size="sm" variant="ghost" onClick={resetFromDefaults} disabled={saving}>
                  <RefreshCw className="h-4 w-4 me-1" /> Reset
                </Button>
                {exists && (
                  <Button size="sm" variant="ghost" onClick={remove} disabled={saving}>
                    <Trash2 className="h-4 w-4 me-1" /> Delete
                  </Button>
                )}
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : exists ? <Save className="h-4 w-4 me-2" /> : <Plus className="h-4 w-4 me-2" />}
                  {exists ? "Save" : "Create"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            <div><Label>Title (EN)</Label><Input maxLength={70} value={draft.title_en} onChange={(e) => upd({ title_en: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{draft.title_en.length}/70</p></div>
            <div><Label>Title (AR)</Label><Input dir="rtl" maxLength={70} value={draft.title_ar} onChange={(e) => upd({ title_ar: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{draft.title_ar.length}/70</p></div>
            <div className="md:col-span-2"><Label>Description (EN)</Label><Textarea maxLength={160} rows={2} value={draft.description_en} onChange={(e) => upd({ description_en: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{draft.description_en.length}/160</p></div>
            <div className="md:col-span-2"><Label>Description (AR)</Label><Textarea dir="rtl" maxLength={160} rows={2} value={draft.description_ar} onChange={(e) => upd({ description_ar: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{draft.description_ar.length}/160</p></div>
            <div><Label>Keywords (EN)</Label><Textarea rows={2} value={draft.keywords_en} onChange={(e) => upd({ keywords_en: e.target.value })} /></div>
            <div><Label>Keywords (AR)</Label><Textarea dir="rtl" rows={2} value={draft.keywords_ar} onChange={(e) => upd({ keywords_ar: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Open Graph image URL (optional)</Label><Input value={draft.og_image_url ?? ""} onChange={(e) => upd({ og_image_url: e.target.value || null })} /></div>
            <div className="md:col-span-2 flex items-center gap-3"><Switch checked={draft.noindex} onCheckedChange={(v) => upd({ noindex: v })} /><Label>Hide from search engines (noindex)</Label></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type BulkKind = "product" | "service";
type BulkItem = { slug: string; label: string };
const PRODUCT_COLS = ["meta_title_en", "meta_title_ar", "meta_description_en", "meta_description_ar", "meta_keywords", "og_image", "canonical_url"] as const;
const SERVICE_COLS = ["title_en", "title_ar", "description_en", "description_ar", "keywords_en", "keywords_ar", "og_image_url", "noindex"] as const;

type RowResult = {
  row: number;
  slug: string;
  status: "updated" | "created" | "skipped" | "failed";
  reason?: string;
};

type BulkReport = {
  updated: number;
  created: number;
  skipped: number;
  failed: number;
  total: number;
  rows: RowResult[];
};

const statusBadge: Record<RowResult["status"], { label: string; className: string }> = {
  updated: { label: "Updated", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20" },
  created: { label: "Created", className: "bg-sky-500/15 text-sky-700 border-sky-500/30 hover:bg-sky-500/20" },
  skipped: { label: "Skipped", className: "bg-amber-500/15 text-amber-700 border-amber-500/30 hover:bg-amber-500/20" },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20" },
};

function SeoBulkImport({ kind, items, onApplied }: { kind: BulkKind; items: BulkItem[]; onApplied: () => void | Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<BulkReport | null>(null);

  const optional = (kind === "product" ? PRODUCT_COLS : SERVICE_COLS) as readonly string[];

  const downloadTemplate = () => {
    const sample = items.slice(0, 2).map((it) => {
      const base: Record<string, unknown> = { slug: it.slug };
      if (kind === "product") {
        base.meta_title_en = it.label;
        base.meta_title_ar = "";
        base.meta_description_en = "";
        base.meta_description_ar = "";
        base.meta_keywords = "";
        base.og_image = "";
        base.canonical_url = `/shop/${it.slug}`;
      } else {
        base.title_en = it.label;
        base.title_ar = "";
        base.description_en = "";
        base.description_ar = "";
        base.keywords_en = "";
        base.keywords_ar = "";
        base.og_image_url = "";
        base.noindex = false;
      }
      return base;
    });
    if (sample.length === 0) sample.push({ slug: "example-slug" });
    const ws = XLSX.utils.json_to_sheet(sample, { header: ["slug", ...optional] });
    ws["!cols"] = [{ wch: 24 }, ...optional.map(() => ({ wch: 28 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, kind === "product" ? "Product SEO" : "Service SEO");
    XLSX.writeFile(wb, `${kind}-seo-template.xlsx`);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setReport(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) { toast.error("Workbook has no sheets"); return; }
      const headerRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
      const headers = (headerRows[0] ?? []).map((h) => String(h ?? "").trim());
      if (!headers.includes("slug")) {
        setReport({ updated: 0, created: 0, skipped: 0, failed: 1, total: 0, rows: [{ row: 1, slug: "—", status: "failed", reason: `Missing required column "slug". Expected: slug, ${optional.join(", ")}` }] });
        toast.error("Import failed — invalid template");
        return;
      }
      const unknown = headers.filter((h) => h && h !== "slug" && !optional.includes(h));
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const results: RowResult[] = [];
      if (unknown.length) results.push({ row: 1, slug: "—", status: "skipped", reason: `Unknown column(s) ignored: ${unknown.join(", ")}` });
      const bySlug = new Map(items.map((i) => [i.slug, i] as const));

      // Pre-check service existence to tell created vs updated
      const serviceExists = new Map<string, boolean>();
      if (kind === "service") {
        const serviceIds = rows
          .map((r) => String(r.slug ?? "").trim())
          .filter((s) => s && bySlug.has(s))
          .map((s) => `service-${s}`);
        if (serviceIds.length) {
          const { data } = await supabase.from("seo_pages").select("id").in("id", serviceIds);
          (data ?? []).forEach((d: any) => serviceExists.set(d.id, true));
        }
      }

      let updated = 0, created = 0, skipped = 0, failed = 0;

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNo = i + 2;
        const slug = String(r.slug ?? "").trim();
        if (!slug) { results.push({ row: rowNo, slug: "—", status: "failed", reason: "slug is empty" }); failed++; continue; }
        if (!bySlug.has(slug)) { results.push({ row: rowNo, slug, status: "failed", reason: `slug "${slug}" not found` }); failed++; continue; }
        const patch: Record<string, unknown> = {};
        for (const col of optional) {
          if (!(col in r)) continue;
          const raw = r[col];
          if (raw === "" || raw == null) { patch[col] = col === "noindex" ? false : null; continue; }
          if (col === "noindex") patch[col] = String(raw).toLowerCase() === "true" || raw === true;
          else patch[col] = String(raw);
        }
        if (Object.keys(patch).length === 0) { results.push({ row: rowNo, slug, status: "skipped", reason: "no SEO columns to update" }); skipped++; continue; }

        if (kind === "product") {
          const { error } = await supabase.from("products").update(patch as never).eq("slug", slug);
          if (error) { results.push({ row: rowNo, slug, status: "failed", reason: error.message }); failed++; }
          else { results.push({ row: rowNo, slug, status: "updated" }); updated++; }
        } else {
          const svc = staticServices.find((s) => s.slug === slug);
          const fullRow = {
            id: `service-${slug}`,
            path: `/services/${slug}`,
            sort_order: 0,
            noindex: false,
            og_image_url: null as string | null,
            title_en: svc?.title.en ?? "",
            title_ar: svc?.title.ar ?? "",
            description_en: svc?.desc.en ?? "",
            description_ar: svc?.desc.ar ?? "",
            keywords_en: "",
            keywords_ar: "",
            ...patch,
          };
          const existed = serviceExists.has(fullRow.id);
          const { error } = await supabase.from("seo_pages").upsert(fullRow as never, { onConflict: "id" });
          if (error) { results.push({ row: rowNo, slug, status: "failed", reason: error.message }); failed++; }
          else {
            if (existed) { results.push({ row: rowNo, slug, status: "updated" }); updated++; }
            else { results.push({ row: rowNo, slug, status: "created" }); created++; }
          }
        }
      }

      const reportObj: BulkReport = { updated, created, skipped, failed, total: rows.length, rows: results };
      setReport(reportObj);
      if (updated + created > 0) toast.success(`Processed ${rows.length} row(s): ${updated} updated, ${created} created${skipped ? `, ${skipped} skipped` : ""}${failed ? `, ${failed} failed` : ""}`);
      else if (failed === rows.length) toast.error("All rows failed — check the report");
      else toast.warning("No records changed");
      await onApplied();
    } catch (err: any) {
      setReport({ updated: 0, created: 0, skipped: 0, failed: 1, total: 0, rows: [{ row: 0, slug: "—", status: "failed", reason: err?.message || "Failed to parse file" }] });
      toast.error(err?.message || "Failed to import file");
    } finally {
      setBusy(false);
    }
  };

  const anyIssues = !!report && (report.failed > 0 || report.skipped > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" /> Bulk update from Excel</CardTitle>
        <CardDescription>
          Update existing {kind} SEO records by <code>slug</code>. Download the template, fill only the columns you want to change, then upload. Empty cells clear the field.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 me-1" /> Template
        </Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Upload className="h-4 w-4 me-1" />} Import Excel
        </Button>
        {report && (
          <div className="w-full mt-2 space-y-2">
            <Alert variant={anyIssues ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                Import report — {report.total} row(s) processed
                {report.updated ? ` · ${report.updated} updated` : ""}
                {report.created ? ` · ${report.created} created` : ""}
                {report.skipped ? ` · ${report.skipped} skipped` : ""}
                {report.failed ? ` · ${report.failed} failed` : ""}
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 max-h-72 overflow-auto rounded border bg-background/40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead className="w-32">Slug</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.rows.map((r, i) => {
                        const badge = statusBadge[r.status];
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{r.row === 0 ? "—" : r.row}</TableCell>
                            <TableCell className="text-xs font-mono truncate max-w-[8rem]">{r.slug}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${badge.className}`}>{badge.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.reason || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={() => setReport(null)}>Dismiss</Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}