import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Save } from "lucide-react";
import type { Project } from "@/lib/projects-store";
import { useAdminT } from "@/lib/admin-i18n";

export type ProjectDraft = Omit<Project, "id">;

export function ProjectForm({ initial, title, onSubmit, onCancel }: { initial: ProjectDraft; title: string; onSubmit: (d: ProjectDraft) => void; onCancel: () => void }) {
  const [d, setD] = useState<ProjectDraft>(initial);
  const { t } = useAdminT();
  const valid = d.title.en && d.title.ar && d.industry && d.desc.en && d.desc.ar;

  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-xl">{title}</CardTitle></CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>{t("titleEn")}</Label><Input dir="ltr" value={d.title.en} onChange={(e) => setD({ ...d, title: { ...d.title, en: e.target.value } })} /></div>
        <div className="space-y-1.5"><Label>{t("titleAr")}</Label><Input dir="rtl" value={d.title.ar} onChange={(e) => setD({ ...d, title: { ...d.title, ar: e.target.value } })} /></div>
        <div className="space-y-1.5"><Label>{t("industry")}</Label><Input value={d.industry} onChange={(e) => setD({ ...d, industry: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("image")}</Label><Input value={d.image} onChange={(e) => setD({ ...d, image: e.target.value })} /></div>
        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label>{t("descEn")}</Label>
            <span className="text-xs text-muted-foreground">Rich Text (LTR)</span>
          </div>
          <RichTextEditor
            dir="ltr"
            value={d.desc.en}
            onChange={(val) => setD({ ...d, desc: { ...d.desc, en: val } })}
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
            value={d.desc.ar}
            onChange={(val) => setD({ ...d, desc: { ...d.desc, ar: val } })}
            placeholder="اكتب وصف المشروع بالعربية..."
          />
        </div>
        {d.image && <div className="md:col-span-2"><img src={d.image} alt="" className="rounded border max-h-48 object-cover" /></div>}
        <div className="md:col-span-2 rounded-md border p-4 bg-muted/30 space-y-3">
          <div>
            <div className="font-semibold text-sm">SEO</div>
            <div className="text-xs text-muted-foreground">Search-engine and social-share metadata for this project page.</div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Meta title (EN)</Label><Input maxLength={70} value={d.seo?.metaTitle?.en ?? ""} onChange={(e) => setD({ ...d, seo: { ...d.seo, metaTitle: { en: e.target.value, ar: d.seo?.metaTitle?.ar ?? "" } } })} placeholder="≤ 60 chars" /></div>
            <div className="space-y-1.5"><Label>عنوان ميتا (AR)</Label><Input dir="rtl" maxLength={70} value={d.seo?.metaTitle?.ar ?? ""} onChange={(e) => setD({ ...d, seo: { ...d.seo, metaTitle: { en: d.seo?.metaTitle?.en ?? "", ar: e.target.value } } })} /></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Meta description (EN)</Label><Textarea rows={2} maxLength={180} value={d.seo?.metaDescription?.en ?? ""} onChange={(e) => setD({ ...d, seo: { ...d.seo, metaDescription: { en: e.target.value, ar: d.seo?.metaDescription?.ar ?? "" } } })} placeholder="≤ 160 chars" /></div>
            <div className="space-y-1.5 md:col-span-2"><Label>وصف ميتا (AR)</Label><Textarea dir="rtl" rows={2} maxLength={180} value={d.seo?.metaDescription?.ar ?? ""} onChange={(e) => setD({ ...d, seo: { ...d.seo, metaDescription: { en: d.seo?.metaDescription?.en ?? "", ar: e.target.value } } })} /></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Keywords</Label><Input value={d.seo?.keywords ?? ""} onChange={(e) => setD({ ...d, seo: { ...d.seo, keywords: e.target.value } })} placeholder="erp, fintech, egypt" /></div>
            <div className="space-y-1.5"><Label>OG image URL</Label><Input value={d.seo?.ogImage ?? ""} onChange={(e) => setD({ ...d, seo: { ...d.seo, ogImage: e.target.value } })} /></div>
            <div className="space-y-1.5"><Label>Canonical URL</Label><Input value={d.seo?.canonicalUrl ?? ""} onChange={(e) => setD({ ...d, seo: { ...d.seo, canonicalUrl: e.target.value } })} /></div>
          </div>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <Button disabled={!valid} onClick={() => onSubmit(d)}><Save className="h-4 w-4 me-2" /> {t("save")}</Button>
          <Button variant="outline" onClick={onCancel}>{t("cancel")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}