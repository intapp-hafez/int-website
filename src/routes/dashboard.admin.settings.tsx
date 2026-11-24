import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, memo, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSettings, type SiteSettings, type InvoiceWatermark, type OfficeBranch, defaultHeroConfig } from "@/lib/settings-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, RotateCcw, Download, Upload, History, Trash2, Loader2, Building2, Plus, Sparkles, ShieldCheck, Headphones, Award as AwardIcon, Clock as ClockIcon, Star as StarIcon, Zap, Image as ImageIcon, ExternalLink, Play } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { toast } from "sonner";
import { ChevronDown, Menu as MenuIcon, Home, Info, Briefcase, Layers as LayersIcon, Phone, ShoppingCart, Search } from "lucide-react";
import { services as servicesData } from "@/data/site";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { TurnstileSettingsCard } from "@/components/admin/TurnstileSettingsCard";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/admin/settings")({
  head: () => ({ meta: [{ title: "Site Settings — Admin" }] }),
  component: SettingsPage,
});

function HeroImageUpload({ onUploaded, label = "image" }: { onUploaded: (url: string) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    if (busy) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const path = `hero/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("about-images").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("about-images").getPublicUrl(path);
      onUploaded(data.publicUrl);
      toast.success(`${label} uploaded successfully.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" aria-label={`Upload ${label}`} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) void upload(file);
      }} />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()} className="text-xs gap-1.5 h-8">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {busy ? "Uploading…" : "Upload"}
      </Button>
    </>
  );
}

function SettingsPage() {
  const { settings, loading, update, reset } = useSettings();
  const [form, _setForm] = useState<SiteSettings>(settings);
  const isDirty = useRef(false);

  const setForm = (next: SiteSettings | ((prev: SiteSettings) => SiteSettings)) => {
    isDirty.current = true;
    _setForm(next);
  };

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t: at } = useAdminT();
  const { lang } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  type BackupSnapshot = { id: string; at: string; payload: Record<string, unknown> };
  const HISTORY_KEY = "it_backups_v1";
  const [history, setHistory] = useState<BackupSnapshot[]>([]);
  const [pending, setPending] = useState<{ source: "history" | "file"; payload: Record<string, unknown>; label: string } | null>(null);

  // Sync form state when database settings load or change in real-time, unless user has local unsaved edits
  useEffect(() => {
    if (!isDirty.current) {
      _setForm(settings);
    }
  }, [settings]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const persistHistory = (list: BackupSnapshot[]) => {
    setHistory(list);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch {}
  };

  const BACKUP_KEYS = [
    "it_site_settings_v2",
    "it_projects_store",
    "it_user_perms_v1",
    "it_perm_presets_v1",
  ] as const;

  const onTakeBackup = () => {
    const payload: Record<string, unknown> = { __meta: { app: "it-admin", at: new Date().toISOString(), v: 1 } };
    for (const k of BACKUP_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        payload[k] = raw ? JSON.parse(raw) : null;
      } catch { payload[k] = null; }
    }
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const snap: BackupSnapshot = { id: crypto.randomUUID(), at: new Date().toISOString(), payload };
    persistHistory([snap, ...history].slice(0, 20));
    toast.success(at("backupTaken"));
  };

  const requestRestoreFromFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const hasAny = BACKUP_KEYS.some((k) => k in parsed);
      if (!hasAny) throw new Error("empty");
      setPending({ source: "file", payload: parsed, label: file.name });
    } catch {
      toast.error(at("backupInvalid"));
    }
  };

  const applyRestore = (payload: Record<string, unknown>) => {
    let restored = 0;
    for (const k of BACKUP_KEYS) {
      if (k in payload && payload[k] != null) {
        localStorage.setItem(k, JSON.stringify(payload[k]));
        restored++;
      }
    }
    if (restored === 0) {
      toast.error(at("backupInvalid"));
      return;
    }
    toast.success(at("backupRestored"));
    setTimeout(() => window.location.reload(), 600);
  };

  const deleteSnapshot = (id: string) => {
    persistHistory(history.filter((h) => h.id !== id));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }
    if (!form.address.en.trim() && !form.address.ar.trim()) {
      toast.error("Please provide an address (English or Arabic).");
      return;
    }

    setSaving(true);
    try {
      await update(form);
      isDirty.current = false;
      setSaved(true);
      toast.success("Settings saved — synced across the database and site in real time.");
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      toast.error(err?.message || "Could not save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateBranch = (index: number, patch: Partial<OfficeBranch>) => {
    const list = [...(form.branches || [])];
    list[index] = { ...list[index], ...patch };
    setForm({ ...form, branches: list });
  };

  const setBranchMain = (index: number, isMain: boolean) => {
    const list = (form.branches || []).map((b, i) => ({
      ...b,
      isMain: i === index ? isMain : (isMain ? false : b.isMain),
    }));
    setForm({ ...form, branches: list });
  };

  const addBranch = () => {
    const newBranch: OfficeBranch = {
      id: `branch-${Date.now()}`,
      name: { en: "New Branch", ar: "فرع جديد" },
      address: { en: "", ar: "" },
      phone: form.phone || "",
      email: form.email || "",
      isMain: (form.branches || []).length === 0,
    };
    setForm({ ...form, branches: [...(form.branches || []), newBranch] });
  };

  const removeBranch = (index: number) => {
    const list = (form.branches || []).filter((_, i) => i !== index);
    setForm({ ...form, branches: list });
  };

  const [tab, setTab] = useState<"security"|"contact"|"company"|"home"|"site"|"backup">("security");

  const onReset = async () => {
    if (confirm("Reset all settings to default values?")) {
      setSaving(true);
      try {
        await reset();
        isDirty.current = false;
        toast.success("Settings reset to defaults.");
      } catch (err: any) {
        toast.error(err?.message || "Failed to reset settings.");
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Site Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update the contact information and social links shown across the website header and footer.
          </p>
        </div>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Site Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Update the contact information and social links shown across the website header and footer.</p>
      </div>

      <div role="tablist" aria-label="Settings sections" className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
        {([["security","Security"],["contact","Contact"],["company","Company & Invoice"],["home","Homepage"],["site","Site & Navigation"],["backup","Backup"]] as const).map(([k,l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab===k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab===k?"bg-background shadow font-semibold text-foreground":"text-muted-foreground hover:text-foreground"}`}>{l}</button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {tab === "security" && (
          <div className="space-y-6">
            <TurnstileSettingsCard />
          </div>
        )}

        {tab === "contact" && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="font-display text-lg">Contact</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <Field label="Email" id="email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Phone" id="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <Field label="Sales email" id="sales_email" type="email" value={form.salesEmail} onChange={(v) => setForm({ ...form, salesEmail: v })} hint="Shown on the Contact page as the sales department address." />
                <Field label="Support email" id="support_email" type="email" value={form.supportEmail} onChange={(v) => setForm({ ...form, supportEmail: v })} hint="Shown on the Contact page as the technical support address." />
                <Field label="WhatsApp number" id="wa" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} hint="Digits with country code, e.g. +201007419344" />
                <Field label="Address (English)" id="address_en" value={form.address.en} onChange={(v) => setForm({ ...form, address: { ...form.address, en: v } })} />
                <Field label="العنوان (عربي)" id="address_ar" value={form.address.ar} onChange={(v) => setForm({ ...form, address: { ...form.address, ar: v } })} dir="rtl" />
              </CardContent>
            </Card>

            {/* Contact Page Hero Header & Working Hours */}
            <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Contact Page Content & Working Hours</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Field
              label="Header Badge (English)"
              id="c_badge_en"
              value={form.contactHeader?.badge?.en || ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  contactHeader: {
                    ...form.contactHeader,
                    badge: { ...form.contactHeader?.badge, en: v },
                  },
                })
              }
            />
            <Field
              label="شارة العنوان (عربي)"
              id="c_badge_ar"
              dir="rtl"
              value={form.contactHeader?.badge?.ar || ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  contactHeader: {
                    ...form.contactHeader,
                    badge: { ...form.contactHeader?.badge, ar: v },
                  },
                })
              }
            />
            <Field
              label="Hero Title (English)"
              id="c_title_en"
              value={form.contactHeader?.title?.en || ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  contactHeader: {
                    ...form.contactHeader,
                    title: { ...form.contactHeader?.title, en: v },
                  },
                })
              }
            />
            <Field
              label="العنوان الرئيسي (عربي)"
              id="c_title_ar"
              dir="rtl"
              value={form.contactHeader?.title?.ar || ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  contactHeader: {
                    ...form.contactHeader,
                    title: { ...form.contactHeader?.title, ar: v },
                  },
                })
              }
            />
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="c_sub_en">Hero Subtitle (English)</Label>
              <textarea
                id="c_sub_en"
                value={form.contactHeader?.subtitle?.en || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contactHeader: {
                      ...form.contactHeader,
                      subtitle: { ...form.contactHeader?.subtitle, en: e.target.value },
                    },
                  })
                }
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="c_sub_ar">الوصف الفرعي (عربي)</Label>
              <textarea
                id="c_sub_ar"
                dir="rtl"
                value={form.contactHeader?.subtitle?.ar || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contactHeader: {
                      ...form.contactHeader,
                      subtitle: { ...form.contactHeader?.subtitle, ar: e.target.value },
                    },
                  })
                }
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
              />
            </div>
            <Field
              label="Working Hours (English)"
              id="c_hours_en"
              value={form.contactHours?.en || ""}
              onChange={(v) => setForm({ ...form, contactHours: { ...form.contactHours, en: v } })}
              hint="Shown in the business hours card on /contact."
            />
            <Field
              label="مواعيد العمل (عربي)"
              id="c_hours_ar"
              dir="rtl"
              value={form.contactHours?.ar || ""}
              onChange={(v) => setForm({ ...form, contactHours: { ...form.contactHours, ar: v } })}
              hint="تظهر في بطاقة ساعات العمل في صفحة التواصل."
            />
          </CardContent>
        </Card>

        {/* Regional Branches Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Regional Branches / الفروع والمكاتب الإقليمية
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Manage physical branches and regional hubs shown on the Contact page sidebar.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addBranch}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Branch
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!form.branches || form.branches.length === 0) ? (
              <div className="text-center py-6 border border-dashed rounded-lg text-sm text-muted-foreground">
                No regional branches configured. Click "Add Branch" to add one.
              </div>
            ) : (
              form.branches.map((b, idx) => (
                <div key={b.id || idx} className="p-4 rounded-xl border bg-muted/20 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Branch #{idx + 1}
                      </span>
                      {b.isMain && (
                        <Badge className="text-[10px] py-0 h-5 bg-accent text-accent-foreground">
                          Main Headquarters / HQ
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!b.isMain}
                          onChange={(e) => setBranchMain(idx, e.target.checked)}
                          className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span>Set as HQ</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBranch(idx)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                        title="Remove Branch"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <Field
                      label="Branch Name (English)"
                      id={`branch_name_en_${idx}`}
                      value={b.name?.en || ""}
                      onChange={(v) => updateBranch(idx, { name: { ...b.name, en: v } })}
                      hint="e.g. Cairo Headquarters"
                    />
                    <Field
                      label="اسم الفرع (عربي)"
                      id={`branch_name_ar_${idx}`}
                      dir="rtl"
                      value={b.name?.ar || ""}
                      onChange={(v) => updateBranch(idx, { name: { ...b.name, ar: v } })}
                      hint="مثال: المقر الرئيسي — القاهرة"
                    />

                    <Field
                      label="Address (English)"
                      id={`branch_addr_en_${idx}`}
                      value={b.address?.en || ""}
                      onChange={(v) => updateBranch(idx, { address: { ...b.address, en: v } })}
                      hint="e.g. 15 Makram Ebeid, Nasr City, Cairo, Egypt"
                    />
                    <Field
                      label="العنوان (عربي)"
                      id={`branch_addr_ar_${idx}`}
                      dir="rtl"
                      value={b.address?.ar || ""}
                      onChange={(v) => updateBranch(idx, { address: { ...b.address, ar: v } })}
                      hint="مثال: 15 شارع مكرم عبيد، مدينة نصر، القاهرة، مصر"
                    />

                    <Field
                      label="Phone"
                      id={`branch_phone_${idx}`}
                      value={b.phone || ""}
                      onChange={(v) => updateBranch(idx, { phone: v })}
                      hint="e.g. +20 100 741 9344"
                    />
                    <Field
                      label="Email"
                      id={`branch_email_${idx}`}
                      type="email"
                      value={b.email || ""}
                      onChange={(v) => updateBranch(idx, { email: v })}
                      hint="e.g. info@integratedtechnics.com"
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Contact Page SEO */}
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Contact Page SEO</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Field label="Title (English)" id="cseo_title_en" value={form.contactSeo.title.en} onChange={(v) => setForm({ ...form, contactSeo: { ...form.contactSeo, title: { ...form.contactSeo.title, en: v } } })} hint="Recommended ≤ 60 characters." />
            <Field label="العنوان (عربي)" id="cseo_title_ar" dir="rtl" value={form.contactSeo.title.ar} onChange={(v) => setForm({ ...form, contactSeo: { ...form.contactSeo, title: { ...form.contactSeo.title, ar: v } } })} />
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cseo_desc_en">Description (English)</Label>
              <textarea id="cseo_desc_en" value={form.contactSeo.description.en} onChange={(e) => setForm({ ...form, contactSeo: { ...form.contactSeo, description: { ...form.contactSeo.description, en: e.target.value } } })} className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
              <p className="text-xs text-muted-foreground">Recommended ≤ 160 characters.</p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cseo_desc_ar">الوصف (عربي)</Label>
              <textarea id="cseo_desc_ar" dir="rtl" value={form.contactSeo.description.ar} onChange={(e) => setForm({ ...form, contactSeo: { ...form.contactSeo, description: { ...form.contactSeo.description, ar: e.target.value } } })} className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
            </div>
            <Field label="Open Graph image (English)" id="cseo_og_en" type="url" value={form.contactSeo.ogImage.en} onChange={(v) => setForm({ ...form, contactSeo: { ...form.contactSeo, ogImage: { ...form.contactSeo.ogImage, en: v } } })} hint="Absolute URL, 1200×630 recommended." />
            <Field label="صورة Open Graph (عربي)" id="cseo_og_ar" type="url" value={form.contactSeo.ogImage.ar} onChange={(v) => setForm({ ...form, contactSeo: { ...form.contactSeo, ogImage: { ...form.contactSeo.ogImage, ar: v } } })} dir="rtl" />
          </CardContent>
        </Card>
      </div>
    )}

    {tab === "company" && (
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">About & Location</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Field label="Address (English)" id="loc_addr_en" value={form.address.en} onChange={(v) => setForm({ ...form, address: { ...form.address, en: v } })} hint="Shared with the Contact card — edits update both." />
            <Field label="العنوان (عربي)" id="loc_addr_ar" value={form.address.ar} onChange={(v) => setForm({ ...form, address: { ...form.address, ar: v } })} dir="rtl" />
            <Field label="Public phone" id="loc_phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} hint="Shared with the Contact card." />
            <Field label="Public email" id="loc_email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} hint="Shared with the Contact card." />
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="bio_en">Short bio (English)</Label>
              <textarea
                id="bio_en"
                value={form.bio.en}
                onChange={(e) => setForm({ ...form, bio: { ...form.bio, en: e.target.value } })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">Shown in the site footer and switches automatically with the active language.</p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="bio_ar">نبذة قصيرة (عربي)</Label>
              <textarea
                id="bio_ar"
                dir="rtl"
                value={form.bio.ar}
                onChange={(e) => setForm({ ...form, bio: { ...form.bio, ar: e.target.value } })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <Field label="Latitude" id="loc_lat" type="number" value={String(form.coords.lat)} onChange={(v) => setForm({ ...form, coords: { ...form.coords, lat: Number(v) || 0 } })} hint="Used for the 'Get directions' link." />
            <Field label="Longitude" id="loc_lng" type="number" value={String(form.coords.lng)} onChange={(v) => setForm({ ...form, coords: { ...form.coords, lng: Number(v) || 0 } })} />
            <div className="md:col-span-2">
              <Field
                label="Map embed URL"
                id="map_url"
                type="url"
                value={form.mapUrl}
                onChange={(v) => setForm({ ...form, mapUrl: v })}
                hint="Paste a Google Maps embed URL (Share → Embed a map → copy the src). Shown on the Contact page."
              />
            </div>
            {form.mapUrl && (
              <div className="md:col-span-2">
                <Label>Preview</Label>
                <div className="mt-1.5 rounded-md overflow-hidden border">
                  {form.mapUrl.includes("/embed") || form.mapUrl.includes("output=embed") ? (
                    <iframe
                      src={form.mapUrl}
                      title="Map preview"
                      className="w-full h-64 border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="p-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">External Map Link Detected</div>
                        <div className="text-muted-foreground">
                          Direct links (e.g. <code className="text-[11px] bg-muted px-1 py-0.5 rounded">maps.app.goo.gl</code>) cannot be embedded in an iframe. For an interactive in-page map, use an embed URL (from Google Maps &rarr; Share &rarr; Embed a map).
                        </div>
                      </div>
                      <a
                        href={form.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-accent hover:underline font-medium shrink-0"
                      >
                        <span>Open in Google Maps</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <Label>Live preview</Label>
              <p className="text-xs text-muted-foreground mb-2">Reflects unsaved edits above. Save to publish site-wide.</p>
              <div className="rounded-lg border bg-muted/30 p-4 grid md:grid-cols-2 gap-4">
                <div className="space-y-2" dir="ltr">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">English</div>
                  <div className="text-sm font-medium">{form.address.en || <span className="text-muted-foreground italic">No address</span>}</div>
                  <div className="text-sm">{form.bio.en || <span className="text-muted-foreground italic">No bio</span>}</div>
                  <div className="text-sm">
                    <div>📞 {form.phone || <span className="text-muted-foreground italic">—</span>}</div>
                    <div>✉ {form.email || <span className="text-muted-foreground italic">—</span>}</div>
                  </div>
                </div>
                <div className="space-y-2" dir="rtl" lang="ar">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">العربية</div>
                  <div className="text-sm font-medium">{form.address.ar || <span className="text-muted-foreground italic">لا يوجد عنوان</span>}</div>
                  <div className="text-sm">{form.bio.ar || <span className="text-muted-foreground italic">لا توجد نبذة</span>}</div>
                  <div className="text-sm">
                    <div>📞 {form.phone || <span className="text-muted-foreground italic">—</span>}</div>
                    <div>✉ {form.email || <span className="text-muted-foreground italic">—</span>}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Social Links</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Field label="LinkedIn URL" id="li" type="url" value={form.social.linkedin} onChange={(v) => setForm({ ...form, social: { ...form.social, linkedin: v } })} />
            <Field label="Twitter / X URL" id="tw" type="url" value={form.social.twitter} onChange={(v) => setForm({ ...form, social: { ...form.social, twitter: v } })} />
            <Field label="Facebook URL" id="fb" type="url" value={form.social.facebook} onChange={(v) => setForm({ ...form, social: { ...form.social, facebook: v } })} />
            <Field label="Instagram URL" id="ig" type="url" value={form.social.instagram} onChange={(v) => setForm({ ...form, social: { ...form.social, instagram: v } })} />
            <Field label="YouTube URL" id="yt" type="url" value={form.social.youtube} onChange={(v) => setForm({ ...form, social: { ...form.social, youtube: v } })} />
          </CardContent>
        </Card>

        {/* Invoice */}
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Invoice</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wm">Default invoice watermark</Label>
              <Select value={form.invoiceWatermark} onValueChange={(v) => setForm({ ...form, invoiceWatermark: v as InvoiceWatermark })}>
                <SelectTrigger id="wm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                  <SelectItem value="copy">Copy</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Applied to all invoice PDFs and prints across the site.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    {tab === "home" && (
      <div className="space-y-6">
        {/* HOMEPAGE HERO CONFIGURATION */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Homepage Hero Section
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure hero visual assets, layout mode, call-to-action buttons, and value badges.
                </p>
              </div>
              <Badge variant="outline" className="text-xs capitalize">
                Mode: {form.hero?.mode || "showcase"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 1. Hero Mode */}
            <div className="space-y-3 pb-4 border-b">
              <Label className="text-sm font-semibold">Hero Layout Mode</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setForm({ ...form, hero: { ...(form.hero || defaultHeroConfig), mode: "showcase" } })}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    (form.hero?.mode || "showcase") === "showcase"
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-border hover:border-muted-foreground/40 bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm">Enterprise Showcase</span>
                    {(form.hero?.mode || "showcase") === "showcase" && (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Modern high-impact hero with interactive wheel, background asset, and value badges.
                  </p>
                </div>

                <div
                  onClick={() => setForm({ ...form, hero: { ...(form.hero || defaultHeroConfig), mode: "slider" } })}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    form.hero?.mode === "slider"
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-border hover:border-muted-foreground/40 bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm">Carousel Sliders</span>
                    {form.hero?.mode === "slider" && (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Multi-slide rotating carousel configured under Sliders Management.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Visual Assets (Background & Wheel) */}
            <div className="space-y-4 pb-4 border-b">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-accent" />
                Hero Visual Assets
              </h4>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Background Image */}
                <div className="space-y-2 rounded-xl border p-3.5 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Background Visual</Label>
                    <HeroImageUpload
                      label="Background image"
                      onUploaded={(url) =>
                        setForm({
                          ...form,
                          hero: { ...(form.hero || defaultHeroConfig), backgroundImage: url },
                        })
                      }
                    />
                  </div>
                  <Input
                    value={form.hero?.backgroundImage || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        hero: { ...(form.hero || defaultHeroConfig), backgroundImage: e.target.value },
                      })
                    }
                    placeholder="Custom background image URL (or leave blank for default)"
                    className="text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Image Fit</Label>
                      <Select
                        value={form.hero?.backgroundFit || "cover"}
                        onValueChange={(val: "contain" | "cover") =>
                          setForm({
                            ...form,
                            hero: { ...(form.hero || defaultHeroConfig), backgroundFit: val },
                          })
                        }
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cover (Fill Screen / Edge-to-Edge)</SelectItem>
                          <SelectItem value="contain">Contain (Letterbox / Scaled)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <Label className="text-[11px]">Opacity</Label>
                        <span>{form.hero?.backgroundOpacity ?? 100}%</span>
                      </div>
                      <Slider
                        value={[form.hero?.backgroundOpacity ?? 100]}
                        min={10}
                        max={100}
                        step={5}
                        onValueChange={([val]) =>
                          setForm({
                            ...form,
                            hero: { ...(form.hero || defaultHeroConfig), backgroundOpacity: val },
                          })
                        }
                        className="py-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Showcase Wheel Image */}
                <div className="space-y-2 rounded-xl border p-3.5 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-semibold">Showcase Wheel</Label>
                      <Switch
                        checked={form.hero?.showWheel !== false}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            hero: { ...(form.hero || defaultHeroConfig), showWheel: checked },
                          })
                        }
                        aria-label="Toggle showcase wheel"
                      />
                    </div>
                    <HeroImageUpload
                      label="Wheel image"
                      onUploaded={(url) =>
                        setForm({
                          ...form,
                          hero: { ...(form.hero || defaultHeroConfig), wheelImage: url },
                        })
                      }
                    />
                  </div>
                  <Input
                    value={form.hero?.wheelImage || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        hero: { ...(form.hero || defaultHeroConfig), wheelImage: e.target.value },
                      })
                    }
                    placeholder="Custom wheel graphic URL (or leave blank for default)"
                    className="text-xs"
                    disabled={form.hero?.showWheel === false}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Displays the circular solutions graphic on the right side of the hero.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Call-to-Action Buttons */}
            <div className="space-y-4 pb-4 border-b">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Play className="h-4 w-4 text-accent" />
                Hero Call-to-Action Buttons
              </h4>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Primary Button */}
                <div className="space-y-3 rounded-xl border p-3.5 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent">Primary Action Button</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Enabled</span>
                      <Switch
                        checked={form.hero?.primaryCta?.enabled !== false}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            hero: {
                              ...(form.hero || defaultHeroConfig),
                              primaryCta: {
                                ...(form.hero?.primaryCta || defaultHeroConfig.primaryCta),
                                enabled: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Text (English)</Label>
                      <Input
                        value={form.hero?.primaryCta?.text?.en ?? defaultHeroConfig.primaryCta.text.en}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            hero: {
                              ...(form.hero || defaultHeroConfig),
                              primaryCta: {
                                ...(form.hero?.primaryCta || defaultHeroConfig.primaryCta),
                                text: {
                                  ...(form.hero?.primaryCta?.text || defaultHeroConfig.primaryCta.text),
                                  en: e.target.value,
                                },
                              },
                            },
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">النص (عربي)</Label>
                      <Input
                        dir="rtl"
                        value={form.hero?.primaryCta?.text?.ar ?? defaultHeroConfig.primaryCta.text.ar}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            hero: {
                              ...(form.hero || defaultHeroConfig),
                              primaryCta: {
                                ...(form.hero?.primaryCta || defaultHeroConfig.primaryCta),
                                text: {
                                  ...(form.hero?.primaryCta?.text || defaultHeroConfig.primaryCta.text),
                                  ar: e.target.value,
                                },
                              },
                            },
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Destination URL</Label>
                    <Input
                      value={form.hero?.primaryCta?.url ?? defaultHeroConfig.primaryCta.url}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          hero: {
                            ...(form.hero || defaultHeroConfig),
                            primaryCta: {
                              ...(form.hero?.primaryCta || defaultHeroConfig.primaryCta),
                              url: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="/contact"
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Secondary Button */}
                <div className="space-y-3 rounded-xl border p-3.5 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Secondary Action Button</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Enabled</span>
                      <Switch
                        checked={form.hero?.secondaryCta?.enabled !== false}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            hero: {
                              ...(form.hero || defaultHeroConfig),
                              secondaryCta: {
                                ...(form.hero?.secondaryCta || defaultHeroConfig.secondaryCta),
                                enabled: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Text (English)</Label>
                      <Input
                        value={form.hero?.secondaryCta?.text?.en ?? defaultHeroConfig.secondaryCta.text.en}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            hero: {
                              ...(form.hero || defaultHeroConfig),
                              secondaryCta: {
                                ...(form.hero?.secondaryCta || defaultHeroConfig.secondaryCta),
                                text: {
                                  ...(form.hero?.secondaryCta?.text || defaultHeroConfig.secondaryCta.text),
                                  en: e.target.value,
                                },
                              },
                            },
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">النص (عربي)</Label>
                      <Input
                        dir="rtl"
                        value={form.hero?.secondaryCta?.text?.ar ?? defaultHeroConfig.secondaryCta.text.ar}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            hero: {
                              ...(form.hero || defaultHeroConfig),
                              secondaryCta: {
                                ...(form.hero?.secondaryCta || defaultHeroConfig.secondaryCta),
                                text: {
                                  ...(form.hero?.secondaryCta?.text || defaultHeroConfig.secondaryCta.text),
                                  ar: e.target.value,
                                },
                              },
                            },
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Destination URL</Label>
                    <Input
                      value={form.hero?.secondaryCta?.url ?? defaultHeroConfig.secondaryCta.url}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          hero: {
                            ...(form.hero || defaultHeroConfig),
                            secondaryCta: {
                              ...(form.hero?.secondaryCta || defaultHeroConfig.secondaryCta),
                              url: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="/solutions"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Strengths & Highlights Badges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    Hero Strengths Badges
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    The 4 credibility badges highlighted across the bottom of the hero section.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {(form.hero?.strengths || defaultHeroConfig.strengths).map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-accent">Strength #{idx + 1}</span>
                      <Select
                        value={s.iconName || "ShieldCheck"}
                        onValueChange={(val) => {
                          const updated = [...(form.hero?.strengths || defaultHeroConfig.strengths)];
                          updated[idx] = { ...updated[idx], iconName: val };
                          setForm({ ...form, hero: { ...(form.hero || defaultHeroConfig), strengths: updated } });
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ShieldCheck">ShieldCheck</SelectItem>
                          <SelectItem value="Layers">Layers</SelectItem>
                          <SelectItem value="Users">Users</SelectItem>
                          <SelectItem value="Headphones">Headphones</SelectItem>
                          <SelectItem value="Award">Award</SelectItem>
                          <SelectItem value="Clock">Clock</SelectItem>
                          <SelectItem value="Star">Star</SelectItem>
                          <SelectItem value="Sparkles">Sparkles</SelectItem>
                          <SelectItem value="Zap">Zap</SelectItem>
                          <SelectItem value="CheckCircle2">CheckCircle2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={s.label.en}
                        onChange={(e) => {
                          const updated = [...(form.hero?.strengths || defaultHeroConfig.strengths)];
                          updated[idx] = { ...updated[idx], label: { ...updated[idx].label, en: e.target.value } };
                          setForm({ ...form, hero: { ...(form.hero || defaultHeroConfig), strengths: updated } });
                        }}
                        placeholder="Label (EN)"
                        className="text-xs h-8"
                      />
                      <Input
                        dir="rtl"
                        value={s.label.ar}
                        onChange={(e) => {
                          const updated = [...(form.hero?.strengths || defaultHeroConfig.strengths)];
                          updated[idx] = { ...updated[idx], label: { ...updated[idx].label, ar: e.target.value } };
                          setForm({ ...form, hero: { ...(form.hero || defaultHeroConfig), strengths: updated } });
                        }}
                        placeholder="التسمية (AR)"
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Homepage Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Edit the four counter figures shown in the stats banner on the homepage (e.g. 150+ Clients Served).
            </p>
            {form.stats.map((stat, i) => (
              <div key={i} className="rounded-md border p-4 space-y-3">
                <div className="text-sm font-semibold text-muted-foreground">Stat {i + 1}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`stat_val_${i}`}>Value</Label>
                    <Input
                      id={`stat_val_${i}`}
                      type="number"
                      min={0}
                      value={stat.value}
                      onChange={(e) => {
                        const updated = form.stats.map((s, j) =>
                          j === i ? { ...s, value: Number(e.target.value) || 0 } : s
                        );
                        setForm({ ...form, stats: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`stat_sfx_${i}`}>Suffix</Label>
                    <Input
                      id={`stat_sfx_${i}`}
                      value={stat.suffix}
                      onChange={(e) => {
                        const updated = form.stats.map((s, j) =>
                          j === i ? { ...s, suffix: e.target.value } : s
                        );
                        setForm({ ...form, stats: updated });
                      }}
                      placeholder="e.g. +"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`stat_lbl_en_${i}`}>Label (English)</Label>
                    <Input
                      id={`stat_lbl_en_${i}`}
                      value={stat.label.en}
                      onChange={(e) => {
                        const updated = form.stats.map((s, j) =>
                          j === i ? { ...s, label: { ...s.label, en: e.target.value } } : s
                        );
                        setForm({ ...form, stats: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`stat_lbl_ar_${i}`}>التسمية (عربي)</Label>
                    <Input
                      id={`stat_lbl_ar_${i}`}
                      dir="rtl"
                      value={stat.label.ar}
                      onChange={(e) => {
                        const updated = form.stats.map((s, j) =>
                          j === i ? { ...s, label: { ...s.label, ar: e.target.value } } : s
                        );
                        setForm({ ...form, stats: updated });
                      }}
                    />
                  </div>
                </div>
                {/* Live preview + delete */}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1 text-accent font-display">
                    <span className="text-2xl font-bold">{stat.value}{stat.suffix}</span>
                    <span className="text-sm text-muted-foreground font-normal">{stat.label.en}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Remove stat"
                    onClick={() => setForm({ ...form, stats: form.stats.filter((_, j) => j !== i) })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setForm({
                  ...form,
                  stats: [
                    ...form.stats,
                    { value: 0, suffix: "+", label: { en: "", ar: "" } },
                  ],
                })
              }
            >
              + Add stat
            </Button>
          </CardContent>
        </Card>
      </div>
    )}

    {tab === "site" && (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Page Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Toggle which pages appear in the header menu, mobile bottom nav, and footer. Hidden pages are still reachable by direct URL.</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {([
                ["home", "Home", "الرئيسية"],
                ["about", "About", "من نحن"],
                ["services", "Services", "الخدمات"],
                ["solutions", "Solutions", "الحلول"],
                ["products", "Systems", "الأنظمة"],
                ["projects", "Projects", "المشاريع"],
                ["industries", "Industries", "القطاعات"],
                ["careers", "Careers", "الوظائف"],
                ["events", "Events", "الفعاليات"],
                ["training", "Training", "التدريب"],
                ["news", "News", "الأخبار"],
                ["partners", "Partners", "الشركاء"],
                ["contact", "Contact", "اتصل بنا"],
              ] as const).map(([key, labelEn, labelAr]) => (
                <label key={key} htmlFor={`vis_${key}`} className="flex items-center justify-between gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium">{lang === "ar" ? labelAr : labelEn}</span>
                  <Switch
                    id={`vis_${key}`}
                    checked={(form.visibility as any)?.[key] !== false}
                    onCheckedChange={(v) => setForm({ ...form, visibility: { ...form.visibility, [key]: v } })}
                  />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Header & Navigation Icons Toggle Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Header & Navigation Icons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Control the visibility of the Shopping Cart and Quote Tracking icons in the website top header and navigation menu.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <label
                htmlFor="icon_tracking"
                className="flex items-center justify-between gap-3 rounded-md border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Search className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Quote Tracking Icon</div>
                    <div className="text-xs text-muted-foreground">Show or hide the quote status tracking search link in the header & mobile menu.</div>
                  </div>
                </div>
                <Switch
                  id="icon_tracking"
                  checked={form.headerIcons?.tracking !== false}
                  onCheckedChange={(v) =>
                    setForm({
                      ...form,
                      headerIcons: {
                        ...(form.headerIcons || { cart: true, tracking: true }),
                        tracking: v,
                      },
                    })
                  }
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <VisibilityPreview
          visibility={form.visibility}
          headerIcons={form.headerIcons}
          lang={lang}
        />

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Sticky Contact Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Toggle the floating WhatsApp button and install-app pill, edit their labels in both languages, choose which side of the screen they anchor to, and control mobile behavior.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sticky_side">Desktop anchor side</Label>
                <Select
                  value={form.sticky.side}
                  onValueChange={(v) => setForm({ ...form, sticky: { ...form.sticky, side: v as "start" | "end" } })}
                >
                  <SelectTrigger id="sticky_side"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="end">Right (end)</SelectItem>
                    <SelectItem value="start">Left (start)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label htmlFor="sticky_collapse" className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Collapse into one menu on mobile</div>
                  <div className="text-xs text-muted-foreground">Groups all buttons behind a single expandable FAB above the bottom nav so it never covers primary CTAs.</div>
                </div>
                <Switch
                  id="sticky_collapse"
                  checked={form.sticky.mobileCollapse}
                  onCheckedChange={(v) => setForm({ ...form, sticky: { ...form.sticky, mobileCollapse: v } })}
                />
              </label>
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">WhatsApp</div>
                <Switch
                  checked={form.sticky.whatsapp.enabled}
                  onCheckedChange={(v) => setForm({ ...form, sticky: { ...form.sticky, whatsapp: { ...form.sticky.whatsapp, enabled: v } } })}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field
                  label="Label (English)"
                  id="wa_label_en"
                  value={form.sticky.whatsapp.text.en}
                  onChange={(v) => setForm({ ...form, sticky: { ...form.sticky, whatsapp: { ...form.sticky.whatsapp, text: { ...form.sticky.whatsapp.text, en: v } } } })}
                />
                <Field
                  label="التسمية (عربي)"
                  id="wa_label_ar"
                  dir="rtl"
                  value={form.sticky.whatsapp.text.ar}
                  onChange={(v) => setForm({ ...form, sticky: { ...form.sticky, whatsapp: { ...form.sticky.whatsapp, text: { ...form.sticky.whatsapp.text, ar: v } } } })}
                />
              </div>
              <p className="text-xs text-muted-foreground">The link uses the WhatsApp number from the Contact card above.</p>
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Install app pill</div>
                <Switch
                  checked={form.sticky.install.enabled}
                  onCheckedChange={(v) => setForm({ ...form, sticky: { ...form.sticky, install: { ...form.sticky.install, enabled: v } } })}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field
                  label="Label (English)"
                  id="install_label_en"
                  value={form.sticky.install.text.en}
                  onChange={(v) => setForm({ ...form, sticky: { ...form.sticky, install: { ...form.sticky.install, text: { ...form.sticky.install.text, en: v } } } })}
                />
                <Field
                  label="التسمية (عربي)"
                  id="install_label_ar"
                  dir="rtl"
                  value={form.sticky.install.text.ar}
                  onChange={(v) => setForm({ ...form, sticky: { ...form.sticky, install: { ...form.sticky.install, text: { ...form.sticky.install.text, ar: v } } } })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

        {tab !== "backup" && tab !== "security" && (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Save changes
            </Button>
            <Button type="button" variant="outline" onClick={() => void onReset()} disabled={saving}>
              <RotateCcw className="h-4 w-4 me-2" /> Reset to defaults
            </Button>
            {saved && (
              <span className="text-sm text-emerald-600 inline-flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Saved — visible site-wide.
              </span>
            )}
          </div>
        )}
      </form>

      {tab === "backup" && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">{at("backupRestore")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{at("backupHint")}</p>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={onTakeBackup}>
                  <Download className="h-4 w-4 me-2" /> {at("takeBackup")}
                </Button>
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 me-2" /> {at("restoreBackup")}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) requestRestoreFromFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg inline-flex items-center gap-2">
                <History className="h-4 w-4" /> {at("backupHistory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">{at("noBackups")}</p>
              ) : (
                <ul className="divide-y">
                  {history.map((h) => (
                    <li key={h.id} className="py-2 flex items-center justify-between gap-3">
                      <div className="text-sm">
                        <div className="font-medium">{new Date(h.at).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground font-mono">{h.id.slice(0, 8)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPending({ source: "history", payload: h.payload, label: new Date(h.at).toLocaleString() })}>
                          <RotateCcw className="h-4 w-4 me-2" /> {at("restore")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteSnapshot(h.id)} aria-label="delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{at("confirmRestoreTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {at("confirmRestoreDesc")}
              {pending && <span className="block mt-2 text-foreground font-medium">{pending.label}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{at("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) applyRestore(pending.payload);
                setPending(null);
              }}
            >
              {at("confirmRestore")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const Field = memo(function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  hint,
  dir,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} dir={dir} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
});

const VisibilityPreview = memo(function VisibilityPreview({
  visibility,
  headerIcons,
  lang,
}: {
  visibility: SiteSettings["visibility"];
  headerIcons?: SiteSettings["headerIcons"];
  lang: "en" | "ar";
}) {
  const show = (k: keyof SiteSettings["visibility"]) => visibility[k] !== false;

  const showTracking = headerIcons?.tracking !== false;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);

  const headerLinks = [
    show("home") && { label: L("Home", "الرئيسية") },
    show("about") && { label: L("About", "من نحن") },
    show("services") && { label: L("Services", "الخدمات"), mega: true },
    show("products") && { label: L("Systems", "الأنظمة") },
    show("projects") && { label: L("Projects", "المشاريع") },
  ].filter(Boolean) as { label: string; mega?: boolean }[];

  const footerQuick = [
    show("about") && L("About", "من نحن"),
    show("services") && L("Services", "الخدمات"),
    show("projects") && L("Projects", "المشاريع"),
    show("industries") && L("Industries", "القطاعات"),
    show("products") && L("Systems", "الأنظمة"),
  ].filter(Boolean) as string[];

  const footerCompany = [
    show("careers") && L("Careers", "الوظائف"),
    show("news") && L("News", "الأخبار"),
    show("partners") && L("Partners", "الشركاء"),
    show("contact") && L("Contact", "تواصل"),
  ].filter(Boolean) as string[];

  const mobileTabs = [
    { key: "home" as const, label: L("Home", "الرئيسية"), Icon: Home },
    { key: "services" as const, label: L("Services", "الخدمات"), Icon: Briefcase },
    { key: "industries" as const, label: L("Industries", "القطاعات"), Icon: LayersIcon },
    { key: "about" as const, label: L("About", "من نحن"), Icon: Info },
    { key: "contact" as const, label: L("Contact", "تواصل"), Icon: Phone },
  ].filter((t) => t.key === "home" || show(t.key));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">Live preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Reflects the toggles above (unsaved). Save to publish. Preview uses the current UI language ({lang.toUpperCase()}).
        </p>

        {/* Desktop header */}
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Desktop header</div>
          <div className="rounded-lg border bg-background overflow-hidden" dir={dir}>
            {/* Top Bar Preview */}
            <div className="bg-primary text-primary-foreground text-[10px] px-4 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-3 opacity-80">
                <span>info@integratedtechnics.com</span>
                <span>+20 100 741 9344</span>
              </div>
              <div className="flex items-center gap-3">
                {showTracking && (
                  <span className="inline-flex items-center gap-1 opacity-90">
                    <Search className="h-3 w-3" />
                    <span>{L("Track Quote", "تتبع العرض")}</span>
                  </span>
                )}

                <span className="font-semibold uppercase text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded">
                  {lang.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="h-12 px-4 flex items-center justify-between gap-4 border-b bg-background">
              <div className="font-display font-bold text-sm">
                Integrated<span className="text-accent">Technics</span>
              </div>
              <nav className="hidden sm:flex items-center gap-1">
                {headerLinks.map((l) => (
                  <span key={l.label} className="px-2.5 py-1.5 text-xs font-medium rounded-md hover:bg-muted inline-flex items-center gap-1">
                    {l.label}
                    {l.mega && <ChevronDown className="h-3 w-3" />}
                  </span>
                ))}
              </nav>
              {show("contact") && (
                <span className="text-xs font-semibold bg-primary text-primary-foreground rounded-md px-3 py-1.5">
                  {L("Contact", "تواصل")}
                </span>
              )}
            </div>

            {/* Mega menu */}
            {show("services") && (
              <div className="p-4 bg-muted/30 border-t">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                  {L("Services mega menu", "قائمة الخدمات")}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {servicesData.slice(0, 6).map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.slug} className="flex items-start gap-2 p-2 rounded-md bg-background border">
                        <div className="h-7 w-7 rounded bg-accent text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{s.title[lang]}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1">{s.desc[lang]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {headerLinks.length === 0 && (
              <div className="p-3 text-xs text-muted-foreground italic border-t">
                {L("No pages enabled — header menu will be empty.", "لا توجد صفحات مفعّلة — القائمة ستكون فارغة.")}
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Mobile bottom nav</div>
          <div className="rounded-lg border bg-background max-w-sm mx-auto" dir={dir}>
            {mobileTabs.length > 0 ? (
              <ul
                className="grid"
                style={{ gridTemplateColumns: `repeat(${mobileTabs.length}, minmax(0, 1fr))` }}
              >
                {mobileTabs.map(({ label, Icon }) => (
                  <li key={label} className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] text-muted-foreground">
                    <span className="h-7 w-7 rounded-2xl flex items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium truncate max-w-[64px]">{label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-3 text-xs text-muted-foreground italic text-center">
                {L("No tabs visible.", "لا توجد تبويبات مرئية.")}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Footer</div>
          <div className="rounded-lg overflow-hidden border">
            <div className="bg-primary text-primary-foreground p-4 grid grid-cols-3 gap-4 text-xs" dir={dir}>
              <div>
                <div className="font-display font-bold text-sm mb-2">
                  Integrated<span className="text-accent">Technics</span>
                </div>
                <div className="opacity-75 line-clamp-3 text-[11px]">
                  {L("Company tagline shown in footer.", "شعار الشركة الظاهر في التذييل.")}
                </div>
              </div>
              <div>
                <div className="uppercase tracking-wider opacity-90 mb-2 text-[10px]">{L("Quick", "روابط")}</div>
                {footerQuick.length ? (
                  <ul className="space-y-1 opacity-80">
                    {footerQuick.map((l) => <li key={l}>{l}</li>)}
                  </ul>
                ) : (
                  <div className="opacity-60 italic text-[10px]">{L("Empty", "فارغ")}</div>
                )}
              </div>
              <div>
                <div className="uppercase tracking-wider opacity-90 mb-2 text-[10px]">{L("Company", "الشركة")}</div>
                {footerCompany.length ? (
                  <ul className="space-y-1 opacity-80">
                    {footerCompany.map((l) => <li key={l}>{l}</li>)}
                  </ul>
                ) : (
                  <div className="opacity-60 italic text-[10px]">{L("Empty", "فارغ")}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Suppress unused-import warning for MenuIcon */}
        <MenuIcon className="hidden" aria-hidden />
      </CardContent>
    </Card>
  );
});
