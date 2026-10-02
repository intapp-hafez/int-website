import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useAboutContent,
  defaultAboutContent,
  defaultHero,
  DEFAULT_ABOUT_STATS,
  withCacheBust,
  type AboutContent,
  type AboutHero,
  type Bilingual,
  type TeamMember,
  type AboutStat,
} from "@/lib/about-store";
import { supabase } from "@/integrations/supabase/client";
import {
  RotateCcw,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Image as ImageIcon,
  ShieldAlert,
  Check,
  CircleAlert,
  GripVertical,
  ArrowUp,
  ArrowDown,
  FileText,
  BarChart3,
  UserCheck,
  Award,
  Users,
  Compass,
  Table as TableIcon,
  LayoutGrid,
  Pencil,
  User,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/admin/about")({
  head: () => ({ meta: [{ title: "About Page — Admin" }] }),
  component: AboutAdminPage,
});

// Lightweight validators (mirrors server zod schema's intent for fast feedback).
function validate(form: AboutContent, hero: AboutHero): Record<string, string> {
  const errs: Record<string, string> = {};
  const requireBi = (key: string, v: Bilingual, label: string) => {
    if (!v.en?.trim()) errs[`${key}.en`] = `${label} (English) is required`;
    if (!v.ar?.trim()) errs[`${key}.ar`] = `${label} (Arabic) is required`;
    if (v.en && v.en.length > 2000) errs[`${key}.en`] = `${label} (English) is too long`;
    if (v.ar && v.ar.length > 2000) errs[`${key}.ar`] = `${label} (Arabic) is too long`;
  };
  requireBi("title", form.title, "Hero Title");
  requireBi("sub", form.sub, "Hero Subtitle");
  requireBi("eyebrow", form.eyebrow, "Eyebrow");
  requireBi("overviewT", form.overviewT, "Overview Title");
  requireBi("overviewD", form.overviewD, "Overview Description");
  form.values.forEach((v, i) => {
    requireBi(`values.${i}.title`, v.title, `Value ${i + 1} Title`);
    requireBi(`values.${i}.desc`, v.desc, `Value ${i + 1} Description`);
  });
  form.certifications.forEach((c, i) => {
    if (c.length > 120) errs[`certifications.${i}`] = "Max 120 characters";
  });
  // Team: keys must be present, unique, and bilingual name+role required.
  const seenKeys = new Set<string>();
  form.team.forEach((m, i) => {
    const k = (m.key ?? "").trim();
    if (!k) errs[`team.${i}.key`] = "Key is required";
    else if (k.length > 64) errs[`team.${i}.key`] = "Key is too long (max 64)";
    else if (seenKeys.has(k)) errs[`team.${i}.key`] = "Key must be unique";
    seenKeys.add(k);
    requireBi(`team.${i}.name`, m.name, `Member ${i + 1} Name`);
    requireBi(`team.${i}.role`, m.role, `Member ${i + 1} Role`);
  });
  // Owner bilingual fields are surfaced publicly — require both languages.
  requireBi("ownerName", form.ownerName, "Owner Name");
  requireBi("ownerRole", form.ownerRole, "Owner Role");
  requireBi("ownerBio", form.ownerBio, "Owner Bio");
  if (hero.zoom < 1 || hero.zoom > 3) errs["hero.zoom"] = "Zoom must be between 1× and 3×";
  return errs;
}

function AboutAdminPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { content, hero, updatedAt, loading, save } = useAboutContent();
  const [form, setForm] = useState<AboutContent>(content);
  const [heroForm, setHeroForm] = useState<AboutHero>(hero);
  const [saving, setSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");

  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialHydratedRef = useRef(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Team profiles directory view mode (Table view by default) & modal state
  const [teamViewMode, setTeamViewMode] = useState<"table" | "cards">("table");
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeamIdx, setEditingTeamIdx] = useState<number | null>(null);
  const [memberForm, setMemberForm] = useState<TeamMember>({
    key: "",
    name: { en: "", ar: "" },
    role: { en: "", ar: "" },
    image: "",
  });

  const moveTeamMember = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= form.team.length || toIdx === fromIdx) return;
    const next = form.team.slice();
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    setForm({ ...form, team: next });
    setDirty(true);
  };

  const handleOpenAddMember = () => {
    setEditingTeamIdx(null);
    setMemberForm({
      key: `member-${form.team.length + 1}`,
      name: { en: "", ar: "" },
      role: { en: "", ar: "" },
      image: "",
    });
    setTeamModalOpen(true);
  };

  const handleOpenEditMember = (idx: number) => {
    setEditingTeamIdx(idx);
    setMemberForm({
      key: form.team[idx].key || "",
      name: { en: form.team[idx].name?.en || "", ar: form.team[idx].name?.ar || "" },
      role: { en: form.team[idx].role?.en || "", ar: form.team[idx].role?.ar || "" },
      image: form.team[idx].image || "",
    });
    setTeamModalOpen(true);
  };

  const handleSaveMember = () => {
    const cleanKey = memberForm.key.trim();
    if (!cleanKey) {
      toast.error("Key identifier is required");
      return;
    }
    if (!memberForm.name.en.trim() || !memberForm.name.ar.trim()) {
      toast.error("Both English and Arabic names are required");
      return;
    }
    if (!memberForm.role.en.trim() || !memberForm.role.ar.trim()) {
      toast.error("Both English and Arabic roles are required");
      return;
    }

    const keyExists = form.team.some(
      (m, idx) => idx !== editingTeamIdx && m.key.trim().toLowerCase() === cleanKey.toLowerCase()
    );
    if (keyExists) {
      toast.error("Key identifier must be unique across team members");
      return;
    }

    const payload: TeamMember = {
      key: cleanKey,
      name: { en: memberForm.name.en.trim(), ar: memberForm.name.ar.trim() },
      role: { en: memberForm.role.en.trim(), ar: memberForm.role.ar.trim() },
      image: memberForm.image?.trim() || undefined,
    };

    if (editingTeamIdx !== null) {
      const nextTeam = form.team.map((m, i) => (i === editingTeamIdx ? payload : m));
      setForm({ ...form, team: nextTeam });
      toast.success("Team member updated");
    } else {
      setForm({ ...form, team: [...form.team, payload] });
      toast.success("Team member added");
    }
    setDirty(true);
    setTeamModalOpen(false);
  };

  useEffect(() => { setForm(content); }, [content]);
  useEffect(() => { setHeroForm(hero); }, [hero]);

  const errors = useMemo(() => validate(form, heroForm), [form, heroForm]);
  const errorCount = Object.keys(errors).length;

  // Category error counters for tab badges
  const tabErrors = useMemo(() => {
    const errKeys = Object.keys(errors);
    return {
      hero: errKeys.filter((k) => k.startsWith("hero.") || k.startsWith("eyebrow.") || k.startsWith("title.") || k.startsWith("sub.")).length,
      story: errKeys.filter((k) => k.startsWith("overview") || k.startsWith("vision") || k.startsWith("mission")).length,
      leadership: errKeys.filter((k) => k.startsWith("owner")).length,
      values: errKeys.filter((k) => k.startsWith("values.") || k.startsWith("certifications.")).length,
      team: errKeys.filter((k) => k.startsWith("team.")).length,
    };
  }, [errors]);

  const setBi = (key: keyof AboutContent, lang: "en" | "ar", v: string) => {
    setForm({ ...form, [key]: { ...(form[key] as Bilingual), [lang]: v } } as AboutContent);
    setDirty(true);
  };
  const setValue = (idx: number, field: "title" | "desc", lang: "en" | "ar", v: string) => {
    const values = form.values.map((val, i) =>
      i === idx ? { ...val, [field]: { ...val[field], [lang]: v } } : val,
    ) as AboutContent["values"];
    setForm({ ...form, values });
    setDirty(true);
  };
  const updateCert = (idx: number, v: string) => {
    const certifications = form.certifications.map((c, i) => (i === idx ? v : c));
    setForm({ ...form, certifications });
    setDirty(true);
  };
  const addCert = () => { setForm({ ...form, certifications: [...form.certifications, ""] }); setDirty(true); };
  const removeCert = (idx: number) => { setForm({ ...form, certifications: form.certifications.filter((_, i) => i !== idx) }); setDirty(true); };
  const updateHero = (next: Partial<AboutHero>) => { setHeroForm({ ...heroForm, ...next }); setDirty(true); };

  const onSave = async (opts: { silent?: boolean } = {}) => {
    if (!isAdmin) {
      if (!opts.silent) toast.error("Admin role required to save About content");
      return;
    }
    if (errorCount > 0) {
      if (!opts.silent) toast.error(`Fix ${errorCount} validation issue${errorCount === 1 ? "" : "s"} before saving`);
      return;
    }
    setSaving(true);
    try {
      const certifications = form.certifications.map((c) => c.trim()).filter(Boolean);
      const nextContent: AboutContent = { ...form, certifications };
      await save({ content: nextContent, hero: heroForm });
      setLastSavedAt(new Date());
      setDirty(false);
      if (!opts.silent) toast.success("About page saved successfully");
      else toast.success("Autosaved", { duration: 1500 });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Debounced autosave
  useEffect(() => {
    if (loading) return;
    if (!initialHydratedRef.current) { initialHydratedRef.current = true; return; }
    if (!autoSave || !dirty || !isAdmin || errorCount > 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void onSave({ silent: true }); }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, heroForm, autoSave, dirty, isAdmin, errorCount, loading]);

  const onResetText = () => {
    if (!confirm("Are you sure you want to reset all textual fields to defaults?")) return;
    setForm(defaultAboutContent);
    setDirty(true);
    toast.message("Text reset to defaults — click Save to publish.");
  };

  const onUpload = async (file: File) => {
    if (!isAdmin) { toast.error("Admin role required to upload images"); return; }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const rand = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, "");
      const path = `hero/${rand}.${ext}`;
      const { error } = await supabase.storage.from("about-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("about-images").getPublicUrl(path);
      updateHero({ image_url: data.publicUrl });
      toast.success("Image uploaded — click Save to publish.");
    } catch (e: any) {
      const msg = e?.message?.includes("row-level security")
        ? "You don't have permission to upload (admin role required)."
        : e?.message ?? "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const onPreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    const r = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    updateHero({ focal_x: Math.max(0, Math.min(100, x)), focal_y: Math.max(0, Math.min(100, y)) });
  };

  const previewSrc = withCacheBust(heroForm.image_url, updatedAt);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">About Page Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage public About page content, hero banner, metrics, founder message, and team profiles.
          </p>
          {loading && (
            <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading content…
            </p>
          )}
        </div>

        {/* Global Save and Actions Bar */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetText}
            className="text-xs shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 me-1.5" /> Reset
          </Button>

          <Button
            onClick={() => void onSave()}
            disabled={saving || !isAdmin || errorCount > 0}
            size="sm"
            className="shadow-xs"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 me-1.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5 me-1.5" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {!isAdmin && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-destructive">Admin role required</p>
            <p className="text-muted-foreground text-xs mt-1">
              You can browse the editor, but saving and uploading are disabled.
            </p>
          </div>
        </div>
      )}

      {/* Status Bar: autosave, validation, last saved */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-xs">
        <div className="flex items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium">
            <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            <span>Autosave</span>
          </label>
          {saving && (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          )}
          {!saving && dirty && (
            <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
              ● Unsaved changes
            </span>
          )}
          {!saving && !dirty && lastSavedAt && (
            <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 text-xs">
              <Check className="h-3 w-3" /> Saved {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
        {errorCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-destructive font-medium">
            <CircleAlert className="h-3.5 w-3.5" /> {errorCount} validation issue{errorCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/70 p-1 rounded-xl h-auto flex flex-wrap gap-1 border shadow-xs">
          <TabsTrigger
            value="hero"
            className="text-xs py-2 px-3 rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
            <span>Hero & Media</span>
            {tabErrors.hero > 0 && (
              <Badge variant="destructive" className="h-4 px-1 text-[9px]">
                {tabErrors.hero}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="story"
            className="text-xs py-2 px-3 rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <Compass className="h-3.5 w-3.5 text-emerald-500" />
            <span>Overview & Mission</span>
            {tabErrors.story > 0 && (
              <Badge variant="destructive" className="h-4 px-1 text-[9px]">
                {tabErrors.story}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="metrics"
            className="text-xs py-2 px-3 rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
            <span>Key Metrics</span>
          </TabsTrigger>

          <TabsTrigger
            value="leadership"
            className="text-xs py-2 px-3 rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <UserCheck className="h-3.5 w-3.5 text-violet-500" />
            <span>Founder & Leadership</span>
            {tabErrors.leadership > 0 && (
              <Badge variant="destructive" className="h-4 px-1 text-[9px]">
                {tabErrors.leadership}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="values"
            className="text-xs py-2 px-3 rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <Award className="h-3.5 w-3.5 text-cyan-500" />
            <span>Values & Certs</span>
            {tabErrors.values > 0 && (
              <Badge variant="destructive" className="h-4 px-1 text-[9px]">
                {tabErrors.values}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="team"
            className="text-xs py-2 px-3 rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <Users className="h-3.5 w-3.5 text-rose-500" />
            <span>Team Members</span>
            {tabErrors.team > 0 && (
              <Badge variant="destructive" className="h-4 px-1 text-[9px]">
                {tabErrors.team}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: HERO & MEDIA */}
        {/* ============================================================== */}
        <TabsContent value="hero" className="space-y-6 pt-4">
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-blue-500" />
                Hero Banner Image
              </CardTitle>
              <CardDescription className="text-xs">
                Upload and configure the hero focal point, zoom, and RTL orientation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                ref={previewRef}
                onClick={heroForm.image_url ? onPreviewClick : undefined}
                className="relative w-full aspect-[16/7] rounded-xl border bg-muted overflow-hidden select-none"
                style={heroForm.image_url ? { cursor: "crosshair" } : undefined}
              >
                {heroForm.image_url ? (
                  <img
                    src={previewSrc ?? heroForm.image_url}
                    alt="Hero preview"
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      objectPosition: `${heroForm.focal_x}% ${heroForm.focal_y}%`,
                      transform: `scale(${heroForm.zoom})${heroForm.mirror_rtl ? " scaleX(-1)" : ""}`,
                      transformOrigin: `${heroForm.focal_x}% ${heroForm.focal_y}%`,
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <ImageIcon className="h-8 w-8" />
                    <p className="text-sm">No hero image uploaded</p>
                  </div>
                )}
                {heroForm.image_url && (
                  <div
                    className="absolute h-4 w-4 rounded-full border-2 border-white bg-accent shadow-lg pointer-events-none -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${heroForm.focal_x}%`, top: `${heroForm.focal_y}%` }}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Click anywhere on the image above to set the focal point (kept centered when cropped on mobile devices).
              </p>

              {/* Side-by-side LTR / RTL preview */}
              {heroForm.image_url && (
                <div className="grid md:grid-cols-2 gap-4 pt-1">
                  <HeroSidePreview hero={heroForm} dir="ltr" content={form} src={previewSrc} />
                  <HeroSidePreview hero={heroForm} dir="rtl" content={form} src={previewSrc} />
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || !isAdmin}
                >
                  {uploading ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Upload className="h-4 w-4 me-2" />}
                  {heroForm.image_url ? "Replace Image" : "Upload Image"}
                </Button>
                {heroForm.image_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => updateHero({ image_url: null })}
                    disabled={!isAdmin}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 me-2" /> Remove Image
                  </Button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onUpload(f);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-sm">Zoom Level ({heroForm.zoom.toFixed(2)}x)</Label>
                  <Slider
                    min={1}
                    max={3}
                    step={0.05}
                    value={[heroForm.zoom]}
                    onValueChange={([v]) => updateHero({ zoom: v })}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div>
                    <Label className="text-sm">Mirror Image in Arabic (RTL)</Label>
                    <p className="text-xs text-muted-foreground">Flips the banner horizontally to balance Arabic layouts.</p>
                  </div>
                  <Switch
                    checked={heroForm.mirror_rtl}
                    onCheckedChange={(v) => updateHero({ mirror_rtl: v })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground pt-1">
                <div>Focal X: {heroForm.focal_x.toFixed(0)}%</div>
                <div>Focal Y: {heroForm.focal_y.toFixed(0)}%</div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setHeroForm({ ...defaultHero, image_url: heroForm.image_url }); setDirty(true); }}
                className="text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 me-1.5" /> Reset positioning
              </Button>
            </CardContent>
          </Card>

          {/* Hero Headlines Card */}
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Hero Headlines & Tagline
              </CardTitle>
              <CardDescription className="text-xs">
                The main banner text shown across the top of the About page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <BiField
                label="Eyebrow / Tagline"
                value={form.eyebrow}
                onChange={(lang, v) => setBi("eyebrow", lang, v)}
                errorEn={errors["eyebrow.en"]}
                errorAr={errors["eyebrow.ar"]}
              />
              <BiField
                label="Hero Title"
                value={form.title}
                onChange={(lang, v) => setBi("title", lang, v)}
                errorEn={errors["title.en"]}
                errorAr={errors["title.ar"]}
              />
              <BiField
                label="Hero Subtitle"
                rows={3}
                value={form.sub}
                onChange={(lang, v) => setBi("sub", lang, v)}
                errorEn={errors["sub.en"]}
                errorAr={errors["sub.ar"]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: OVERVIEW & MISSION */}
        {/* ============================================================== */}
        <TabsContent value="story" className="space-y-6 pt-4">
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-500" />
                Company Overview & Story
              </CardTitle>
              <CardDescription className="text-xs">
                The main company introduction paragraph and executive overview.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <BiField
                label="Overview Title"
                value={form.overviewT}
                onChange={(lang, v) => setBi("overviewT", lang, v)}
                errorEn={errors["overviewT.en"]}
                errorAr={errors["overviewT.ar"]}
              />
              <BiField
                label="Overview Description"
                rows={5}
                value={form.overviewD}
                onChange={(lang, v) => setBi("overviewD", lang, v)}
                errorEn={errors["overviewD.en"]}
                errorAr={errors["overviewD.ar"]}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-xs">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-500" />
                Vision & Mission Statements
              </CardTitle>
              <CardDescription className="text-xs">
                The guiding principles that define Integrated Technics' enterprise direction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <BiField
                  label="Vision Title"
                  value={form.visionT}
                  onChange={(lang, v) => setBi("visionT", lang, v)}
                />
                <BiField
                  label="Vision Description"
                  rows={3}
                  value={form.visionD}
                  onChange={(lang, v) => setBi("visionD", lang, v)}
                />
              </div>

              <div className="border-t pt-5 space-y-4">
                <BiField
                  label="Mission Title"
                  value={form.missionT}
                  onChange={(lang, v) => setBi("missionT", lang, v)}
                />
                <BiField
                  label="Mission Description"
                  rows={3}
                  value={form.missionD}
                  onChange={(lang, v) => setBi("missionD", lang, v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: KEY METRICS */}
        {/* ============================================================== */}
        <TabsContent value="metrics" className="space-y-6 pt-4">
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                  Key Statistics & Counter Metrics Bar
                </CardTitle>
                <CardDescription className="text-xs">
                  Customize the 4 counter metric cards displayed below the hero section on the About page.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {(form.stats && form.stats.length > 0 ? form.stats : DEFAULT_ABOUT_STATS).map((st, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-accent">Metric #{i + 1}</span>
                      <div className="w-28">
                        <Input
                          value={st.value}
                          placeholder="e.g. 20+"
                          className="font-bold text-sm h-8"
                          onChange={(e) => {
                            const current = [...(form.stats && form.stats.length > 0 ? form.stats : DEFAULT_ABOUT_STATS)];
                            current[i] = { ...current[i], value: e.target.value };
                            setForm({ ...form, stats: current });
                            setDirty(true);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Title (English & Arabic)</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={st.label?.en ?? ""}
                            placeholder="English Title"
                            className="text-xs h-8"
                            onChange={(e) => {
                              const current = [...(form.stats && form.stats.length > 0 ? form.stats : DEFAULT_ABOUT_STATS)];
                              current[i] = {
                                ...current[i],
                                label: { ...current[i].label, en: e.target.value },
                              };
                              setForm({ ...form, stats: current });
                              setDirty(true);
                            }}
                          />
                          <Input
                            value={st.label?.ar ?? ""}
                            dir="rtl"
                            placeholder="العنوان بالعربي"
                            className="text-xs h-8"
                            onChange={(e) => {
                              const current = [...(form.stats && form.stats.length > 0 ? form.stats : DEFAULT_ABOUT_STATS)];
                              current[i] = {
                                ...current[i],
                                label: { ...current[i].label, ar: e.target.value },
                              };
                              setForm({ ...form, stats: current });
                              setDirty(true);
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Subtitle (English & Arabic)</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={st.sub?.en ?? ""}
                            placeholder="English Subtitle"
                            className="text-xs h-8"
                            onChange={(e) => {
                              const current = [...(form.stats && form.stats.length > 0 ? form.stats : DEFAULT_ABOUT_STATS)];
                              current[i] = {
                                ...current[i],
                                sub: { ...current[i].sub, en: e.target.value },
                              };
                              setForm({ ...form, stats: current });
                              setDirty(true);
                            }}
                          />
                          <Input
                            value={st.sub?.ar ?? ""}
                            dir="rtl"
                            placeholder="الوصف الفرعي بالعربي"
                            className="text-xs h-8"
                            onChange={(e) => {
                              const current = [...(form.stats && form.stats.length > 0 ? form.stats : DEFAULT_ABOUT_STATS)];
                              current[i] = {
                                ...current[i],
                                sub: { ...current[i].sub, ar: e.target.value },
                              };
                              setForm({ ...form, stats: current });
                              setDirty(true);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 4: FOUNDER & LEADERSHIP */}
        {/* ============================================================== */}
        <TabsContent value="leadership" className="space-y-6 pt-4">
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-violet-500" />
                Leadership / Founder Photo & Message
              </CardTitle>
              <CardDescription className="text-xs">
                Profile and executive statement of the founder/managing director.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Founder Photo URL</Label>
                <Input
                  value={form.ownerImage ?? ""}
                  placeholder="https://integratedtechnics.com/.../founder.webp"
                  onChange={(e) => {
                    setForm({ ...form, ownerImage: e.target.value });
                    setDirty(true);
                  }}
                />
                <p className="text-xs text-muted-foreground">URL of the founder image displayed on the public About page.</p>
              </div>

              <BiField
                label="Owner — Eyebrow"
                value={form.ownerEyebrow}
                onChange={(lang, v) => setBi("ownerEyebrow", lang, v)}
              />

              <BiField
                label="Owner — Section Title"
                value={form.ownerTitle}
                onChange={(lang, v) => setBi("ownerTitle", lang, v)}
              />

              <BiField
                label="Owner — Name"
                value={form.ownerName}
                onChange={(lang, v) => setBi("ownerName", lang, v)}
                errorEn={errors["ownerName.en"]}
                errorAr={errors["ownerName.ar"]}
              />

              <BiField
                label="Owner — Role"
                value={form.ownerRole}
                onChange={(lang, v) => setBi("ownerRole", lang, v)}
                errorEn={errors["ownerRole.en"]}
                errorAr={errors["ownerRole.ar"]}
              />

              <BiField
                label="Owner — Bio & Statement"
                rows={5}
                value={form.ownerBio}
                onChange={(lang, v) => setBi("ownerBio", lang, v)}
                errorEn={errors["ownerBio.en"]}
                errorAr={errors["ownerBio.ar"]}
              />

              {/* Side-by-side Leadership Preview */}
              <div className="border-t pt-4">
                <div className="text-xs font-semibold text-muted-foreground mb-3">Live Bilingual Preview:</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <LeadershipPreview content={form} dir="ltr" />
                  <LeadershipPreview content={form} dir="rtl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 5: VALUES & CERTIFICATIONS */}
        {/* ============================================================== */}
        <TabsContent value="values" className="space-y-6 pt-4">
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Award className="h-4 w-4 text-cyan-500" />
                Core Values
              </CardTitle>
              <CardDescription className="text-xs">
                Key organizational values highlighting integrity, engineering excellence, and customer trust.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <BiField
                label="Values Section Title"
                value={form.valuesT}
                onChange={(lang, v) => setBi("valuesT", lang, v)}
              />

              <div className="space-y-4 pt-2">
                {form.values.map((v, idx) => (
                  <div key={idx} className="space-y-3 border rounded-xl p-4 bg-muted/10">
                    <div className="text-sm font-semibold text-accent">Value #{idx + 1}</div>
                    <BiField
                      label="Title"
                      value={v.title}
                      onChange={(lang, val) => setValue(idx, "title", lang, val)}
                      errorEn={errors[`values.${idx}.title.en`]}
                      errorAr={errors[`values.${idx}.title.ar`]}
                    />
                    <BiField
                      label="Description"
                      rows={3}
                      value={v.desc}
                      onChange={(lang, val) => setValue(idx, "desc", lang, val)}
                      errorEn={errors[`values.${idx}.desc.en`]}
                      errorAr={errors[`values.${idx}.desc.ar`]}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-xs">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-500" />
                Enterprise Certifications & Accreditations
              </CardTitle>
              <CardDescription className="text-xs">
                ISO standards and technical licenses demonstrated on the About page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BiField
                label="Certifications Title"
                value={form.certificationsT}
                onChange={(lang, v) => setBi("certificationsT", lang, v)}
              />
              <BiField
                label="Certifications Subtitle"
                rows={2}
                value={form.certificationsSub}
                onChange={(lang, v) => setBi("certificationsSub", lang, v)}
              />

              <div className="border-t pt-4 space-y-3">
                <Label className="text-xs font-semibold">Certifications Badges List</Label>
                {form.certifications.map((c, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        value={c}
                        onChange={(e) => updateCert(idx, e.target.value)}
                        placeholder="e.g. ISO 9001:2015 Quality Certified"
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCert(idx)}
                        aria-label="remove"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {errors[`certifications.${idx}`] && (
                      <p className="text-xs text-destructive">{errors[`certifications.${idx}`]}</p>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addCert} className="text-xs">
                  <Plus className="h-3.5 w-3.5 me-1.5" /> Add Certification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 6: TEAM MEMBERS */}
        {/* ============================================================== */}
        <TabsContent value="team" className="space-y-6 pt-4">
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Users className="h-4 w-4 text-rose-500" />
                Team Section Header
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BiField
                label="Team Section Title"
                value={form.teamTitle}
                onChange={(lang, v) => setBi("teamTitle", lang, v)}
              />
              <BiField
                label="Team Section Subtitle"
                rows={2}
                value={form.teamSub}
                onChange={(lang, v) => setBi("teamSub", lang, v)}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  Team Profiles Directory
                  <Badge variant="secondary" className="text-xs font-normal">
                    {form.team.length} {form.team.length === 1 ? "member" : "members"}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Drag the <GripVertical className="inline h-3.5 w-3.5" /> handle or use the arrow buttons to reorder. Table view is active by default.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5">
                  <Button
                    type="button"
                    variant={teamViewMode === "table" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-2.5 text-xs gap-1.5 shadow-none"
                    onClick={() => setTeamViewMode("table")}
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                    <span>Table</span>
                  </Button>
                  <Button
                    type="button"
                    variant={teamViewMode === "cards" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-2.5 text-xs gap-1.5 shadow-none"
                    onClick={() => setTeamViewMode("cards")}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Cards</span>
                  </Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenAddMember}
                  className="text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5 me-1.5" /> Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {teamViewMode === "table" ? (
                form.team.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-xl">
                    <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">No team members added yet.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOpenAddMember}
                      className="mt-3 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 me-1.5" /> Add First Member
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-[110px] text-xs"># / Order</TableHead>
                            <TableHead className="w-[50px] text-xs">Photo</TableHead>
                            <TableHead className="text-xs">Name (EN / AR)</TableHead>
                            <TableHead className="text-xs">Role (EN / AR)</TableHead>
                            <TableHead className="w-[130px] text-xs">Key</TableHead>
                            <TableHead className="w-[90px] text-xs">Status</TableHead>
                            <TableHead className="w-[100px] text-end text-xs">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {form.team.map((m, idx) => {
                            const hasErrors =
                              errors[`team.${idx}.key`] ||
                              errors[`team.${idx}.name.en`] ||
                              errors[`team.${idx}.name.ar`] ||
                              errors[`team.${idx}.role.en`] ||
                              errors[`team.${idx}.role.ar`];
                            const isDragging = dragIndex === idx;
                            const isDropTarget = dragOverIndex === idx && dragIndex !== null && dragIndex !== idx;

                            return (
                              <TableRow
                                key={idx}
                                draggable
                                onDragStart={(e) => {
                                  setDragIndex(idx);
                                  e.dataTransfer.effectAllowed = "move";
                                  try { e.dataTransfer.setData("text/plain", String(idx)); } catch {}
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = "move";
                                  if (dragOverIndex !== idx) setDragOverIndex(idx);
                                }}
                                onDragLeave={() => {
                                  if (dragOverIndex === idx) setDragOverIndex(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (dragIndex !== null && dragIndex !== idx) moveTeamMember(dragIndex, idx);
                                  setDragIndex(null);
                                  setDragOverIndex(null);
                                }}
                                onDragEnd={() => {
                                  setDragIndex(null);
                                  setDragOverIndex(null);
                                }}
                                className={`transition-colors ${
                                  isDragging ? "opacity-50" : ""
                                } ${isDropTarget ? "bg-accent/15 border-y-2 border-accent" : ""}`}
                              >
                                <TableCell className="font-mono text-xs py-2.5">
                                  <div className="flex items-center gap-1">
                                    <span
                                      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5"
                                      aria-label="Drag to reorder"
                                      title="Drag to reorder"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </span>
                                    <span className="text-muted-foreground w-4 text-center">{idx + 1}</span>
                                    <div className="flex flex-col">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveTeamMember(idx, idx - 1)}
                                        disabled={idx === 0}
                                        aria-label="Move up"
                                        title="Move up"
                                        className="h-4 w-4 p-0"
                                      >
                                        <ArrowUp className="h-2.5 w-2.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveTeamMember(idx, idx + 1)}
                                        disabled={idx === form.team.length - 1}
                                        aria-label="Move down"
                                        title="Move down"
                                        className="h-4 w-4 p-0"
                                      >
                                        <ArrowDown className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5">
                                  {m.image ? (
                                    <img
                                      src={m.image}
                                      alt={m.name.en || `Member ${idx + 1}`}
                                      className="h-8 w-8 rounded-full object-cover border shadow-2xs"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-semibold">
                                      {m.name.en ? m.name.en.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <div className="font-medium text-foreground text-xs leading-snug">
                                    {m.name.en || <span className="text-muted-foreground italic">Untitled</span>}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground leading-snug mt-0.5" dir="rtl">
                                    {m.name.ar || <span className="text-muted-foreground/60 italic">—</span>}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <div className="text-xs text-foreground leading-snug">
                                    {m.role.en || <span className="text-muted-foreground italic">—</span>}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground leading-snug mt-0.5" dir="rtl">
                                    {m.role.ar || <span className="text-muted-foreground/60 italic">—</span>}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <code className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                    {m.key || "—"}
                                  </code>
                                </TableCell>
                                <TableCell className="py-2.5">
                                  {hasErrors ? (
                                    <Badge variant="destructive" className="text-[10px] gap-1 px-1.5 py-0 font-normal">
                                      <AlertCircle className="h-3 w-3" /> Issues
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">
                                      Valid
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="py-2.5 text-end">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleOpenEditMember(idx)}
                                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                      title="Edit Member"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setForm({ ...form, team: form.team.filter((_, i) => i !== idx) });
                                        setDirty(true);
                                      }}
                                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                      title="Remove Member"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {form.team.map((m, idx) => {
                    const isDragging = dragIndex === idx;
                    const isDropTarget = dragOverIndex === idx && dragIndex !== null && dragIndex !== idx;
                    return (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => {
                          setDragIndex(idx);
                          e.dataTransfer.effectAllowed = "move";
                          try { e.dataTransfer.setData("text/plain", String(idx)); } catch {}
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dragOverIndex !== idx) setDragOverIndex(idx);
                        }}
                        onDragLeave={() => {
                          if (dragOverIndex === idx) setDragOverIndex(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragIndex !== null && dragIndex !== idx) moveTeamMember(dragIndex, idx);
                          setDragIndex(null);
                          setDragOverIndex(null);
                        }}
                        onDragEnd={() => {
                          setDragIndex(null);
                          setDragOverIndex(null);
                        }}
                        className={`space-y-3 border rounded-xl p-4 bg-card transition ${
                          isDragging ? "opacity-50" : ""
                        } ${isDropTarget ? "ring-2 ring-accent border-accent" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                              aria-label="Drag to reorder"
                              title="Drag to reorder"
                            >
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <div className="text-sm font-semibold">Member #{idx + 1}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => moveTeamMember(idx, idx - 1)}
                              disabled={idx === 0}
                              aria-label="Move up"
                              title="Move up"
                              className="h-7 w-7"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => moveTeamMember(idx, idx + 1)}
                              disabled={idx === form.team.length - 1}
                              aria-label="Move down"
                              title="Move down"
                              className="h-7 w-7"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setForm({ ...form, team: form.team.filter((_, i) => i !== idx) });
                                setDirty(true);
                              }}
                              aria-label="Remove member"
                              title="Remove"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Key Identifier (e.g. ceo, cto, vp_eng)</Label>
                            <Input
                              value={m.key}
                              onChange={(e) => {
                                const team = form.team.map((t, i) => i === idx ? { ...t, key: e.target.value } : t);
                                setForm({ ...form, team });
                                setDirty(true);
                              }}
                              aria-invalid={!!errors[`team.${idx}.key`]}
                              className={`text-xs ${errors[`team.${idx}.key`] ? "border-destructive" : ""}`}
                            />
                            {errors[`team.${idx}.key`] && (
                              <p className="text-xs text-destructive">{errors[`team.${idx}.key`]}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Photo URL (optional)</Label>
                            <Input
                              value={m.image ?? ""}
                              placeholder="https://... or image URL"
                              className="text-xs"
                              onChange={(e) => {
                                const team = form.team.map((t, i) => i === idx ? { ...t, image: e.target.value } : t);
                                setForm({ ...form, team });
                                setDirty(true);
                              }}
                            />
                          </div>
                        </div>

                        <BiField
                          label="Member Name"
                          value={m.name}
                          onChange={(lang, v) => {
                            const team = form.team.map((t, i) => i === idx ? { ...t, name: { ...t.name, [lang]: v } } : t);
                            setForm({ ...form, team });
                            setDirty(true);
                          }}
                          errorEn={errors[`team.${idx}.name.en`]}
                          errorAr={errors[`team.${idx}.name.ar`]}
                        />

                        <BiField
                          label="Member Role"
                          value={m.role}
                          onChange={(lang, v) => {
                            const team = form.team.map((t, i) => i === idx ? { ...t, role: { ...t.role, [lang]: v } } : t);
                            setForm({ ...form, team });
                            setDirty(true);
                          }}
                          errorEn={errors[`team.${idx}.role.en`]}
                          errorAr={errors[`team.${idx}.role.ar`]}
                        />
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAddMember}
                    className="text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 me-1.5" /> Add Team Member
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add / Edit Member Modal Dialog */}
          <Dialog open={teamModalOpen} onOpenChange={setTeamModalOpen}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingTeamIdx !== null ? `Edit Team Member #${editingTeamIdx + 1}` : "Add Team Member"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Configure member profile details in English and Arabic, unique key identifier, and photo URL.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Key Identifier (e.g. ceo, cto, vp_eng) *</Label>
                    <Input
                      value={memberForm.key}
                      onChange={(e) => setMemberForm({ ...memberForm, key: e.target.value })}
                      placeholder="e.g. founder_ceo"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Photo URL (optional)</Label>
                    <div className="flex gap-2 items-center">
                      {memberForm.image ? (
                        <img
                          src={memberForm.image}
                          alt="Preview"
                          className="h-8 w-8 rounded-full object-cover border flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : null}
                      <Input
                        value={memberForm.image ?? ""}
                        placeholder="https://... or image URL"
                        className="text-xs flex-1"
                        onChange={(e) => setMemberForm({ ...memberForm, image: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <BiField
                  label="Member Name"
                  value={memberForm.name}
                  onChange={(lang, v) =>
                    setMemberForm({
                      ...memberForm,
                      name: { ...memberForm.name, [lang]: v },
                    })
                  }
                />

                <BiField
                  label="Member Role"
                  value={memberForm.role}
                  onChange={(lang, v) =>
                    setMemberForm({
                      ...memberForm,
                      role: { ...memberForm.role, [lang]: v },
                    })
                  }
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setTeamModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveMember}>
                  {editingTeamIdx !== null ? "Save Changes" : "Add Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Bottom Save and Reset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => void onSave()}
            disabled={saving || !isAdmin || errorCount > 0}
            className="shadow-xs"
          >
            {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            Save Changes
          </Button>

          <Button type="button" variant="outline" onClick={onResetText}>
            <RotateCcw className="h-4 w-4 me-2" /> Reset Text to Defaults
          </Button>
        </div>

        {errorCount > 0 && (
          <span className="text-xs text-destructive font-medium flex items-center gap-1.5">
            <CircleAlert className="h-4 w-4" /> Please resolve {errorCount} validation issues before publishing.
          </span>
        )}
      </div>
    </div>
  );
}

function BiField({
  label,
  value,
  onChange,
  rows,
  errorEn,
  errorAr,
}: {
  label: string;
  value: Bilingual;
  onChange: (lang: "en" | "ar", v: string) => void;
  rows?: number;
  errorEn?: string;
  errorAr?: string;
}) {
  return (
    <div className={rows ? "space-y-4" : "grid md:grid-cols-2 gap-4"}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>{label} (English)</Label>
          {rows && <span className="text-xs text-muted-foreground">Rich Text (LTR)</span>}
        </div>
        {rows ? (
          <RichTextEditor
            dir="ltr"
            value={value.en}
            onChange={(v) => onChange("en", v)}
            placeholder={`Write ${label} in English...`}
            className={errorEn ? "border-destructive ring-destructive" : ""}
          />
        ) : (
          <Input
            dir="ltr"
            value={value.en}
            onChange={(e) => onChange("en", e.target.value)}
            aria-invalid={!!errorEn}
            className={errorEn ? "border-destructive" : ""}
          />
        )}
        {errorEn && <p className="text-xs text-destructive">{errorEn}</p>}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>{label} (عربي)</Label>
          {rows && <span className="text-xs text-muted-foreground">محرر نصوص منسقة (RTL)</span>}
        </div>
        {rows ? (
          <RichTextEditor
            dir="rtl"
            value={value.ar}
            onChange={(v) => onChange("ar", v)}
            placeholder={`اكتب ${label} بالعربية...`}
            className={errorAr ? "border-destructive ring-destructive" : ""}
          />
        ) : (
          <Input
            dir="rtl"
            value={value.ar}
            onChange={(e) => onChange("ar", e.target.value)}
            aria-invalid={!!errorAr}
            className={errorAr ? "border-destructive" : ""}
          />
        )}
        {errorAr && <p className="text-xs text-destructive">{errorAr}</p>}
      </div>
    </div>
  );
}

function HeroSidePreview({
  hero,
  dir,
  content,
  src,
}: {
  hero: AboutHero;
  dir: "ltr" | "rtl";
  content: AboutContent;
  src: string | null;
}) {
  const isRtl = dir === "rtl";
  const shouldMirror = isRtl && hero.mirror_rtl;
  const lang = isRtl ? "ar" : "en";
  return (
    <div dir={dir} className="rounded-xl border overflow-hidden bg-card shadow-2xs">
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {src ? (
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: `${hero.focal_x}% ${hero.focal_y}%`,
              transform: `scale(${hero.zoom})${shouldMirror ? " scaleX(-1)" : ""}`,
              transformOrigin: `${hero.focal_x}% ${hero.focal_y}%`,
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className={`absolute inset-x-0 bottom-0 p-4 text-white ${isRtl ? "text-right" : "text-left"}`}>
          <p className="text-[10px] uppercase tracking-wider opacity-80">{content.eyebrow[lang] || "—"}</p>
          <h3 className="font-display text-lg font-bold leading-tight line-clamp-2 mt-1">{content.title[lang] || "—"}</h3>
        </div>
        <span className="absolute top-2 start-2 rounded bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 uppercase">
          {dir}
        </span>
      </div>
    </div>
  );
}

function LeadershipPreview({ content, dir }: { content: AboutContent; dir: "ltr" | "rtl" }) {
  const isRtl = dir === "rtl";
  const lang = isRtl ? "ar" : "en";
  const pick = (b: Bilingual) => (b?.[lang]?.trim() || b?.[isRtl ? "en" : "ar"] || "—");
  return (
    <div dir={dir} lang={lang} className="rounded-xl border bg-card p-5 shadow-2xs">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-2">
        {pick(content.ownerEyebrow)}
      </div>
      <h3 className="font-display text-lg font-bold mb-2 leading-tight">{pick(content.ownerTitle)}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6 mb-3">{pick(content.ownerBio)}</p>
      <div className="border-t pt-3">
        <p className="font-semibold text-sm">{pick(content.ownerName)}</p>
        <p className="text-xs text-muted-foreground">{pick(content.ownerRole)}</p>
      </div>
      <span className="mt-3 inline-block rounded bg-muted text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 uppercase">
        {dir}
      </span>
    </div>
  );
}
