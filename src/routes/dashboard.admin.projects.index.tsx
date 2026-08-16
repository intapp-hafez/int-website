import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useProjects, type Project } from "@/lib/projects-store";
import { Plus, Pencil, Trash2, Upload, Loader2, Save, X, ExternalLink } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useAdminT } from "@/lib/admin-i18n";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/projects/")({
  head: () => ({ meta: [{ title: "Projects — Admin" }] }),
  validateSearch: validateListSearch,
  component: ProjectsAdmin,
});
const PAGE_SIZE = 9;

type ProjectFormState = {
  id?: number;
  titleEn: string;
  titleAr: string;
  industry: string;
  descEn: string;
  descAr: string;
  image: string;
  active: boolean;
};

const emptyFormState: ProjectFormState = {
  titleEn: "",
  titleAr: "",
  industry: "",
  descEn: "",
  descAr: "",
  image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
  active: true,
};

function ProjectsAdmin() {
  const { items, add, update, remove, toggleActive } = useProjects();
  const [selected, setSelected] = useState<number[]>([]);
  const navigate = useNavigate();
  const { t, lang } = useAdminT();
  const isAr = lang === "ar";
  const can = useCanAccess("projects");

  // Modal Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProjectFormState>(emptyFormState);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });
  const sorted = useMemo(
    () =>
      sortItems(items, sort, dir, {
        id: (p) => p.id,
        title: (p) => (lang === "ar" ? (p.title?.ar || p.title?.en || "") : (p.title?.en || p.title?.ar || "")),
        industry: (p) => p.industry || "",
      }),
    [items, sort, dir, lang],
  );
  const pg = paginate(sorted, page, PAGE_SIZE);
  const pageIds = pg.items.map((p) => p.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const bulkDelete = () => { selected.forEach((id) => remove(id)); setSelected([]); };

  const handleOpenAdd = () => {
    setForm(emptyFormState);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setForm({
      id: p.id,
      titleEn: p.title?.en || "",
      titleAr: p.title?.ar || "",
      industry: p.industry || "",
      descEn: p.desc?.en || "",
      descAr: p.desc?.ar || "",
      image: p.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
      active: p.active !== false,
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

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
      setForm((prev) => ({ ...prev, image: data.publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (e: any) {
      toast.error(e?.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn && !form.titleAr) {
      toast.error("Please enter a title");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && form.id !== undefined) {
        await update(form.id, {
          title: { en: form.titleEn, ar: form.titleAr || form.titleEn },
          industry: form.industry || "General",
          desc: { en: form.descEn, ar: form.descAr || form.descEn },
          image: form.image,
          active: form.active,
        });
      } else {
        await add({
          title: { en: form.titleEn || form.titleAr, ar: form.titleAr || form.titleEn },
          industry: form.industry || "General",
          desc: { en: form.descEn || form.descAr, ar: form.descAr || form.descEn },
          image: form.image,
          active: form.active,
        });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap">
          <div>
            <CardTitle className="font-display text-xl">{t("projects")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {items.length} {isAr ? "مشروع مسجل" : "total projects"} • {items.filter(p => p.active).length} {isAr ? "منشور نشط" : "active"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle value={view} lang={lang as "en" | "ar"} />
            {can.add && (
              <Button onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 me-2" /> {t("addProject")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {view === "table" && (
            <BulkActionBar count={selected.length} onClear={() => setSelected([])} onDelete={can.delete ? bulkDelete : undefined} />
          )}

          {view === "table" && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"><Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} aria-label="Select all" /></TableHead>
                    <SortableHead field="id" sort={sort} dir={dir} onSort={toggleSort}>#</SortableHead>
                    <TableHead>{isAr ? "الصورة" : "Image"}</TableHead>
                    <SortableHead field="title" sort={sort} dir={dir} onSort={toggleSort}>{isAr ? "العنوان" : "Title"}</SortableHead>
                    <SortableHead field="industry" sort={sort} dir={dir} onSort={toggleSort}>{isAr ? "القطاع" : "Industry"}</SortableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-end">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pg.items.map(p => {
                    const title = lang === "ar" ? (p.title?.ar || p.title?.en || "مشروع") : (p.title?.en || p.title?.ar || "Project");
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/50">
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggleOne(p.id)} aria-label="Select row" />
                        </TableCell>
                        <TableCell className="font-mono text-xs">#{p.id}</TableCell>
                        <TableCell>
                          <img src={p.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80"} alt="" className="h-10 w-16 object-cover rounded" />
                        </TableCell>
                        <TableCell className="text-sm font-medium max-w-xs truncate">{title}</TableCell>
                        <TableCell><Badge variant="secondary">{p.industry}</Badge></TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={p.active}
                              onCheckedChange={(val) => void toggleActive(p.id, val)}
                            />
                            <span className="text-xs text-muted-foreground">{p.active ? (isAr ? "نشط" : "Active") : (isAr ? "مخفي" : "Off")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-end space-x-1" onClick={(e) => e.stopPropagation()}>
                          {can.edit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(p)}
                            >
                              <Pencil className="h-3.5 w-3.5 me-1" /> {t("edit")}
                            </Button>
                          )}
                          {can.delete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm(t("deleteConfirm"))) remove(p.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {view === "grid" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pg.items.map(p => {
                const title = lang === "ar" ? (p.title?.ar || p.title?.en || "مشروع") : (p.title?.en || p.title?.ar || "Project");
                const desc = lang === "ar" ? (p.desc?.ar || p.desc?.en || "") : (p.desc?.en || p.desc?.ar || "");
                return (
                  <article
                    key={p.id}
                    className={`border rounded-lg overflow-hidden bg-card transition-all duration-200 flex flex-col ${!p.active ? "opacity-60 bg-muted/20" : ""}`}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      <img src={p.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80"} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-2 end-2">
                        <Badge variant={p.active ? "default" : "secondary"} className="text-[10px] shadow">
                          {p.active ? (isAr ? "منشور" : "Live") : (isAr ? "معطل" : "Hidden")}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{p.industry}</Badge>
                          <span className="text-[10px] text-muted-foreground">#{p.id}</span>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{desc}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 border-t mt-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`switch-${p.id}`}
                            checked={p.active}
                            onCheckedChange={(val) => void toggleActive(p.id, val)}
                          />
                          <label htmlFor={`switch-${p.id}`} className="text-xs cursor-pointer select-none text-muted-foreground">
                            {p.active ? (isAr ? "نشط" : "Active") : (isAr ? "مخفي" : "Off")}
                          </label>
                        </div>

                        <div className="flex items-center gap-1">
                          {can.edit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(p)}
                            >
                              <Pencil className="h-3.5 w-3.5 me-1" /> {t("edit")}
                            </Button>
                          )}
                          {can.delete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm(t("deleteConfirm"))) remove(p.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {view === "list" && (
            <ul className="divide-y">
              {pg.items.map(p => {
                const title = lang === "ar" ? (p.title?.ar || p.title?.en || "مشروع") : (p.title?.en || p.title?.ar || "Project");
                const desc = lang === "ar" ? (p.desc?.ar || p.desc?.en || "") : (p.desc?.en || p.desc?.ar || "");
                return (
                  <li key={p.id} className="py-3 flex items-center gap-3 hover:bg-muted/40 px-2 -mx-2 rounded">
                    <img src={p.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80"} alt="" className="h-10 w-14 object-cover rounded shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{title}</div>
                      <div className="text-xs text-muted-foreground truncate">{desc}</div>
                    </div>
                    <Badge variant="secondary" className="hidden sm:inline-flex">{p.industry}</Badge>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.active}
                        onCheckedChange={(val) => void toggleActive(p.id, val)}
                      />
                      {can.edit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <Pencil className="h-3.5 w-3.5 me-1" /> {t("edit")}
                        </Button>
                      )}
                      {can.delete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(t("deleteConfirm"))) remove(p.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* INLINE EDIT / CREATE PROJECT MODAL DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <DialogTitle className="font-display text-xl">
              {isEditing ? (isAr ? `تعديل المشروع #${form.id}` : `Edit Project #${form.id}`) : (isAr ? "إضافة مشروع جديد" : "Add New Project")}
            </DialogTitle>
            <div className="flex items-center gap-2 me-6">
              <Switch
                id="modal-active"
                checked={form.active}
                onCheckedChange={(val) => setForm({ ...form, active: val })}
              />
              <Label htmlFor="modal-active" className="cursor-pointer text-xs">
                {form.active ? (isAr ? "نشط (منشور)" : "Active (Visible)") : (isAr ? "معطل (مخفي)" : "Hidden (Draft)")}
              </Label>
            </div>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="titleEn">{t("titleEn")} *</Label>
                <Input
                  id="titleEn"
                  dir="ltr"
                  value={form.titleEn}
                  onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                  placeholder="e.g. Smart City Infrastructure"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="titleAr">{t("titleAr")} *</Label>
                <Input
                  id="titleAr"
                  dir="rtl"
                  value={form.titleAr}
                  onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                  placeholder="مثال: البنية التحتية للمدينة الذكية"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="industry">{t("industry")}</Label>
                <Input
                  id="industry"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="e.g. Telecom, Oil & Gas, Healthcare"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="image">{t("image")} (URL or Upload)</Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://..."
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
            </div>

            {form.image && (
              <div className="relative aspect-[16/9] max-h-40 w-full rounded-lg overflow-hidden border bg-muted">
                <img src={form.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t("descEn")} (English)</Label>
                <span className="text-xs text-muted-foreground">Rich Text (LTR)</span>
              </div>
              <RichTextEditor
                dir="ltr"
                value={form.descEn}
                onChange={(val) => setForm({ ...form, descEn: val })}
                placeholder="Detailed project summary, scope, and engineering deliverables in English..."
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t("descAr")} (عربي)</Label>
                <span className="text-xs text-muted-foreground">محرر نصوص منسقة (RTL)</span>
              </div>
              <RichTextEditor
                dir="rtl"
                value={form.descAr}
                onChange={(val) => setForm({ ...form, descAr: val })}
                placeholder="ملخص تفاصيل ونطاق تنفيذ المشروع باللغة العربية..."
              />
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
                {isEditing ? (isAr ? "حفظ التعديلات" : "Save Changes") : (isAr ? "إضافة المشروع" : "Create Project")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}