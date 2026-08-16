import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServices, getServiceIcon, AVAILABLE_SERVICE_ICONS, DEFAULT_SERVICE_DELIVERABLES, type Service, type ServiceDeliverable } from "@/lib/services-store";
import { useAdminT } from "@/lib/admin-i18n";
import { Plus, Trash2, Pencil, ExternalLink, Save, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/services")({
  head: () => ({ meta: [{ title: "Services — Admin" }] }),
  validateSearch: validateListSearch,
  component: ServicesAdminPage,
});
const PAGE_SIZE = 10;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

function ServicesAdminPage() {
  const { lang } = useAdminT();
  const isAr = lang === "ar";
  const can = useCanAccess("services");
  const { services, upsert, togglePublish, remove } = useServices();
  const [selected, setSelected] = useState<string[]>([]);
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<Service | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const publishedCount = services.filter((i) => i.published).length;
  const sorted = useMemo(
    () =>
      sortItems(services, sort, dir, {
        slug: (s) => s.slug,
        title: (s) => (lang === "ar" ? s.title.ar : s.title.en),
        status: (s) => (s.published ? 1 : 0),
      }),
    [services, sort, dir, lang],
  );
  const pg = paginate(sorted, page, PAGE_SIZE);
  const pageIds = pg.items.map((s) => s.slug);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const bulkDelete = () => {
    selected.forEach((slug) => void remove(slug));
    setSelected([]);
  };
  const bulkPublish = (v: string) => {
    const published = v === "publish";
    selected.forEach((slug) => void togglePublish(slug, published));
    setSelected([]);
  };

  const handleOpenAdd = () => {
    const slug = `service-${Date.now().toString().slice(-4)}`;
    setEditingItem({
      slug,
      title: { en: "", ar: "" },
      desc: { en: "", ar: "" },
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
      iconName: "Layers",
      published: true,
      sortOrder: services.length,
      features: [
        { en: "Enterprise Architecture & Engineering Design", ar: "التصميم والمعمارية الهندسية المتطورة" },
        { en: "Vendor-Neutral Multi-Brand Technology Selection", ar: "اختيار محايد للموردين متعددي المصنعين" },
        { en: "Turnkey Implementation & Project Governance", ar: "تنفيذ وإدارة شاملة للمشروع حتى التسليم" },
        { en: "24/7 SLA Lifecycle Support & Maintenance", ar: "دعم فني مستمر 24/7 وصيانة وقائية معتمدة" },
      ],
      seo: { metaTitle: { en: "", ar: "" }, metaDescription: { en: "", ar: "" } },
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (s: Service) => {
    const defaultFeatures = DEFAULT_SERVICE_DELIVERABLES[s.slug] || [
      { en: "Architecture & engineering design", ar: "التصميم والمعمارية الهندسية" },
      { en: "Turnkey project execution & testing", ar: "تنفيذ واختبار شامل للمشروع" },
    ];

    setEditingItem({
      slug: s.slug,
      title: { en: s.title?.en || "", ar: s.title?.ar || "" },
      desc: { en: s.desc?.en || "", ar: s.desc?.ar || "" },
      image: s.image || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
      iconName: s.iconName || "Layers",
      published: s.published !== false,
      sortOrder: s.sortOrder ?? 0,
      features: s.features && s.features.length > 0 ? s.features : defaultFeatures,
      seo: {
        metaTitle: { en: s.seo?.metaTitle?.en || "", ar: s.seo?.metaTitle?.ar || "" },
        metaDescription: { en: s.seo?.metaDescription?.en || "", ar: s.seo?.metaDescription?.ar || "" },
        keywords: s.seo?.keywords || "",
        ogImage: s.seo?.ogImage || "",
        canonicalUrl: s.seo?.canonicalUrl || "",
      },
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
      const path = `services/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("slide-images")
        .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("slide-images").getPublicUrl(path);
      if (editingItem) {
        setEditingItem({ ...editingItem, image: data.publicUrl });
      }
      toast.success("Image uploaded successfully");
    } catch (e: any) {
      toast.error(e?.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAddFeature = () => {
    if (!editingItem) return;
    setEditingItem({
      ...editingItem,
      features: [...(editingItem.features || []), { en: "", ar: "" }],
    });
  };

  const handleUpdateFeature = (idx: number, lang: "en" | "ar", val: string) => {
    if (!editingItem) return;
    const next = [...(editingItem.features || [])];
    next[idx] = { ...next[idx], [lang]: val };
    setEditingItem({ ...editingItem, features: next });
  };

  const handleRemoveFeature = (idx: number) => {
    if (!editingItem) return;
    setEditingItem({
      ...editingItem,
      features: editingItem.features.filter((_, i) => i !== idx),
    });
  };

  const handleSaveDialog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.title.en && !editingItem.title.ar) {
      toast.error(isAr ? "يرجى إدخال عنوان الخدمة" : "Please enter a service title");
      return;
    }

    setSaving(true);
    try {
      await upsert({
        ...editingItem,
        title: {
          en: editingItem.title.en || editingItem.title.ar,
          ar: editingItem.title.ar || editingItem.title.en,
        },
        desc: {
          en: editingItem.desc.en || editingItem.desc.ar,
          ar: editingItem.desc.ar || editingItem.desc.en,
        },
        features: (editingItem.features || []).filter((f) => f.en.trim() || f.ar.trim()),
      });
      toast.success(isAr ? "تم حفظ الخدمة بنجاح" : "Service saved successfully");
      setDialogOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            {lang === "ar" ? "الخدمات" : "Services"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar"
              ? "إدارة الخدمات الهندسية الظاهرة على الموقع وتحديث التفاصيل ومخرجات التسليم ومحرر النصوص."
              : "Manage enterprise services published on the website in English and Arabic with rich text and deliverables."}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary">
              {publishedCount} {lang === "ar" ? "منشورة نشطة" : "published"}
            </Badge>
            <Badge variant="outline">
              {services.length} {lang === "ar" ? "إجمالي" : "total"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle value={view} lang={lang as "en" | "ar"} />
          {can.add && (
            <Button onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 me-1" /> {lang === "ar" ? "إضافة خدمة" : "Add Service"}
            </Button>
          )}
        </div>
      </div>

      {view === "table" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="p-3 pb-0">
              <BulkActionBar
                count={selected.length}
                onClear={() => setSelected([])}
                onDelete={can.delete ? bulkDelete : undefined}
                statusOptions={[
                  { value: "publish", label: lang === "ar" ? "نشر المحدد" : "Publish selected" },
                  { value: "draft", label: lang === "ar" ? "تعطيل المحدد" : "Unpublish selected" },
                ]}
                onStatusChange={bulkPublish}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"><Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} aria-label="Select all" /></TableHead>
                  <TableHead>{lang === "ar" ? "الأيقونة" : "Icon"}</TableHead>
                  <SortableHead field="slug" sort={sort} dir={dir} onSort={toggleSort}>{lang === "ar" ? "المعرف" : "Slug"}</SortableHead>
                  <SortableHead field="title" sort={sort} dir={dir} onSort={toggleSort}>{lang === "ar" ? "العنوان" : "Title"}</SortableHead>
                  <TableHead>{lang === "ar" ? "الوصف" : "Description"}</TableHead>
                  <SortableHead field="status" sort={sort} dir={dir} onSort={toggleSort}>{lang === "ar" ? "الحالة" : "Status"}</SortableHead>
                  <TableHead className="text-end">{lang === "ar" ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.items.map((s) => {
                  const Icon = getServiceIcon(s.iconName);
                  const title = lang === "ar" ? (s.title?.ar || s.title?.en) : (s.title?.en || s.title?.ar);
                  const plainDesc = stripHtml(lang === "ar" ? (s.desc?.ar || s.desc?.en || "") : (s.desc?.en || s.desc?.ar || ""));

                  return (
                    <TableRow key={s.slug} className="hover:bg-muted/50">
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.includes(s.slug)} onCheckedChange={() => toggleOne(s.slug)} aria-label="Select row" />
                      </TableCell>
                      <TableCell>
                        <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                          <Icon className="h-5 w-5" />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.slug}</TableCell>
                      <TableCell className="text-sm font-medium">{title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground line-clamp-2 max-w-xs">{plainDesc}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={s.published}
                            onCheckedChange={(val) => void togglePublish(s.slug, val)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {s.published ? (lang === "ar" ? "نشط" : "Live") : (lang === "ar" ? "مخفي" : "Draft")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-end space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/services/$slug" params={{ slug: s.slug }} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        {can.edit && (
                          <Button size="sm" variant="outline" onClick={() => handleOpenEdit(s)}>
                            <Pencil className="h-3.5 w-3.5 me-1" /> {lang === "ar" ? "تحرير" : "Edit"}
                          </Button>
                        )}
                        {can.delete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm(lang === "ar" ? "هل أنت متأكد من حذف هذه الخدمة؟" : "Delete this service?")) {
                                void remove(s.slug);
                              }
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
            <div className="p-3"><Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} /></div>
          </CardContent>
        </Card>
      )}

      {view === "list" && (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {pg.items.map((s) => {
                const Icon = getServiceIcon(s.iconName);
                const title = lang === "ar" ? (s.title?.ar || s.title?.en) : (s.title?.en || s.title?.ar);
                const plainDesc = stripHtml(lang === "ar" ? (s.desc?.ar || s.desc?.en || "") : (s.desc?.en || s.desc?.ar || ""));

                return (
                  <li key={s.slug} className="p-3 flex items-center gap-3 hover:bg-muted/40">
                    <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <code className="text-xs bg-muted px-2 py-1 rounded shrink-0">{s.slug}</code>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{title}</div>
                      <div className="text-xs text-muted-foreground truncate">{plainDesc}</div>
                    </div>
                    {s.published ? (
                      <Badge className="bg-emerald-100 text-emerald-900 border-0">{lang === "ar" ? "منشورة" : "Published"}</Badge>
                    ) : (
                      <Badge variant="outline">{lang === "ar" ? "مسودة" : "Draft"}</Badge>
                    )}
                    <Switch checked={s.published} onCheckedChange={(val) => void togglePublish(s.slug, val)} />
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/services/$slug" params={{ slug: s.slug }} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    {can.edit && (
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(s)}>
                        <Pencil className="h-3.5 w-3.5 me-1" /> {lang === "ar" ? "تحرير" : "Edit"}
                      </Button>
                    )}
                    {can.delete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(lang === "ar" ? "هل أنت متأكد من حذف هذه الخدمة؟" : "Delete this service?")) {
                            void remove(s.slug);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="p-3"><Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} /></div>
          </CardContent>
        </Card>
      )}

      {view === "grid" && (
        <>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pg.items.map((s) => {
            const Icon = getServiceIcon(s.iconName);
            const title = lang === "ar" ? (s.title?.ar || s.title?.en) : (s.title?.en || s.title?.ar);
            const plainDesc = stripHtml(lang === "ar" ? (s.desc?.ar || s.desc?.en || "") : (s.desc?.en || s.desc?.ar || ""));

            return (
              <Card key={s.slug} className="flex flex-col justify-between">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{s.slug}</code>
                      {s.published ? (
                        <Badge className="bg-emerald-100 text-emerald-900 border-0">{lang === "ar" ? "منشورة" : "Published"}</Badge>
                      ) : (
                        <Badge variant="outline">{lang === "ar" ? "مسودة" : "Draft"}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-base font-semibold">{title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{plainDesc}</div>
                </CardContent>

                <div className="p-4 pt-0 border-t mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`pub-${s.slug}`}
                      checked={s.published}
                      onCheckedChange={(val) => void togglePublish(s.slug, val)}
                    />
                    <Label htmlFor={`pub-${s.slug}`} className="text-xs text-muted-foreground">
                      {s.published ? (lang === "ar" ? "نشط" : "Live") : (lang === "ar" ? "مخفي" : "Draft")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/services/$slug" params={{ slug: s.slug }} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    {can.edit && (
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(s)}>
                        <Pencil className="h-3.5 w-3.5 me-1" /> {lang === "ar" ? "تحرير" : "Edit"}
                      </Button>
                    )}
                    {can.delete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(lang === "ar" ? "هل أنت متأكد من حذف هذه الخدمة؟" : "Delete this service?")) {
                            void remove(s.slug);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <Paginator page={pg.page} pageCount={pg.pageCount} total={sorted.length} start={pg.start} end={pg.end} onPageChange={setPage} />
        </>
      )}

      {/* SERVICE EDIT/CREATE DIALOG WITH RICHTEXT, DELIVERABLES & IMAGE UPLOAD */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <DialogTitle className="font-display text-xl">
              {editingItem
                ? isEditing
                  ? (isAr ? `تعديل خدمة (${editingItem.slug})` : `Edit Service (${editingItem.slug})`)
                  : (isAr ? "إضافة خدمة جديدة" : "Add New Service")
                : ""}
            </DialogTitle>
            {editingItem && (
              <div className="flex items-center gap-2 me-6">
                <Switch
                  id="modal-srv-pub"
                  checked={editingItem.published}
                  onCheckedChange={(val) => setEditingItem({ ...editingItem, published: val })}
                />
                <Label htmlFor="modal-srv-pub" className="cursor-pointer text-xs">
                  {editingItem.published ? (isAr ? "نشط (منشور)" : "Active (Live)") : (isAr ? "معطل (مسودة)" : "Draft (Hidden)")}
                </Label>
              </div>
            )}
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleSaveDialog} className="space-y-4 py-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{isAr ? "العنوان بالإنجليزية" : "Title (EN)"} *</Label>
                  <Input
                    dir="ltr"
                    value={editingItem.title.en}
                    onChange={(e) => setEditingItem({ ...editingItem, title: { ...editingItem.title, en: e.target.value } })}
                    placeholder="e.g. Enterprise Security Systems"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{isAr ? "العنوان بالعربية" : "Title (AR)"} *</Label>
                  <Input
                    dir="rtl"
                    value={editingItem.title.ar}
                    onChange={(e) => setEditingItem({ ...editingItem, title: { ...editingItem.title, ar: e.target.value } })}
                    placeholder="مثال: أنظمة الأمن والمراقبة المؤسسية"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{isAr ? "المعرف (Slug)" : "Slug (URL identifier)"}</Label>
                  <Input
                    dir="ltr"
                    value={editingItem.slug}
                    onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-") })}
                    placeholder="e.g. security-systems"
                    disabled={isEditing}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{isAr ? "أيقونة الخدمة" : "Service Icon"}</Label>
                  <Select
                    value={editingItem.iconName}
                    onValueChange={(val) => setEditingItem({ ...editingItem, iconName: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_SERVICE_ICONS.map((ico) => {
                        const IconComponent = ico.icon;
                        return (
                          <SelectItem key={ico.name} value={ico.name}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-accent" />
                              <span>{ico.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{isAr ? "صورة الخدمة" : "Service Image (URL or Upload)"}</Label>
                <div className="flex gap-2">
                  <Input
                    value={editingItem.image}
                    onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
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

              {editingItem.image && (
                <div className="relative aspect-[21/9] max-h-36 w-full rounded-lg overflow-hidden border bg-muted">
                  <img src={editingItem.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>{isAr ? "الوصف بالإنجليزية" : "Description (EN)"}</Label>
                  <span className="text-xs text-muted-foreground">Rich Text (LTR)</span>
                </div>
                <RichTextEditor
                  dir="ltr"
                  value={editingItem.desc.en}
                  onChange={(val) => setEditingItem({ ...editingItem, desc: { ...editingItem.desc, en: val } })}
                  placeholder="Write the full service description, methodology, and deliverables in English..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>{isAr ? "الوصف بالعربية" : "الوصف (AR)"}</Label>
                  <span className="text-xs text-muted-foreground">محرر نصوص منسقة (RTL)</span>
                </div>
                <RichTextEditor
                  dir="rtl"
                  value={editingItem.desc.ar}
                  onChange={(val) => setEditingItem({ ...editingItem, desc: { ...editingItem.desc, ar: val } })}
                  placeholder="اكتب وصف الخدمة الشامل ومنهجية التنفيذ بالعربية..."
                />
              </div>

              {/* WHAT WE DELIVER / DELIVERABLES */}
              <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      {isAr ? "ما نقدمه في هذه الخدمة (المخرجات والتسليمات)" : "What We Deliver (Key Features & Scope)"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAr ? "العناصر والمميزات التي تظهر في صفحة تفاصيل الخدمة." : "Deliverable bullet items displayed on the public service detail page."}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddFeature}>
                    <Plus className="h-3.5 w-3.5 me-1" />
                    {isAr ? "إضافة عنصر" : "Add item"}
                  </Button>
                </div>

                <div className="space-y-2 pt-1">
                  {(editingItem.features || []).map((feat, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2 rounded-md bg-background border">
                      <div className="sm:col-span-5">
                        <Input
                          dir="ltr"
                          placeholder="Feature in English"
                          value={feat.en}
                          onChange={(e) => handleUpdateFeature(idx, "en", e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <Input
                          dir="rtl"
                          placeholder="الميزة أو التسليم بالعربية"
                          value={feat.ar}
                          onChange={(e) => handleUpdateFeature(idx, "ar", e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={() => handleRemoveFeature(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!editingItem.features || editingItem.features.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      {isAr ? "لا توجد مخرجات مضافة. انقر على 'إضافة عنصر' لإنشاء تسليمات." : "No deliverables added. Click 'Add item' above."}
                    </p>
                  )}
                </div>
              </div>

              {/* SEO SETTINGS */}
              <div className="rounded-md border p-4 bg-muted/30 space-y-3">
                <div>
                  <div className="font-semibold text-sm">{isAr ? "تحسين محركات البحث (SEO)" : "SEO Settings"}</div>
                  <div className="text-xs text-muted-foreground">{isAr ? "بيانات وصفية لمحركات البحث ومشاركات التواصل الاجتماعي." : "Search-engine metadata for this service."}</div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Meta title (EN)</Label>
                    <Input
                      maxLength={70}
                      value={editingItem.seo?.metaTitle?.en ?? ""}
                      onChange={(e) => setEditingItem({ ...editingItem, seo: { ...editingItem.seo, metaTitle: { en: e.target.value, ar: editingItem.seo?.metaTitle?.ar ?? "" } } })}
                      placeholder="≤ 60 chars"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>عنوان ميتا (AR)</Label>
                    <Input
                      dir="rtl"
                      maxLength={70}
                      value={editingItem.seo?.metaTitle?.ar ?? ""}
                      onChange={(e) => setEditingItem({ ...editingItem, seo: { ...editingItem.seo, metaTitle: { en: editingItem.seo?.metaTitle?.en ?? "", ar: e.target.value } } })}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Meta description (EN)</Label>
                    <Textarea
                      rows={2}
                      maxLength={180}
                      value={editingItem.seo?.metaDescription?.en ?? ""}
                      onChange={(e) => setEditingItem({ ...editingItem, seo: { ...editingItem.seo, metaDescription: { en: e.target.value, ar: editingItem.seo?.metaDescription?.ar ?? "" } } })}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>وصف ميتا (AR)</Label>
                    <Textarea
                      dir="rtl"
                      rows={2}
                      maxLength={180}
                      value={editingItem.seo?.metaDescription?.ar ?? ""}
                      onChange={(e) => setEditingItem({ ...editingItem, seo: { ...editingItem.seo, metaDescription: { en: editingItem.seo?.metaDescription?.en ?? "", ar: e.target.value } } })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={saving || uploading}>
                  {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
                  {isEditing ? (isAr ? "حفظ التغييرات" : "Save Changes") : (isAr ? "إضافة الخدمة" : "Create Service")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}