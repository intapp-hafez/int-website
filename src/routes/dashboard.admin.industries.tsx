import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useIndustries, type IndustryItem } from "@/lib/industries-store";
import {
  Trash2,
  Plus,
  Loader2,
  Upload,
  ImageIcon,
  ArrowUp,
  ArrowDown,
  Building2,
  Check,
  ExternalLink,
  Pencil,
  Save,
  LayoutList,
  Table as TableIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/admin/industries")({
  head: () => ({ meta: [{ title: "Industries — Admin" }] }),
  component: IndustriesAdminPage,
});

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_BYTES = 5 * 1024 * 1024;

function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Unsupported format. Use PNG, JPG, or WEBP.";
  if (file.size > MAX_BYTES) return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`;
  return null;
}

async function uploadIndustryImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `industries/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("slide-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("slide-images").getPublicUrl(path);
  return data.publicUrl;
}

function IndustriesAdminPage() {
  const { industries, loading, upsert, remove, move } = useIndustries();
  const sorted = [...industries].sort((a, b) => a.sort_order - b.sort_order);
  const [saving, setSaving] = useState(false);
  const emptyDraft = { title_en: "", title_ar: "", image: "", slug: "", active: true, sort_order: 0 };
  const [draft, setDraft] = useState(emptyDraft);
  const [uploading, setUploading] = useState<string | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<IndustryItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editUploading, setEditUploading] = useState(false);

  const handleDraftUpload = async (file: File | null) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast.error(err);
    const localPreview = URL.createObjectURL(file);
    setDraft((d) => ({ ...d, image: localPreview }));
    setUploading("draft");
    try {
      const url = await uploadIndustryImage(file);
      setDraft((d) => ({ ...d, image: url }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(null);
      setTimeout(() => URL.revokeObjectURL(localPreview), 2000);
    }
  };

  const handleEditUpload = async (file: File | null) => {
    if (!file || !editingItem) return;
    const err = validateImage(file);
    if (err) return toast.error(err);
    const localPreview = URL.createObjectURL(file);
    setEditingItem((prev) => (prev ? { ...prev, image: localPreview } : null));
    setEditUploading(true);
    try {
      const url = await uploadIndustryImage(file);
      setEditingItem((prev) => (prev ? { ...prev, image: url } : null));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setEditUploading(false);
      setTimeout(() => URL.revokeObjectURL(localPreview), 2000);
    }
  };

  const handleReplace = async (item: IndustryItem, file: File | null) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast.error(err);
    setUploading(item.id);
    try {
      const url = await uploadIndustryImage(file);
      await upsert({ ...item, image: url });
      toast.success("Image updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const add = async () => {
    if (!draft.title_en && !draft.title_ar) return toast.error("Enter a title (EN or AR)");
    setSaving(true);
    try {
      const slug = draft.slug || draft.title_en.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await upsert({
        ...draft,
        slug,
        image: draft.image || "https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?w=800&q=80",
        sort_order: industries.length,
      });
      toast.success("Industry added");
      setDraft(emptyDraft);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add industry");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.title_en && !editingItem.title_ar) {
      toast.error("Title (EN or AR) is required");
      return;
    }
    setEditSaving(true);
    try {
      const slug = editingItem.slug || editingItem.title_en.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await upsert({
        ...editingItem,
        slug,
      });
      toast.success("Industry updated successfully");
      setEditDialogOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update industry");
    } finally {
      setEditSaving(false);
    }
  };

  const openEditModal = (item: IndustryItem) => {
    setEditingItem({ ...item });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold">Industries & Sectors</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {sorted.length} Total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage industry verticals, cover visuals, slug routing, and display order.
          </p>
        </div>
      </div>

      {/* Add New Industry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent" /> Add New Industry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title (English)</Label>
              <Input
                value={draft.title_en}
                onChange={(e) => setDraft({ ...draft, title_en: e.target.value })}
                placeholder="e.g. Telecom"
              />
            </div>
            <div className="space-y-2">
              <Label>Title (Arabic)</Label>
              <Input
                value={draft.title_ar}
                onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })}
                placeholder="مثال: الاتصالات"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Slug (URL Identifier)</Label>
              <Input
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-") })}
                placeholder="e.g. telecom (auto-generated if empty)"
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Image (Upload file or paste URL)</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={draft.image}
                  onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1"
                />
                <label className="cursor-pointer shrink-0">
                  <input
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    className="hidden"
                    onChange={(e) => void handleDraftUpload(e.target.files?.[0] || null)}
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
          </div>

          {draft.image && (
            <div className="w-24 h-28 rounded-lg overflow-hidden border bg-muted">
              <img src={draft.image} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          <Button onClick={() => void add()} disabled={saving || (!draft.title_en && !draft.title_ar)}>
            {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Plus className="h-4 w-4 me-2" />}
            Add Industry
          </Button>
        </CardContent>
      </Card>

      {/* Existing Industries List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent" /> Active Industries ({sorted.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading industries...
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No industries found. Add your first industry above.
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 p-4 border rounded-xl bg-card hover:border-accent/50 transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden border bg-muted shrink-0 group">
                      <img src={item.image} alt={item.title_en} className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <input
                          type="file"
                          accept={ACCEPTED_TYPES.join(",")}
                          className="hidden"
                          onChange={(e) => void handleReplace(item, e.target.files?.[0] || null)}
                        />
                        {uploading === item.id ? (
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 text-white" />
                        )}
                      </label>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{item.title_en || "Untitled"}</span>
                        <span className="text-muted-foreground font-normal">/</span>
                        <span className="text-muted-foreground" dir="rtl">{item.title_ar}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded">#{idx + 1}</span>
                        <span>slug: {item.slug}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ms-auto">
                    <div className="flex items-center gap-1.5 me-2">
                      <Switch
                        checked={item.active}
                        onCheckedChange={(checked) => void upsert({ ...item, active: checked })}
                      />
                      <span className="text-xs text-muted-foreground">{item.active ? "Active" : "Hidden"}</span>
                    </div>

                    {/* Edit Option Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(item)}
                      className="h-8 px-2.5 text-xs text-foreground hover:text-accent hover:border-accent"
                      title="Edit Industry"
                    >
                      <Pencil className="h-3.5 w-3.5 me-1.5" />
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={idx === 0}
                      onClick={() => void move(item.id, -1)}
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={idx === sorted.length - 1}
                      onClick={() => void move(item.id, 1)}
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Remove "${item.title_en || item.title_ar}"?`)) {
                          void remove(item.id);
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Industry Modal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Pencil className="h-5 w-5 text-accent" /> Edit Industry
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title (English) *</Label>
                <Input
                  value={editingItem.title_en}
                  onChange={(e) => setEditingItem({ ...editingItem, title_en: e.target.value })}
                  placeholder="e.g. Telecom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Title (Arabic) *</Label>
                <Input
                  value={editingItem.title_ar}
                  onChange={(e) => setEditingItem({ ...editingItem, title_ar: e.target.value })}
                  placeholder="مثال: الاتصالات"
                  dir="rtl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Slug (URL Identifier)</Label>
                <Input
                  value={editingItem.slug}
                  onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-") })}
                  placeholder="e.g. telecom"
                />
              </div>

              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={editingItem.image}
                    onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 text-xs"
                  />
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept={ACCEPTED_TYPES.join(",")}
                      className="hidden"
                      onChange={(e) => void handleEditUpload(e.target.files?.[0] || null)}
                    />
                    <Button type="button" variant="outline" size="sm" asChild disabled={editUploading}>
                      <span>
                        {editUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 me-1" />}
                        Upload
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {editingItem.image && (
                <div className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30">
                  <div className="w-14 h-16 rounded-md overflow-hidden border bg-muted shrink-0">
                    <img src={editingItem.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    Image preview active
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <Label htmlFor="edit-active" className="text-sm font-semibold cursor-pointer">
                    Active Status
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {editingItem.active ? "Visible on homepage & catalog" : "Hidden from website visitors"}
                  </p>
                </div>
                <Switch
                  id="edit-active"
                  checked={editingItem.active}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, active: checked })}
                />
              </div>

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
