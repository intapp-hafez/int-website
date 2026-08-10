import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNews, type NewsPost } from "@/lib/news-store";
import { Trash2, Plus, Loader2, Upload, Star, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export const Route = createFileRoute("/dashboard/admin/news")({
  head: () => ({ meta: [{ title: "News — Admin" }] }),
  component: NewsAdminPage,
});

const emptyDraft = {
  slug: "",
  title_en: "",
  title_ar: "",
  excerpt_en: "",
  excerpt_ar: "",
  body_en: "",
  body_ar: "",
  category_en: "",
  category_ar: "",
  image_url: "",
  published_at: new Date().toISOString().slice(0, 10),
  active: true,
  featured: false,
  sort_order: 0,
  seo_title_en: "",
  seo_title_ar: "",
  seo_description_en: "",
  seo_description_ar: "",
};

function NewsAdminPage() {
  const _perms = useCurrentPagePerms();
  const { posts, loading, upsert, remove, refresh } = useNews();
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, Partial<NewsPost>>>({});

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("news-images")
      .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("news-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUpload = async (file: File | null, target: "draft" | string, current?: NewsPost) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading(target);
    try {
      const url = await uploadImage(file);
      if (target === "draft") setDraft({ ...draft, image_url: url });
      else if (current) await upsert({ ...current, image_url: url });
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const add = async () => {
    if (!draft.title_en && !draft.title_ar) return toast.error("Add a title (EN or AR)");
    setSaving(true);
    try {
      await upsert({
        ...draft,
        published_at: new Date(draft.published_at).toISOString(),
        sort_order: posts.length,
      });
      toast.success("News post added");
      setDraft(emptyDraft);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add post");
    } finally {
      setSaving(false);
    }
  };

  const saveRow = async (p: NewsPost) => {
    const patch = editing[p.id];
    if (!patch) return;
    try {
      const merged = { ...p, ...patch } as NewsPost;
      if (typeof patch.published_at === "string" && patch.published_at.length <= 10) {
        merged.published_at = new Date(patch.published_at).toISOString();
      }
      await upsert(merged);
      setEditing((e) => { const n = { ...e }; delete n[p.id]; return n; });
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    }
  };

  const patchRow = (id: string, k: keyof NewsPost, v: any) =>
    setEditing((e) => ({ ...e, [id]: { ...(e[id] ?? {}), [k]: v } }));

  const getVal = (p: NewsPost, k: keyof NewsPost) => (editing[p.id]?.[k] ?? (p as any)[k]) as any;

  const toggleActive = async (p: NewsPost, v: boolean) => { try { await upsert({ ...p, active: v }); } catch (e: any) { toast.error(e?.message ?? "Failed"); } };
  const toggleFeatured = async (p: NewsPost, v: boolean) => { try { await upsert({ ...p, featured: v }); } catch (e: any) { toast.error(e?.message ?? "Failed"); } };
  const del = async (id: string) => { if (!confirm("Delete this post?")) return; try { await remove(id); toast.success("Deleted"); } catch (e: any) { toast.error(e?.message ?? "Failed"); } };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">News</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage Latest News posts (bilingual) shown on the homepage and /news.</p>
        </div>
        <Button variant="outline" onClick={() => refresh()}><Loader2 className={`h-4 w-4 me-1 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Add new post</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Title (English)</Label><Input value={draft.title_en} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} /></div>
          <div className="space-y-2"><Label>العنوان (عربي)</Label><Input dir="rtl" value={draft.title_ar} onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })} /></div>
          <div className="space-y-2"><Label>Category (EN)</Label><Input value={draft.category_en} onChange={(e) => setDraft({ ...draft, category_en: e.target.value })} placeholder="Company, Projects, Awards…" /></div>
          <div className="space-y-2"><Label>الفئة (عربي)</Label><Input dir="rtl" value={draft.category_ar} onChange={(e) => setDraft({ ...draft, category_ar: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Slug (URL)</Label><Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="auto-generated from title if empty" /></div>
          <div className="space-y-2"><Label>Excerpt (EN)</Label><Textarea rows={2} value={draft.excerpt_en} onChange={(e) => setDraft({ ...draft, excerpt_en: e.target.value })} /></div>
          <div className="space-y-2"><Label>مقتطف (عربي)</Label><Textarea dir="rtl" rows={2} value={draft.excerpt_ar} onChange={(e) => setDraft({ ...draft, excerpt_ar: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Body Content (English)</Label>
              <span className="text-xs text-muted-foreground">Rich Text Editor (LTR)</span>
            </div>
            <RichTextEditor
              dir="ltr"
              value={draft.body_en}
              onChange={(val) => setDraft({ ...draft, body_en: val })}
              placeholder="Write the English news article content, format headings, quotes, lists..."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label>المحتوى بالتفصيل (عربي)</Label>
              <span className="text-xs text-muted-foreground">محرر نصوص منسقة (RTL)</span>
            </div>
            <RichTextEditor
              dir="rtl"
              value={draft.body_ar}
              onChange={(val) => setDraft({ ...draft, body_ar: val })}
              placeholder="اكتب محتوى الخبر بالعربية، نسق العناوين، القوائم، الاقتباسات..."
            />
          </div>
          <div className="space-y-2">
            <Label>Cover image</Label>
            <div className="flex items-center gap-3">
              {draft.image_url && <img src={draft.image_url} alt="" className="h-14 w-20 object-cover rounded border" />}
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-card cursor-pointer hover:bg-accent/10">
                {uploading === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="text-sm">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0] ?? null, "draft")} />
              </label>
            </div>
            <Input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="or paste an image URL" />
          </div>
          <div className="space-y-2"><Label>Published date</Label><Input type="date" value={draft.published_at.slice(0, 10)} onChange={(e) => setDraft({ ...draft, published_at: e.target.value })} /></div>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2"><Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} /><span className="text-sm">Active</span></label>
            <label className="inline-flex items-center gap-2"><Switch checked={draft.featured} onCheckedChange={(v) => setDraft({ ...draft, featured: v })} /><span className="text-sm">Featured (hero card)</span></label>
          </div>
          <div className="md:col-span-2">
            <Button onClick={add} disabled={!_perms.add || (saving)}>{saving ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Plus className="h-4 w-4 me-1" />}Add post</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold">All posts ({posts.length})</h2>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {posts.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4 grid md:grid-cols-[220px_1fr] gap-4 items-start">
              <div className="flex flex-col gap-2">
                <div className="relative w-full aspect-[4/3] rounded-lg border overflow-hidden bg-muted">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">No image</div>
                  )}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                    {p.featured && <Badge className="gap-1 h-5 px-1.5"><Star className="h-3 w-3" />Featured</Badge>}
                    <Badge variant={p.active ? "default" : "secondary"} className="h-5 px-1.5">{p.active ? "Active" : "Hidden"}</Badge>
                  </div>
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded border bg-card cursor-pointer hover:bg-accent/10 w-full justify-center">
                  {uploading === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}<span>Replace image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0] ?? null, p.id, p)} />
                </label>
                <div className="rounded-md border p-2 space-y-1.5 bg-muted/30">
                  <label className="flex items-center justify-between gap-2 text-xs"><span>Active</span><Switch checked={p.active} onCheckedChange={(v) => toggleActive(p, v)} /></label>
                  <label className="flex items-center justify-between gap-2 text-xs"><span>Featured</span><Switch checked={p.featured} onCheckedChange={(v) => toggleFeatured(p, v)} /></label>
                </div>
                <Button size="sm" onClick={() => saveRow(p)} disabled={!_perms.edit || (!editing[p.id])}><Save className="h-4 w-4 me-1" />Save changes</Button>
                <div className="grid grid-cols-2 gap-2">
                  <a href={`/news/${p.slug}`} target="_blank" rel="noreferrer" className="text-xs inline-flex items-center justify-center gap-1 text-accent hover:underline border rounded-md py-1.5"><ExternalLink className="h-3 w-3" />View</a>
                  <Button disabled={!_perms.delete} variant="destructive" size="sm" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 me-1" />Delete</Button>
                </div>
              </div>
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="flex flex-wrap justify-start">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="meta">Meta</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="mt-3 grid sm:grid-cols-2 gap-3">
                  <div><Label className="text-xs">Title (EN)</Label><Input value={getVal(p, "title_en")} onChange={(e) => patchRow(p.id, "title_en", e.target.value)} /></div>
                  <div><Label className="text-xs">العنوان (AR)</Label><Input dir="rtl" value={getVal(p, "title_ar")} onChange={(e) => patchRow(p.id, "title_ar", e.target.value)} /></div>
                  <div><Label className="text-xs">Excerpt (EN)</Label><Textarea rows={2} value={getVal(p, "excerpt_en")} onChange={(e) => patchRow(p.id, "excerpt_en", e.target.value)} /></div>
                  <div><Label className="text-xs">مقتطف (AR)</Label><Textarea dir="rtl" rows={2} value={getVal(p, "excerpt_ar")} onChange={(e) => patchRow(p.id, "excerpt_ar", e.target.value)} /></div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Body Content (EN)</Label>
                    <RichTextEditor
                      dir="ltr"
                      value={getVal(p, "body_en") || ""}
                      onChange={(v) => patchRow(p.id, "body_en", v)}
                      placeholder="English article content..."
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">المحتوى بالتفصيل (AR)</Label>
                    <RichTextEditor
                      dir="rtl"
                      value={getVal(p, "body_ar") || ""}
                      onChange={(v) => patchRow(p.id, "body_ar", v)}
                      placeholder="محتوى الخبر بالعربية..."
                    />
                  </div>
                </TabsContent>
                <TabsContent value="meta" className="mt-3 grid sm:grid-cols-2 gap-3">
                  <div><Label className="text-xs">Category (EN)</Label><Input value={getVal(p, "category_en")} onChange={(e) => patchRow(p.id, "category_en", e.target.value)} /></div>
                  <div><Label className="text-xs">الفئة (AR)</Label><Input dir="rtl" value={getVal(p, "category_ar")} onChange={(e) => patchRow(p.id, "category_ar", e.target.value)} /></div>
                  <div><Label className="text-xs">Published</Label><Input type="date" value={String(getVal(p, "published_at")).slice(0, 10)} onChange={(e) => patchRow(p.id, "published_at", e.target.value)} /></div>
                  <div><Label className="text-xs">Sort order</Label><Input type="number" value={getVal(p, "sort_order")} onChange={(e) => patchRow(p.id, "sort_order", Number(e.target.value))} /></div>
                </TabsContent>
                <TabsContent value="seo" className="mt-3 grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Slug (URL)</Label>
                    <Input value={getVal(p, "slug")} onChange={(e) => patchRow(p.id, "slug", e.target.value)} />
                    <p className="text-[11px] text-muted-foreground mt-1">/news/{getVal(p, "slug") || p.slug}</p>
                  </div>
                  <div><Label className="text-xs">SEO title (EN)</Label><Input value={getVal(p, "seo_title_en") || ""} onChange={(e) => patchRow(p.id, "seo_title_en", e.target.value)} placeholder={getVal(p, "title_en")} maxLength={70} /></div>
                  <div><Label className="text-xs">عنوان SEO (AR)</Label><Input dir="rtl" value={getVal(p, "seo_title_ar") || ""} onChange={(e) => patchRow(p.id, "seo_title_ar", e.target.value)} placeholder={getVal(p, "title_ar")} maxLength={70} /></div>
                  <div><Label className="text-xs">SEO description (EN)</Label><Textarea rows={3} value={getVal(p, "seo_description_en") || ""} onChange={(e) => patchRow(p.id, "seo_description_en", e.target.value)} placeholder={getVal(p, "excerpt_en")} maxLength={170} /></div>
                  <div><Label className="text-xs">وصف SEO (AR)</Label><Textarea dir="rtl" rows={3} value={getVal(p, "seo_description_ar") || ""} onChange={(e) => patchRow(p.id, "seo_description_ar", e.target.value)} placeholder={getVal(p, "excerpt_ar")} maxLength={170} /></div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}