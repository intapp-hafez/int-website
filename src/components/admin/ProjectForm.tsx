import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Save, Upload, Loader2 } from "lucide-react";
import type { Project } from "@/lib/projects-store";
import { useAdminT } from "@/lib/admin-i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProjectDraft = Omit<Project, "id">;

export function ProjectForm({
  initial,
  title,
  onSubmit,
  onCancel,
}: {
  initial: ProjectDraft;
  title: string;
  onSubmit: (d: ProjectDraft) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<ProjectDraft>({ ...initial, active: initial.active !== false });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t, isRtl } = useAdminT();

  useEffect(() => {
    setD({ ...initial, active: initial.active !== false });
  }, [initial]);

  const valid = Boolean((d.title?.en || d.title?.ar) && (d.desc?.en || d.desc?.ar));

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `projects/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("slide-images")
        .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("slide-images").getPublicUrl(path);
      setD((prev) => ({ ...prev, image: data.publicUrl }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSubmit(d);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-xl">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Switch
            id="form-active"
            checked={d.active !== false}
            onCheckedChange={(val) => setD({ ...d, active: val })}
          />
          <Label htmlFor="form-active" className="cursor-pointer text-sm font-normal">
            {d.active !== false ? (isRtl ? "نشط (منشور)" : "Active (Visible)") : (isRtl ? "معطل (مخفي)" : "Hidden (Draft)")}
          </Label>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("titleEn")} *</Label>
          <Input
            dir="ltr"
            value={d.title?.en ?? ""}
            onChange={(e) => setD({ ...d, title: { en: e.target.value, ar: d.title?.ar ?? e.target.value } })}
            placeholder="Project title in English"
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("titleAr")} *</Label>
          <Input
            dir="rtl"
            value={d.title?.ar ?? ""}
            onChange={(e) => setD({ ...d, title: { ar: e.target.value, en: d.title?.en ?? e.target.value } })}
            placeholder="عنوان المشروع بالعربية"
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("industry")}</Label>
          <Input
            value={d.industry ?? ""}
            placeholder="e.g. Telecom, Oil & Gas, Healthcare"
            onChange={(e) => setD({ ...d, industry: e.target.value })}
          />
        </div>
        
        <div className="space-y-1.5">
          <Label>{t("image")}</Label>
          <div className="flex gap-2">
            <Input
              value={d.image ?? ""}
              placeholder="https://..."
              onChange={(e) => setD({ ...d, image: e.target.value })}
            />
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handleUpload(e.target.files?.[0] || null)}
              />
              <Button type="button" variant="outline" size="icon" asChild disabled={uploading}>
                <span>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </span>
              </Button>
            </label>
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label>{t("descEn")}</Label>
            <span className="text-xs text-muted-foreground">Rich Text (LTR)</span>
          </div>
          <RichTextEditor
            dir="ltr"
            value={d.desc?.en ?? ""}
            onChange={(val) => setD({ ...d, desc: { en: val, ar: d.desc?.ar ?? val } })}
            placeholder="Write the project description in English..."
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label>{t("descAr")}</Label>
            <span className="text-xs text-muted-foreground">محرر نصوص منسقة (RTL)</span>
          </div>
          <RichTextEditor
            dir="rtl"
            value={d.desc?.ar ?? ""}
            onChange={(val) => setD({ ...d, desc: { ar: val, en: d.desc?.en ?? val } })}
            placeholder="اكتب وصف المشروع بالعربية..."
          />
        </div>
        {d.image && (
          <div className="md:col-span-2">
            <div className="relative w-48 aspect-[4/3] rounded-lg overflow-hidden border">
              <img src={d.image} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
        <div className="md:col-span-2 rounded-md border p-4 bg-muted/30 space-y-3">
          <div>
            <div className="font-semibold text-sm">SEO</div>
            <div className="text-xs text-muted-foreground">Search-engine and social-share metadata for this project page.</div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Meta title (EN)</Label>
              <Input
                maxLength={70}
                value={d.seo?.metaTitle?.en ?? ""}
                onChange={(e) => setD({ ...d, seo: { ...d.seo, metaTitle: { en: e.target.value, ar: d.seo?.metaTitle?.ar ?? "" } } })}
                placeholder="≤ 60 chars"
              />
            </div>
            <div className="space-y-1.5">
              <Label>عنوان ميتا (AR)</Label>
              <Input
                dir="rtl"
                maxLength={70}
                value={d.seo?.metaTitle?.ar ?? ""}
                onChange={(e) => setD({ ...d, seo: { ...d.seo, metaTitle: { en: d.seo?.metaTitle?.en ?? "", ar: e.target.value } } })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Meta description (EN)</Label>
              <Textarea
                rows={2}
                maxLength={180}
                value={d.seo?.metaDescription?.en ?? ""}
                onChange={(e) => setD({ ...d, seo: { ...d.seo, metaDescription: { en: e.target.value, ar: d.seo?.metaDescription?.ar ?? "" } } })}
                placeholder="≤ 160 chars"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>وصف ميتا (AR)</Label>
              <Textarea
                dir="rtl"
                rows={2}
                maxLength={180}
                value={d.seo?.metaDescription?.ar ?? ""}
                onChange={(e) => setD({ ...d, seo: { ...d.seo, metaDescription: { en: e.target.value, ar: e.target.value } } })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Keywords</Label>
              <Input
                value={d.seo?.keywords ?? ""}
                onChange={(e) => setD({ ...d, seo: { ...d.seo, keywords: e.target.value } })}
                placeholder="erp, fintech, egypt"
              />
            </div>
            <div className="space-y-1.5">
              <Label>OG image URL</Label>
              <Input
                value={d.seo?.ogImage ?? ""}
                onChange={(e) => setD({ ...d, seo: { ...d.seo, ogImage: e.target.value } })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Canonical URL</Label>
              <Input
                value={d.seo?.canonicalUrl ?? ""}
                onChange={(e) => setD({ ...d, seo: { ...d.seo, canonicalUrl: e.target.value } })}
              />
            </div>
          </div>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <Button disabled={!valid || uploading || saving} onClick={() => void handleSubmit()}>
            {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
            {t("save")}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            {t("cancel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}