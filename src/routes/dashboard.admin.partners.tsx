import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { usePartners, type PartnerRow } from "@/lib/partners-store";
import { Trash2, Plus, Loader2, Upload, ImageIcon, ArrowUp, ArrowDown, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/admin/partners")({
  head: () => ({ meta: [{ title: "Partners — Admin" }] }),
  component: PartnersAdminPage,
});

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Unsupported format. Use PNG, JPG, WEBP, SVG or GIF.";
  if (file.size > MAX_BYTES) return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`;
  return null;
}

async function uploadLogo(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `partners/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("slide-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("slide-images").getPublicUrl(path);
  return data.publicUrl;
}

function PartnersAdminPage() {
  const { partners, loading, upsert, remove, move } = usePartners();
  const sorted = [...partners].sort((a, b) => a.sort_order - b.sort_order);
  const [saving, setSaving] = useState(false);
  const emptyDraft = { name_en: "", name_ar: "", logo: "", href: "", active: true, sort_order: 0 };
  const [draft, setDraft] = useState(emptyDraft);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleDraftUpload = async (file: File | null) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast.error(err);
    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setDraft((d) => ({ ...d, logo: localPreview }));
    setUploading("draft");
    try {
      const url = await uploadLogo(file);
      setDraft((d) => ({ ...d, logo: url }));
      toast.success("Logo uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed. Admin role required.");
    } finally {
      setUploading(null);
      // Revoke after upload completes; url swap replaces preview
      setTimeout(() => URL.revokeObjectURL(localPreview), 2000);
    }
  };

  const handleReplace = async (p: PartnerRow, file: File | null) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast.error(err);
    setUploading(p.id);
    try {
      const url = await uploadLogo(file);
      await upsert({ ...p, logo: url });
      toast.success("Logo updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally { setUploading(null); }
  };

  const add = async () => {
    if (!draft.name_en && !draft.name_ar) return toast.error("Enter a name (EN or AR)");
    setSaving(true);
    try {
      await upsert({ ...draft, logo: draft.logo || "/placeholder.svg", sort_order: partners.length });
      toast.success("Partner added");
      setDraft(emptyDraft);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add partner");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Partners</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage partner logos shown on the homepage and Partners page.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Add new partner</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5" dir="ltr">
            <Label className="block text-left">Name (EN)</Label>
            <Input dir="ltr" lang="en" className="text-left" value={draft.name_en} onChange={e => setDraft({ ...draft, name_en: e.target.value })} placeholder="Partner name" />
          </div>
          <div className="space-y-1.5" dir="rtl">
            <Label className="block text-right font-arabic">الاسم (AR)</Label>
            <Input dir="rtl" lang="ar" className="text-right font-arabic" value={draft.name_ar} onChange={e => setDraft({ ...draft, name_ar: e.target.value })} placeholder="اسم الشريك" />
          </div>
          <div className="space-y-1.5 md:col-span-2"><Label>Logo URL</Label><Input value={draft.logo} placeholder="https://... or upload below" onChange={e => setDraft({ ...draft, logo: e.target.value })} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Link (optional)</Label><Input value={draft.href} placeholder="https://partner.com" onChange={e => setDraft({ ...draft, href: e.target.value })} /></div>
          <div className="md:col-span-2 space-y-2">
            <Label>Or upload a logo</Label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-background hover:bg-muted cursor-pointer text-sm">
                {uploading === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{uploading === "draft" ? "Uploading…" : "Choose image"}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploading === "draft"} onChange={(e) => handleDraftUpload(e.target.files?.[0] ?? null)} />
              </label>
              {draft.logo && (
                <div className="relative">
                  <img src={draft.logo} alt="Preview" className="h-12 w-12 rounded object-contain border bg-card" />
                  {uploading === "draft" && (
                    <div className="absolute inset-0 bg-background/70 rounded flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, SVG or GIF · up to 5 MB.</p>
            </div>
          </div>
          <div className="md:col-span-2">
            <Button onClick={add} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Plus className="h-4 w-4 me-2" />}
              Add partner
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading partners…</div>
      ) : partners.length === 0 ? (
        <div className="text-sm text-muted-foreground">No partners yet. Add the first one above.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((p, i) => (
            <Card key={p.id}>
              <div className="relative aspect-[3/2] bg-muted/40 flex items-center justify-center rounded-t-xl overflow-hidden">
                <img src={p.logo} alt={p.name_en || p.name_ar} className="max-h-16 max-w-[70%] object-contain" />
                <div className="absolute top-2 start-2 flex items-center gap-1">
                  <span className="text-[10px] font-mono bg-background/90 border rounded px-1.5 py-0.5">#{i + 1}</span>
                  {p.featured && <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-accent text-accent-foreground px-1.5 py-0.5 rounded"><Star className="h-3 w-3 fill-current" /> Featured</span>}
                </div>
                <div className="absolute top-2 end-2 flex flex-col gap-1">
                  <Button type="button" size="sm" variant="secondary" className="h-6 w-6 p-0" disabled={i === 0} onClick={() => move(p.id, -1)} title="Move up"><ArrowUp className="h-3 w-3" /></Button>
                  <Button type="button" size="sm" variant="secondary" className="h-6 w-6 p-0" disabled={i === sorted.length - 1} onClick={() => move(p.id, 1)} title="Move down"><ArrowDown className="h-3 w-3" /></Button>
                </div>
                <label className="absolute bottom-2 end-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background/90 backdrop-blur border text-xs hover:bg-background cursor-pointer">
                  {uploading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  <span>{uploading === p.id ? "Uploading…" : "Replace"}</span>
                  <input type="file" accept="image/*" className="hidden" disabled={uploading === p.id} onChange={(e) => handleReplace(p, e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div dir="ltr">
                    <Input dir="ltr" lang="en" className="text-left" value={p.name_en} onChange={e => upsert({ ...p, name_en: e.target.value })} placeholder="Name (EN)" />
                  </div>
                  <div dir="rtl">
                    <Input dir="rtl" lang="ar" className="text-right font-arabic" value={p.name_ar} onChange={e => upsert({ ...p, name_ar: e.target.value })} placeholder="الاسم (AR)" />
                  </div>
                </div>
                <Input value={p.href} onChange={e => upsert({ ...p, href: e.target.value })} placeholder="https://partner.com" />
                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Switch checked={p.active} onCheckedChange={(v) => upsert({ ...p, active: v })} />
                    <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Hidden"}</Badge>
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <Switch checked={!!p.featured} onCheckedChange={(v) => upsert({ ...p, featured: v })} />
                    <span className="inline-flex items-center gap-1"><Star className={`h-3.5 w-3.5 ${p.featured ? "fill-accent text-accent" : ""}`} /> Featured</span>
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}