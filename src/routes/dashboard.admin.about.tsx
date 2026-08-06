import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAboutContent, defaultAboutContent, defaultHero, withCacheBust, type AboutContent, type AboutHero, type Bilingual, type TeamMember } from "@/lib/about-store";
import { supabase } from "@/integrations/supabase/client";
import { RotateCcw, Plus, Trash2, Upload, Loader2, Image as ImageIcon, ShieldAlert, Check, CircleAlert, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialHydratedRef = useRef(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => { setForm(content); }, [content]);
  useEffect(() => { setHeroForm(hero); }, [hero]);

  const errors = useMemo(() => validate(form, heroForm), [form, heroForm]);
  const errorCount = Object.keys(errors).length;

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
      if (!opts.silent) toast.success("About page saved");
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
    setForm(defaultAboutContent);
    setDirty(true);
    toast.message("Text reset — click Save to publish.");
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
      // Hashed path = built-in cache bust (new path = new URL).
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

  const biKeys: { key: keyof AboutContent; label: string; rows?: number }[] = [
    { key: "eyebrow", label: "Eyebrow / Tagline" },
    { key: "title", label: "Hero Title" },
    { key: "sub", label: "Hero Subtitle", rows: 3 },
    { key: "overviewT", label: "Overview Title" },
    { key: "overviewD", label: "Overview Description", rows: 5 },
    { key: "visionT", label: "Vision Title" },
    { key: "visionD", label: "Vision Description", rows: 3 },
    { key: "missionT", label: "Mission Title" },
    { key: "missionD", label: "Mission Description", rows: 3 },
    { key: "valuesT", label: "Values Section Title" },
    { key: "certificationsT", label: "Certifications Title" },
    { key: "certificationsSub", label: "Certifications Subtitle", rows: 2 },
    { key: "ownerEyebrow", label: "Owner — Eyebrow" },
    { key: "ownerTitle", label: "Owner — Section Title" },
    { key: "ownerName", label: "Owner — Name" },
    { key: "ownerRole", label: "Owner — Role" },
    { key: "ownerBio", label: "Owner — Bio", rows: 5 },
    { key: "teamTitle", label: "Team Section Title" },
    { key: "teamSub", label: "Team Section Subtitle", rows: 2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">About Page</h1>
        <p className="text-sm text-muted-foreground mt-1">Edit the public About page content (English & Arabic). Saved to your backend and synced across devices.</p>
        {loading && <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</p>}
      </div>

      {!isAdmin && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-destructive">Admin role required</p>
            <p className="text-muted-foreground text-xs mt-1">You can browse the editor, but saving and uploading are disabled. Sign in with an admin account that has the admin role assigned in your database.</p>
          </div>
        </div>
      )}

      {/* Status bar: autosave, validation, last saved */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            <span>Autosave</span>
          </label>
          {saving && <span className="text-muted-foreground inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>}
          {!saving && dirty && <span className="text-amber-600 dark:text-amber-400 text-xs">Unsaved changes</span>}
          {!saving && !dirty && lastSavedAt && (
            <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 text-xs">
              <Check className="h-3 w-3" /> Saved {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
        {errorCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
            <CircleAlert className="h-3.5 w-3.5" /> {errorCount} validation issue{errorCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Hero Image</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            ref={previewRef}
            onClick={heroForm.image_url ? onPreviewClick : undefined}
            className="relative w-full aspect-[16/7] rounded-lg border bg-muted overflow-hidden select-none"
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
          <p className="text-xs text-muted-foreground">Click anywhere on the image to set the focal point (the area kept centered when cropped).</p>

          {/* Side-by-side LTR / RTL preview */}
          {heroForm.image_url && (
            <div className="grid md:grid-cols-2 gap-4">
              <HeroSidePreview hero={heroForm} dir="ltr" content={form} src={previewSrc} />
              <HeroSidePreview hero={heroForm} dir="rtl" content={form} src={previewSrc} />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading || !isAdmin}>
              {uploading ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Upload className="h-4 w-4 me-2" />}
              {heroForm.image_url ? "Replace image" : "Upload image"}
            </Button>
            {heroForm.image_url && (
              <Button type="button" variant="ghost" onClick={() => updateHero({ image_url: null })} disabled={!isAdmin}>
                <Trash2 className="h-4 w-4 me-2" /> Remove
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

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm">Zoom ({heroForm.zoom.toFixed(2)}x)</Label>
              <Slider
                min={1}
                max={3}
                step={0.05}
                value={[heroForm.zoom]}
                onValueChange={([v]) => updateHero({ zoom: v })}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <Label className="text-sm">Mirror image in Arabic (RTL)</Label>
                <p className="text-xs text-muted-foreground">Flips the image horizontally so it visually balances RTL layouts.</p>
              </div>
              <Switch
                checked={heroForm.mirror_rtl}
                onCheckedChange={(v) => updateHero({ mirror_rtl: v })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div>Focal X: {heroForm.focal_x.toFixed(0)}%</div>
            <div>Focal Y: {heroForm.focal_y.toFixed(0)}%</div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setHeroForm({ ...defaultHero, image_url: heroForm.image_url }); setDirty(true); }}>
            <RotateCcw className="h-4 w-4 me-2" /> Reset positioning
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Sections</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {biKeys.map(({ key, label, rows }) => (
            <BiField
              key={key}
              label={label}
              rows={rows}
              value={form[key] as Bilingual}
              onChange={(lang, v) => setBi(key, lang, v)}
              errorEn={errors[`${String(key)}.en`]}
              errorAr={errors[`${String(key)}.ar`]}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Leadership / Founder — Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <LeadershipPreview content={form} dir="ltr" />
            <LeadershipPreview content={form} dir="rtl" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Reflects the Owner fields above in real time. Arabic side renders right-to-left.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Core Values</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {form.values.map((v, idx) => (
            <div key={idx} className="space-y-3 border rounded-lg p-4">
              <div className="text-sm font-medium">Value {idx + 1}</div>
              <BiField label="Title" value={v.title} onChange={(lang, val) => setValue(idx, "title", lang, val)}
                errorEn={errors[`values.${idx}.title.en`]} errorAr={errors[`values.${idx}.title.ar`]} />
              <BiField label="Description" rows={3} value={v.desc} onChange={(lang, val) => setValue(idx, "desc", lang, val)}
                errorEn={errors[`values.${idx}.desc.en`]} errorAr={errors[`values.${idx}.desc.ar`]} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Certifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {form.certifications.map((c, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex gap-2">
                <Input value={c} onChange={(e) => updateCert(idx, e.target.value)} placeholder="e.g. ISO 9001" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCert(idx)} aria-label="remove">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {errors[`certifications.${idx}`] && (
                <p className="text-xs text-destructive">{errors[`certifications.${idx}`]}</p>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addCert}>
            <Plus className="h-4 w-4 me-2" /> Add certification
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Team Members</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <p className="text-xs text-muted-foreground -mt-2">
            Drag the <GripVertical className="inline h-3 w-3" /> handle to reorder, or use the arrow buttons. The order here controls how members appear on the public About page.
          </p>
          {form.team.map((m, idx) => {
            const moveTo = (to: number) => {
              if (to < 0 || to >= form.team.length || to === idx) return;
              const next = form.team.slice();
              const [item] = next.splice(idx, 1);
              next.splice(to, 0, item);
              setForm({ ...form, team: next });
              setDirty(true);
            };
            const isDragging = dragIndex === idx;
            const isDropTarget = dragOverIndex === idx && dragIndex !== null && dragIndex !== idx;
            return (
              <div
                key={idx}
                draggable
                onDragStart={(e) => { setDragIndex(idx); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(idx)); } catch {} }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverIndex !== idx) setDragOverIndex(idx); }}
                onDragLeave={() => { if (dragOverIndex === idx) setDragOverIndex(null); }}
                onDrop={(e) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== idx) moveTo(idx); setDragIndex(null); setDragOverIndex(null); }}
                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                className={`space-y-3 border rounded-lg p-4 bg-card transition ${isDragging ? "opacity-50" : ""} ${isDropTarget ? "ring-2 ring-accent border-accent" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground" aria-label="Drag to reorder" title="Drag to reorder">
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <div className="text-sm font-medium">Member {idx + 1}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveTo(idx - 1)} disabled={idx === 0} aria-label="Move up" title="Move up">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveTo(idx + 1)} disabled={idx === form.team.length - 1} aria-label="Move down" title="Move down">
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => { setForm({ ...form, team: form.team.filter((_, i) => i !== idx) }); setDirty(true); }} aria-label="Remove member" title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Key (used to map image asset, e.g. ceo, cto)</Label>
                  <Input
                    value={m.key}
                    onChange={(e) => { const team = form.team.map((t, i) => i === idx ? { ...t, key: e.target.value } : t); setForm({ ...form, team }); setDirty(true); }}
                    aria-invalid={!!errors[`team.${idx}.key`]}
                    className={errors[`team.${idx}.key`] ? "border-destructive" : ""}
                  />
                  {errors[`team.${idx}.key`] && <p className="text-xs text-destructive">{errors[`team.${idx}.key`]}</p>}
                </div>
                <BiField label="Name" value={m.name}
                  onChange={(lang, v) => { const team = form.team.map((t, i) => i === idx ? { ...t, name: { ...t.name, [lang]: v } } : t); setForm({ ...form, team }); setDirty(true); }}
                  errorEn={errors[`team.${idx}.name.en`]} errorAr={errors[`team.${idx}.name.ar`]} />
                <BiField label="Role" value={m.role}
                  onChange={(lang, v) => { const team = form.team.map((t, i) => i === idx ? { ...t, role: { ...t.role, [lang]: v } } : t); setForm({ ...form, team }); setDirty(true); }}
                  errorEn={errors[`team.${idx}.role.en`]} errorAr={errors[`team.${idx}.role.ar`]} />
              </div>
            );
          })}
          <Button type="button" variant="outline" size="sm" onClick={() => { const next: TeamMember = { key: `member-${form.team.length + 1}`, name: { en: "", ar: "" }, role: { en: "", ar: "" } }; setForm({ ...form, team: [...form.team, next] }); setDirty(true); }}>
            <Plus className="h-4 w-4 me-2" /> Add team member
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void onSave()} disabled={saving || !isAdmin || errorCount > 0}>
          {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
          Save changes
        </Button>
        <Button type="button" variant="outline" onClick={onResetText}>
          <RotateCcw className="h-4 w-4 me-2" /> Reset text to defaults
        </Button>
      </div>
    </div>
  );
}

function BiField({ label, value, onChange, rows, errorEn, errorAr }: { label: string; value: Bilingual; onChange: (lang: "en" | "ar", v: string) => void; rows?: number; errorEn?: string; errorAr?: string }) {
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
          <Input dir="ltr" value={value.en} onChange={(e) => onChange("en", e.target.value)} aria-invalid={!!errorEn} className={errorEn ? "border-destructive" : ""} />
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
          <Input dir="rtl" value={value.ar} onChange={(e) => onChange("ar", e.target.value)} aria-invalid={!!errorAr} className={errorAr ? "border-destructive" : ""} />
        )}
        {errorAr && <p className="text-xs text-destructive">{errorAr}</p>}
      </div>
    </div>
  );
}

function HeroSidePreview({ hero, dir, content, src }: { hero: AboutHero; dir: "ltr" | "rtl"; content: AboutContent; src: string | null }) {
  const isRtl = dir === "rtl";
  const shouldMirror = isRtl && hero.mirror_rtl;
  const lang = isRtl ? "ar" : "en";
  return (
    <div dir={dir} className="rounded-lg border overflow-hidden bg-card">
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
        <span className="absolute top-2 start-2 rounded bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 uppercase">{dir}</span>
      </div>
    </div>
  );
}

function LeadershipPreview({ content, dir }: { content: AboutContent; dir: "ltr" | "rtl" }) {
  const isRtl = dir === "rtl";
  const lang = isRtl ? "ar" : "en";
  const pick = (b: Bilingual) => (b?.[lang]?.trim() || b?.[isRtl ? "en" : "ar"] || "—");
  return (
    <div dir={dir} lang={lang} className="rounded-lg border bg-card p-5">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-2">{pick(content.ownerEyebrow)}</div>
      <h3 className="font-display text-lg font-bold mb-2 leading-tight">{pick(content.ownerTitle)}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6 mb-3">{pick(content.ownerBio)}</p>
      <div className="border-t pt-3">
        <p className="font-semibold text-sm">{pick(content.ownerName)}</p>
        <p className="text-xs text-muted-foreground">{pick(content.ownerRole)}</p>
      </div>
      <span className="mt-3 inline-block rounded bg-muted text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 uppercase">{dir}</span>
    </div>
  );
}
