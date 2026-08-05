import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useSlides, type SlideRow } from "@/lib/slides-store";
import { Trash2, Plus, Loader2, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/admin/sliders")({
  head: () => ({ meta: [{ title: "Homepage Sliders — Admin" }] }),
  component: SlidersPage,
});

function SlidersPage() {
  const { slides, loading, upsert, remove } = useSlides();
  const [saving, setSaving] = useState(false);
  const emptyDraft = {
    title_en: "",
    title_ar: "",
    subtitle_en: "",
    subtitle_ar: "",
    cta_en: "Learn more",
    cta_ar: "اعرف المزيد",
    image: "/placeholder.svg",
    href: "/",
    active: true,
    sort_order: 0,
  };
  const [draft, setDraft] = useState(emptyDraft);
  const [uploading, setUploading] = useState<string | null>(null); // slide id or "draft"

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("slide-images")
      .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("slide-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDraftUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading("draft");
    try {
      const url = await uploadImage(file);
      setDraft({ ...draft, image: url });
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed. Admin role required.");
    } finally {
      setUploading(null);
    }
  };

  const handleSlideUpload = async (s: SlideRow, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading(s.id);
    try {
      const url = await uploadImage(file);
      await upsert({ ...s, image: url });
      toast.success("Image updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const add = async () => {
    if (!draft.title_en && !draft.title_ar) return;
    setSaving(true);
    try {
      await upsert({ ...draft, sort_order: slides.length });
      toast.success("Slide added");
      setDraft(emptyDraft);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add slide. Admin role required.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: SlideRow, active: boolean) => {
    try {
      await upsert({ ...s, active });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update");
    }
  };

  const del = async (id: string) => {
    try {
      await remove(id);
      toast.success("Slide removed");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Homepage Sliders</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage hero carousel slides in English and Arabic.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Add new slide</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Title (EN)</Label><Input dir="ltr" value={draft.title_en} onChange={e => setDraft({ ...draft, title_en: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>العنوان (AR)</Label><Input dir="rtl" value={draft.title_ar} onChange={e => setDraft({ ...draft, title_ar: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Subtitle (EN)</Label><Input dir="ltr" value={draft.subtitle_en} onChange={e => setDraft({ ...draft, subtitle_en: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>الوصف (AR)</Label><Input dir="rtl" value={draft.subtitle_ar} onChange={e => setDraft({ ...draft, subtitle_ar: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>CTA (EN)</Label><Input dir="ltr" value={draft.cta_en} onChange={e => setDraft({ ...draft, cta_en: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>زر الإجراء (AR)</Label><Input dir="rtl" value={draft.cta_ar} onChange={e => setDraft({ ...draft, cta_ar: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Image URL</Label><Input value={draft.image} onChange={e => setDraft({ ...draft, image: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Link</Label><Input value={draft.href} onChange={e => setDraft({ ...draft, href: e.target.value })} /></div>
          <div className="md:col-span-2 space-y-2">
            <Label>Or upload an image</Label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-background hover:bg-muted cursor-pointer text-sm">
                {uploading === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{uploading === "draft" ? "Uploading…" : "Choose image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading === "draft"}
                  onChange={(e) => handleDraftUpload(e.target.files?.[0] ?? null)}
                />
              </label>
              {draft.image && draft.image !== "/placeholder.svg" && (
                <img src={draft.image} alt="" className="h-12 w-12 rounded object-cover border" />
              )}
              <p className="text-xs text-muted-foreground">PNG/JPG/WEBP, up to 5 MB.</p>
            </div>
          </div>
          <div className="md:col-span-2">
            <Button onClick={add} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Plus className="h-4 w-4 me-2" />}
              Add slide
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading slides…</div>
      ) : slides.length === 0 ? (
        <div className="text-sm text-muted-foreground">No slides yet. Add the first one above.</div>
      ) : (
      <div className="grid md:grid-cols-2 gap-4">
        {slides.map(s => (
          <Card key={s.id}>
            <div className="relative">
              <img src={s.image} alt="" className="w-full h-36 object-cover rounded-t-xl" />
              <label className="absolute bottom-2 end-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background/90 backdrop-blur border text-xs hover:bg-background cursor-pointer">
                {uploading === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                <span>{uploading === s.id ? "Uploading…" : "Replace"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading === s.id}
                  onChange={(e) => handleSlideUpload(s, e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium" dir="ltr">{s.title_en}</div>
                  <div className="font-medium text-muted-foreground" dir="rtl">{s.title_ar}</div>
                </div>
                <Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Active" : "Hidden"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2" dir="ltr">{s.subtitle_en}</p>
              <p className="text-sm text-muted-foreground line-clamp-2" dir="rtl">{s.subtitle_ar}</p>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch checked={s.active} onCheckedChange={(v) => toggleActive(s, v)} />
                  <span className="text-xs text-muted-foreground">Visible</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => del(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
