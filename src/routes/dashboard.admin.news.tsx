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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useNews, type NewsPost, DEFAULT_NEWS_POSTS } from "@/lib/news-store";
import {
  Trash2,
  Plus,
  Loader2,
  Upload,
  Star,
  Save,
  ExternalLink,
  Pencil,
  Calendar,
  Sparkles,
  Search,
  Eye,
  FileText,
  ChevronDown,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";

export const Route = createFileRoute("/dashboard/admin/news")({
  head: () => ({ meta: [{ title: "News & Articles — Admin" }] }),
  validateSearch: validateListSearch,
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
  const [seeding, setSeeding] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { view } = useListSearch({ defaultView: "table" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Edit Modal Dialog State
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

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

  const handleUpload = async (file: File | null, target: "draft" | "edit") => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading(target);
    try {
      const url = await uploadImage(file);
      if (target === "draft") setDraft((d) => ({ ...d, image_url: url }));
      else if (target === "edit" && editingPost) setEditingPost({ ...editingPost, image_url: url });
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
      const baseSlug = draft.slug.trim() || (draft.title_en || draft.title_ar).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/gi, "-").slice(0, 80);
      await upsert({
        ...draft,
        slug: baseSlug,
        published_at: new Date(draft.published_at).toISOString(),
        sort_order: posts.length + 1,
      });
      toast.success("News article published successfully");
      setDraft(emptyDraft);
      setIsAddOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add post");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    if (!editingPost.title_en && !editingPost.title_ar) {
      toast.error("Title (EN or AR) is required");
      return;
    }
    setEditSaving(true);
    try {
      await upsert(editingPost);
      toast.success("News post updated successfully");
      setEditDialogOpen(false);
      setEditingPost(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update news post");
    } finally {
      setEditSaving(false);
    }
  };

  const handleSeedAllData = async () => {
    setSeeding(true);
    try {
      for (const item of DEFAULT_NEWS_POSTS) {
        await upsert(item);
      }
      toast.success("Enterprise news data populated successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Seeding failed");
    } finally {
      setSeeding(false);
    }
  };

  const toggleActive = async (p: NewsPost, v: boolean) => {
    try {
      await upsert({ ...p, active: v });
      toast.success(v ? "Post is now visible" : "Post hidden");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const toggleFeatured = async (p: NewsPost, v: boolean) => {
    try {
      await upsert({ ...p, featured: v });
      toast.success(v ? "Marked as featured hero story" : "Unmarked from featured");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const del = async (id: string, title?: string) => {
    if (!confirm(`Delete news post "${title || id}"?`)) return;
    try {
      await remove(id);
      toast.success("Article deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const openEditModal = (p: NewsPost) => {
    setEditingPost({ ...p });
    setEditDialogOpen(true);
  };

  // Filtered Posts
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title_ar.includes(searchQuery) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category_en.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat =
      selectedCategory === "all" ||
      p.category_en.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(posts.map((p) => p.category_en).filter(Boolean)));

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold">News & Articles</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {posts.length} Posts
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Publish and manage enterprise press releases, project deliveries, and announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {posts.length <= 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedAllData}
              disabled={seeding}
              className="text-xs shadow-xs"
            >
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" /> : <Sparkles className="h-3.5 w-3.5 text-accent me-1.5" />}
              Load Sample News
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <Loader2 className={`h-4 w-4 me-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Add New Post Collapsible Card (Collapsed by default) */}
      <Collapsible open={isAddOpen} onOpenChange={setIsAddOpen}>
        <Card className="transition-all">
          <CardHeader
            className="cursor-pointer select-none py-4 hover:bg-muted/30 transition-colors"
            onClick={() => setIsAddOpen(!isAddOpen)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-accent" /> Add New Post
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddOpen(!isAddOpen);
                }}
              >
                {isAddOpen ? "Hide Form" : "New Post Form"}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAddOpen ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (English) *</Label>
                  <Input
                    value={draft.title_en}
                    onChange={(e) => setDraft({ ...draft, title_en: e.target.value })}
                    placeholder="e.g. Integrated Technics Expands Infrastructure Division"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان (عربي) *</Label>
                  <Input
                    dir="rtl"
                    value={draft.title_ar}
                    onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })}
                    placeholder="مثال: إنترجريتد تكنيكس توسع قطاع البنية التحتية"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category (EN)</Label>
                  <Input
                    value={draft.category_en}
                    onChange={(e) => setDraft({ ...draft, category_en: e.target.value })}
                    placeholder="Projects, Partnerships, Awards, Corporate..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>الفئة (عربي)</Label>
                  <Input
                    dir="rtl"
                    value={draft.category_ar}
                    onChange={(e) => setDraft({ ...draft, category_ar: e.target.value })}
                    placeholder="مشاريع، شراكات، جوائز، أخبار الشركة..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Slug (URL Identifier)</Label>
                  <Input
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-") })}
                    placeholder="auto-generated from title if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Excerpt (EN)</Label>
                  <Textarea
                    rows={2}
                    value={draft.excerpt_en}
                    onChange={(e) => setDraft({ ...draft, excerpt_en: e.target.value })}
                    placeholder="Short summary for preview cards..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>مقتطف ملخص (عربي)</Label>
                  <Textarea
                    dir="rtl"
                    rows={2}
                    value={draft.excerpt_ar}
                    onChange={(e) => setDraft({ ...draft, excerpt_ar: e.target.value })}
                    placeholder="ملخص قصير يظهر في بطاقات المعاينة..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Body Content (English)</Label>
                  <RichTextEditor
                    dir="ltr"
                    value={draft.body_en}
                    onChange={(val) => setDraft({ ...draft, body_en: val })}
                    placeholder="Full article content in English..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>المحتوى بالتفصيل (عربي)</Label>
                  <RichTextEditor
                    dir="rtl"
                    value={draft.body_ar}
                    onChange={(val) => setDraft({ ...draft, body_ar: val })}
                    placeholder="محتوى المقال أو الخبر بالتفصيل باللغة العربية..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cover Image (Upload file or URL)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={draft.image_url}
                      onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1"
                    />
                    <label className="cursor-pointer shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void handleUpload(e.target.files?.[0] || null, "draft")}
                      />
                      <Button type="button" variant="outline" size="sm" asChild disabled={uploading === "draft"}>
                        <span>
                          {uploading === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 me-1.5" />}
                          Upload
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Published Date</Label>
                  <Input
                    type="date"
                    value={draft.published_at.slice(0, 10)}
                    onChange={(e) => setDraft({ ...draft, published_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
                  <span className="text-sm font-medium">Active (Visible)</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <Switch checked={draft.featured} onCheckedChange={(v) => setDraft({ ...draft, featured: v })} />
                  <span className="text-sm font-medium">Featured (Hero Highlight)</span>
                </label>
              </div>

              <Button onClick={add} disabled={!_perms.add || saving || (!draft.title_en && !draft.title_ar)}>
                {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Plus className="h-4 w-4 me-2" />}
                Publish News Post
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Main Posts Management: Controls & Table/Card View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title, slug, or category..."
                className="pl-9 text-xs h-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs h-9 border rounded-md px-2.5 bg-background text-foreground"
              >
                <option value="all">All Categories ({posts.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* View Mode Toggle */}
            <ViewToggle value={view} options={["table", "grid"]} />
          </div>
        </div>

        {/* 1. TABLE VIEW (DEFAULT) */}
        {view === "table" && (
          <div className="border rounded-2xl overflow-hidden bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b">
                  <tr>
                    <th className="py-3 px-4 w-16">Cover</th>
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Published</th>
                    <th className="py-3 px-4 text-center">Featured</th>
                    <th className="py-3 px-4 text-center">Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading news posts...
                        </div>
                      </td>
                    </tr>
                  ) : filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        No articles match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="w-14 h-12 rounded-lg overflow-hidden border bg-muted shrink-0">
                            {p.image_url ? (
                              <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                                No img
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground line-clamp-1">
                            {p.title_en || p.title_ar}
                          </div>
                          {p.title_ar && p.title_en && (
                            <div className="text-xs text-muted-foreground line-clamp-1" dir="rtl">
                              {p.title_ar}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-mono">
                            <span>/news/{p.slug}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {p.category_en ? (
                            <Badge variant="outline" className="text-xs">
                              {p.category_en}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{new Date(p.published_at).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${p.featured ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => toggleFeatured(p, !p.featured)}
                            title={p.featured ? "Featured (Click to unfeature)" : "Not featured (Click to feature)"}
                          >
                            <Star className={`h-4 w-4 ${p.featured ? "fill-amber-500" : ""}`} />
                          </Button>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Switch checked={p.active} onCheckedChange={(v) => toggleActive(p, v)} />
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(p)}
                              className="h-8 px-2.5 text-xs text-foreground hover:text-accent hover:border-accent"
                              title="Edit post"
                            >
                              <Pencil className="h-3.5 w-3.5 me-1" />
                              Edit
                            </Button>

                            <a
                              href={`/news/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 w-8 inline-flex items-center justify-center border rounded-md text-muted-foreground hover:text-accent hover:border-accent transition-colors"
                              title="View live article"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!_perms.delete}
                              onClick={() => del(p.id, p.title_en || p.title_ar)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. CARDS / GRID VIEW */}
        {(view === "grid" || view === "list") && (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredPosts.map((p) => (
              <Card key={p.id} className="overflow-hidden hover:border-accent/50 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-24 h-20 rounded-lg overflow-hidden border bg-muted shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.featured && (
                          <Badge className="h-5 px-1.5 gap-1 bg-amber-500 hover:bg-amber-600 text-[10px]">
                            <Star className="h-2.5 w-2.5 fill-current" /> Featured
                          </Badge>
                        )}
                        <Badge variant={p.active ? "default" : "secondary"} className="h-5 px-1.5 text-[10px]">
                          {p.active ? "Active" : "Hidden"}
                        </Badge>
                        {p.category_en && (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                            {p.category_en}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm mt-1.5 line-clamp-1">{p.title_en || p.title_ar}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.excerpt_en || p.excerpt_ar}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground font-mono">/news/{p.slug}</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(p)}
                        className="h-7 text-xs"
                      >
                        <Pencil className="h-3 w-3 me-1" />
                        Edit
                      </Button>
                      <a
                        href={`/news/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-7 px-2 inline-flex items-center justify-center border rounded-md text-xs text-muted-foreground hover:text-accent hover:border-accent"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => del(p.id, p.title_en || p.title_ar)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Full Edit News Article Modal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Pencil className="h-5 w-5 text-accent" /> Edit News Article
            </DialogTitle>
          </DialogHeader>

          {editingPost && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="content">Content & Text</TabsTrigger>
                  <TabsTrigger value="media">Media & Meta</TabsTrigger>
                  <TabsTrigger value="seo">SEO & URL</TabsTrigger>
                </TabsList>

                {/* TAB 1: CONTENT */}
                <TabsContent value="content" className="space-y-4 pt-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title (English) *</Label>
                      <Input
                        value={editingPost.title_en}
                        onChange={(e) => setEditingPost({ ...editingPost, title_en: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان (عربي) *</Label>
                      <Input
                        dir="rtl"
                        value={editingPost.title_ar}
                        onChange={(e) => setEditingPost({ ...editingPost, title_ar: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Excerpt (EN)</Label>
                      <Textarea
                        rows={2}
                        value={editingPost.excerpt_en}
                        onChange={(e) => setEditingPost({ ...editingPost, excerpt_en: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>مقتطف (عربي)</Label>
                      <Textarea
                        dir="rtl"
                        rows={2}
                        value={editingPost.excerpt_ar}
                        onChange={(e) => setEditingPost({ ...editingPost, excerpt_ar: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Body Content (English)</Label>
                    <RichTextEditor
                      dir="ltr"
                      value={editingPost.body_en || ""}
                      onChange={(v) => setEditingPost({ ...editingPost, body_en: v })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>المحتوى بالتفصيل (عربي)</Label>
                    <RichTextEditor
                      dir="rtl"
                      value={editingPost.body_ar || ""}
                      onChange={(v) => setEditingPost({ ...editingPost, body_ar: v })}
                    />
                  </div>
                </TabsContent>

                {/* TAB 2: MEDIA & META */}
                <TabsContent value="media" className="space-y-4 pt-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category (EN)</Label>
                      <Input
                        value={editingPost.category_en}
                        onChange={(e) => setEditingPost({ ...editingPost, category_en: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الفئة (عربي)</Label>
                      <Input
                        dir="rtl"
                        value={editingPost.category_ar}
                        onChange={(e) => setEditingPost({ ...editingPost, category_ar: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingPost.image_url}
                        onChange={(e) => setEditingPost({ ...editingPost, image_url: e.target.value })}
                        className="flex-1"
                      />
                      <label className="cursor-pointer shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => void handleUpload(e.target.files?.[0] || null, "edit")}
                        />
                        <Button type="button" variant="outline" size="sm" asChild disabled={uploading === "edit"}>
                          <span>
                            {uploading === "edit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 me-1.5" />}
                            Upload
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>

                  {editingPost.image_url && (
                    <div className="w-32 h-20 rounded-lg overflow-hidden border bg-muted">
                      <img src={editingPost.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Published Date</Label>
                      <Input
                        type="date"
                        value={String(editingPost.published_at).slice(0, 10)}
                        onChange={(e) => setEditingPost({ ...editingPost, published_at: new Date(e.target.value).toISOString() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sort Order Index</Label>
                      <Input
                        type="number"
                        value={editingPost.sort_order}
                        onChange={(e) => setEditingPost({ ...editingPost, sort_order: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-3 border rounded-xl bg-muted/20">
                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      <span className="text-sm font-semibold">Active Status</span>
                      <Switch
                        checked={editingPost.active}
                        onCheckedChange={(v) => setEditingPost({ ...editingPost, active: v })}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      <span className="text-sm font-semibold">Featured Hero</span>
                      <Switch
                        checked={editingPost.featured}
                        onCheckedChange={(v) => setEditingPost({ ...editingPost, featured: v })}
                      />
                    </label>
                  </div>
                </TabsContent>

                {/* TAB 3: SEO */}
                <TabsContent value="seo" className="space-y-4 pt-3">
                  <div className="space-y-2">
                    <Label>Slug (URL Identifier)</Label>
                    <Input
                      value={editingPost.slug}
                      onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-") })}
                    />
                    <p className="text-xs text-muted-foreground font-mono">/news/{editingPost.slug}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SEO Title (EN)</Label>
                      <Input
                        value={editingPost.seo_title_en}
                        onChange={(e) => setEditingPost({ ...editingPost, seo_title_en: e.target.value })}
                        maxLength={70}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>عنوان SEO (عربي)</Label>
                      <Input
                        dir="rtl"
                        value={editingPost.seo_title_ar}
                        onChange={(e) => setEditingPost({ ...editingPost, seo_title_ar: e.target.value })}
                        maxLength={70}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SEO Description (EN)</Label>
                      <Textarea
                        rows={3}
                        value={editingPost.seo_description_en}
                        onChange={(e) => setEditingPost({ ...editingPost, seo_description_en: e.target.value })}
                        maxLength={160}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>وصف SEO (عربي)</Label>
                      <Textarea
                        dir="rtl"
                        rows={3}
                        value={editingPost.seo_description_ar}
                        onChange={(e) => setEditingPost({ ...editingPost, seo_description_ar: e.target.value })}
                        maxLength={160}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={editSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editSaving}>
                  {editSaving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}