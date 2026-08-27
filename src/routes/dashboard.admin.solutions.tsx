import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  useSolutions,
  AVAILABLE_SOLUTION_ICONS,
  getSolutionIcon,
  stripHtml,
  type SolutionRow,
  type RelatedSolutionItem,
  type VendorItem,
} from "@/lib/solutions-store";
import { useAdminT } from "@/lib/admin-i18n";
import {
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  Save,
  Upload,
  Loader2,
  CheckCircle2,
  Layers,
  Workflow,
  Building2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Globe,
  Sparkles,
  Search,
  Check,
  X,
  Link as LinkIcon,
  Shield,
  HelpCircle,
} from "lucide-react";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/solutions")({
  head: () => ({ meta: [{ title: "Solutions — Admin" }] }),
  validateSearch: validateListSearch,
  component: SolutionsAdminPage,
});

const PAGE_SIZE = 10;

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Unsupported format. Use PNG, JPG, WEBP, SVG or GIF.";
  if (file.size > MAX_BYTES) return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`;
  return null;
}

async function uploadFile(file: File, folder = "solutions"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("slide-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("slide-images").getPublicUrl(path);
  return data.publicUrl;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function SolutionsAdminPage() {
  const { lang, t } = useAdminT();
  const isAr = lang === "ar";
  const can = useCanAccess("solutions");
  const { solutions, loading, upsert, remove, toggleActive, move } = useSolutions();
  const [selected, setSelected] = useState<string[]>([]);
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVendorLogo, setUploadingVendorLogo] = useState(false);
  const [formTab, setFormTab] = useState<"basic" | "related" | "vendors">("basic");

  // Form State
  const emptySolution: SolutionRow = {
    id: "",
    slug: "",
    name_en: "",
    name_ar: "",
    bio_en: "",
    bio_ar: "",
    image: "",
    related_solutions: [],
    vendors: [],
    active: true,
    sort_order: 0,
  };

  const [formData, setFormData] = useState<SolutionRow>(emptySolution);

  // Sub-item drafts
  const [relatedDraft, setRelatedDraft] = useState<RelatedSolutionItem>({
    id: "",
    icon: "Network",
    title_en: "",
    title_ar: "",
    bio_en: "",
    bio_ar: "",
  });
  const [editingRelatedId, setEditingRelatedId] = useState<string | null>(null);

  const [vendorDraft, setVendorDraft] = useState<VendorItem>({
    id: "",
    name: "",
    logo: "",
    website_url: "",
  });
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  // Stats
  const totalSolutions = solutions.length;
  const activeSolutions = solutions.filter((s) => s.active).length;
  const totalRelated = solutions.reduce((acc, s) => acc + (s.related_solutions?.length || 0), 0);
  const totalVendors = solutions.reduce((acc, s) => acc + (s.vendors?.length || 0), 0);

  // Sort & Filter
  const sorted = useMemo(() => {
    return sortItems(solutions, sort, dir, {
      slug: (s) => s.slug,
      name: (s) => (lang === "ar" ? s.name_ar : s.name_en),
      status: (s) => (s.active ? 1 : 0),
    });
  }, [solutions, sort, dir, lang]);

  const pg = paginate(sorted, page, PAGE_SIZE);
  const pageIds = pg.items.map((s) => s.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));

  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const bulkDelete = () => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف الحلول المحددة؟" : "Are you sure you want to delete selected solutions?")) return;
    selected.forEach((id) => void remove(id));
    setSelected([]);
  };

  const bulkActive = (v: string) => {
    const active = v === "active";
    selected.forEach((id) => void toggleActive(id, active));
    setSelected([]);
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    const id = crypto.randomUUID();
    const slug = `solution-${Date.now().toString().slice(-4)}`;
    setFormData({
      ...emptySolution,
      id,
      slug,
      image: "https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?w=1200&q=80",
      sort_order: solutions.length,
    });
    setRelatedDraft({ id: "", icon: "Network", title_en: "", title_ar: "", bio_en: "", bio_ar: "" });
    setEditingRelatedId(null);
    setVendorDraft({ id: "", name: "", logo: "", website_url: "" });
    setEditingVendorId(null);
    setFormTab("basic");
    setIsEditing(false);
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (sol: SolutionRow) => {
    setFormData({
      ...sol,
      related_solutions: sol.related_solutions || [],
      vendors: sol.vendors || [],
    });
    setRelatedDraft({ id: "", icon: "Network", title_en: "", title_ar: "", bio_en: "", bio_ar: "" });
    setEditingRelatedId(null);
    setVendorDraft({ id: "", name: "", logo: "", website_url: "" });
    setEditingVendorId(null);
    setFormTab("basic");
    setIsEditing(true);
    setDialogOpen(true);
  };

  // Main Image Upload
  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast.error(err);

    setUploadingImage(true);
    try {
      const url = await uploadFile(file, "solutions");
      setFormData((prev) => ({ ...prev, image: url }));
      toast.success(isAr ? "تم رفع الصورة بنجاح" : "Image uploaded successfully");
    } catch (e: any) {
      toast.error(e?.message || (isAr ? "فشل رفع الصورة" : "Failed to upload image"));
    } finally {
      setUploadingImage(false);
    }
  };

  // Vendor Logo Upload
  const handleVendorLogoUpload = async (file: File | null) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast.error(err);

    setUploadingVendorLogo(true);
    try {
      const url = await uploadFile(file, "vendors");
      setVendorDraft((prev) => ({ ...prev, logo: url }));
      toast.success(isAr ? "تم رفع الشعار بنجاح" : "Logo uploaded successfully");
    } catch (e: any) {
      toast.error(e?.message || (isAr ? "فشل رفع الشعار" : "Failed to upload logo"));
    } finally {
      setUploadingVendorLogo(false);
    }
  };

  // Related Solution Add/Update
  const handleSaveRelatedItem = () => {
    if (!relatedDraft.title_en.trim() && !relatedDraft.title_ar.trim()) {
      return toast.error(isAr ? "يرجى إدخال عنوان للحل الفرعي" : "Please enter a title for the related solution");
    }

    if (editingRelatedId) {
      // Update existing
      setFormData((prev) => ({
        ...prev,
        related_solutions: prev.related_solutions.map((item) =>
          item.id === editingRelatedId ? { ...relatedDraft, id: editingRelatedId } : item
        ),
      }));
      toast.success(isAr ? "تم تحديث الحل الفرعي" : "Related solution updated");
    } else {
      // Add new
      const newItem: RelatedSolutionItem = {
        ...relatedDraft,
        id: `rel-${Date.now().toString().slice(-6)}`,
      };
      setFormData((prev) => ({
        ...prev,
        related_solutions: [...prev.related_solutions, newItem],
      }));
      toast.success(isAr ? "تمت إضافة الحل الفرعي" : "Related solution added");
    }

    // Reset draft
    setRelatedDraft({ id: "", icon: "Network", title_en: "", title_ar: "", bio_en: "", bio_ar: "" });
    setEditingRelatedId(null);
  };

  const handleEditRelatedItem = (item: RelatedSolutionItem) => {
    setRelatedDraft({ ...item });
    setEditingRelatedId(item.id);
  };

  const handleDeleteRelatedItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      related_solutions: prev.related_solutions.filter((r) => r.id !== id),
    }));
    if (editingRelatedId === id) {
      setRelatedDraft({ id: "", icon: "Network", title_en: "", title_ar: "", bio_en: "", bio_ar: "" });
      setEditingRelatedId(null);
    }
  };

  // Vendor Add/Update
  const handleSaveVendorItem = () => {
    if (!vendorDraft.name.trim()) {
      return toast.error(isAr ? "يرجى إدخال اسم المورد أو الشريك" : "Please enter the vendor name");
    }

    if (editingVendorId) {
      // Update existing
      setFormData((prev) => ({
        ...prev,
        vendors: prev.vendors.map((v) =>
          v.id === editingVendorId ? { ...vendorDraft, id: editingVendorId } : v
        ),
      }));
      toast.success(isAr ? "تم تحديث المورد" : "Vendor updated");
    } else {
      // Add new
      const newItem: VendorItem = {
        ...vendorDraft,
        id: `ven-${Date.now().toString().slice(-6)}`,
      };
      setFormData((prev) => ({
        ...prev,
        vendors: [...prev.vendors, newItem],
      }));
      toast.success(isAr ? "تمت إضافة المورد" : "Vendor added");
    }

    // Reset vendor draft
    setVendorDraft({ id: "", name: "", logo: "", website_url: "" });
    setEditingVendorId(null);
  };

  const handleEditVendorItem = (item: VendorItem) => {
    setVendorDraft({ ...item });
    setEditingVendorId(item.id);
  };

  const handleDeleteVendorItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      vendors: prev.vendors.filter((v) => v.id !== id),
    }));
    if (editingVendorId === id) {
      setVendorDraft({ id: "", name: "", logo: "", website_url: "" });
      setEditingVendorId(null);
    }
  };

  // Save Entire Solution
  const handleSaveSolution = async () => {
    if (!formData.name_en.trim() && !formData.name_ar.trim()) {
      return toast.error(isAr ? "يرجى إدخال اسم الحل بالإنجليزية أو العربية" : "Please enter solution name (EN or AR)");
    }
    if (!formData.slug.trim()) {
      return toast.error(isAr ? "يرجى إدخال معرّف الرابط (Slug)" : "Please enter a valid slug");
    }

    setSaving(true);
    try {
      await upsert({
        slug: formData.slug.trim().toLowerCase(),
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim() || formData.name_en.trim(),
        bio_en: formData.bio_en.trim(),
        bio_ar: formData.bio_ar.trim() || formData.bio_en.trim(),
        image: formData.image.trim() || "https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?w=1200&q=80",
        related_solutions: formData.related_solutions || [],
        vendors: formData.vendors || [],
        active: formData.active,
        sort_order: formData.sort_order ?? solutions.length,
      });

      toast.success(isAr ? "تم حفظ الحل بنجاح" : "Solution saved successfully");
      setDialogOpen(false);
    } catch (e: any) {
      console.error("Save solution error:", e);
      toast.error(e?.message || (isAr ? "فشل حفظ الحل" : "Failed to save solution"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-accent" />
            <span>{isAr ? "إدارة الحلول المؤسسية" : "Solutions Management"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr
              ? "إدارة منظومات الحلول المتكاملة، الحلول والأنظمة الفرعية، وشركاء التكنولوجيا المعتمدين."
              : "Manage enterprise solution architectures, related sub-systems, and technology vendor ecosystems."}
          </p>
        </div>

        {can.add && (
          <Button onClick={handleOpenAdd} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>{isAr ? "إضافة حل جديد" : "Create New Solution"}</span>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border shadow-xs p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{isAr ? "إجمالي الحلول" : "Total Solutions"}</div>
            <div className="text-xl font-bold font-display mt-0.5">{totalSolutions}</div>
          </div>
        </Card>

        <Card className="rounded-xl border shadow-xs p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{isAr ? "الحلول المفعلة" : "Active Solutions"}</div>
            <div className="text-xl font-bold font-display mt-0.5 text-emerald-600 dark:text-emerald-400">
              {activeSolutions}
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border shadow-xs p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{isAr ? "الأنظمة والحلول الفرعية" : "Related Modules"}</div>
            <div className="text-xl font-bold font-display mt-0.5">{totalRelated}</div>
          </div>
        </Card>

        <Card className="rounded-xl border shadow-xs p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{isAr ? "الشركاء والموردين" : "Partnered Vendors"}</div>
            <div className="text-xl font-bold font-display mt-0.5">{totalVendors}</div>
          </div>
        </Card>
      </div>

      {/* Main Table / Grid Card */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap pb-4">
          <div>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <Layers className="h-5 w-5 text-accent" />
              <span>{isAr ? "قائمة الحلول" : "Solutions List"}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {sorted.length} {isAr ? "من" : "of"} {solutions.length} {isAr ? "الإجمالي" : "total"}
            </p>
          </div>
          <ViewToggle value={view} />
        </CardHeader>

        <CardContent className="space-y-4">
          <BulkActionBar
            count={selected.length}
            onClear={() => setSelected([])}
            onDelete={can.delete ? bulkDelete : undefined}
            statusOptions={
              can.edit
                ? [
                    { value: "active", label: isAr ? "تفعيل" : "Set Active" },
                    { value: "inactive", label: isAr ? "تعطيل" : "Set Inactive" },
                  ]
                : undefined
            }
            onStatusChange={can.edit ? bulkActive : undefined}
          />

          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
              <span>{isAr ? "جاري تحميل الحلول..." : "Loading solutions..."}</span>
            </div>
          ) : solutions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <div className="text-sm font-medium">{isAr ? "لا توجد حلول مضافة" : "No solutions found"}</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isAr ? "ابدأ بإضافة أول منظومة حلول وتحديد الأنظمة الفرعية والموردين." : "Get started by adding your first solution architecture."}
              </p>
              {can.add && (
                <Button size="sm" onClick={handleOpenAdd}>
                  <Plus className="h-4 w-4 me-1.5" />
                  {isAr ? "إضافة حل" : "Add Solution"}
                </Button>
              )}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pg.items.map((sol) => (
                <div
                  key={sol.id}
                  className="group rounded-xl border bg-card overflow-hidden hover:border-accent transition-all duration-200 shadow-xs flex flex-col justify-between"
                >
                  <div className="relative h-44 w-full bg-muted overflow-hidden">
                    <img
                      src={sol.image || "/placeholder.svg"}
                      alt={sol.name_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-2 end-2">
                      <Badge variant={sol.active ? "default" : "secondary"} className="text-[10px] backdrop-blur-sm">
                        {sol.active ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 start-3 end-3 text-white">
                      <div className="text-xs text-white/75 font-mono truncate">{sol.slug}</div>
                      <h3 className="font-semibold text-base truncate drop-shadow-sm">
                        {isAr ? sol.name_ar || sol.name_en : sol.name_en}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {stripHtml(isAr ? sol.bio_ar || sol.bio_en : sol.bio_en)}
                    </p>

                    <div className="space-y-2 pt-2 border-t text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Workflow className="h-3.5 w-3.5 text-accent" />
                          {isAr ? "الحلول الفرعية:" : "Related modules:"}
                        </span>
                        <span className="font-semibold text-foreground">{sol.related_solutions?.length || 0}</span>
                      </div>

                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-purple-500" />
                          {isAr ? "الموردين والشركاء:" : "Vendors:"}
                        </span>
                        <span className="font-semibold text-foreground">{sol.vendors?.length || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t mt-2">
                      <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
                        <Link to="/solutions/$slug" params={{ slug: sol.slug }} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>{isAr ? "معاينة" : "Preview"}</span>
                        </Link>
                      </Button>

                      <div className="flex items-center gap-1">
                        {can.edit && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenEdit(sol)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                        )}
                        {can.delete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
                                remove(sol.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} />
                    </TableHead>
                    <TableHead className="w-14">{isAr ? "الترتيب" : "Order"}</TableHead>
                    <TableHead className="w-16">{isAr ? "الصورة" : "Image"}</TableHead>
                    <SortableHead field="name" sort={sort} dir={dir} onSort={toggleSort}>
                      {isAr ? "اسم الحل" : "Solution Name"}
                    </SortableHead>
                    <TableHead className="min-w-[200px]">{isAr ? "الوصف الموجز" : "Short Bio"}</TableHead>
                    <TableHead className="text-center">{isAr ? "الحلول الفرعية" : "Related"}</TableHead>
                    <TableHead className="text-center">{isAr ? "الموردين" : "Vendors"}</TableHead>
                    <SortableHead field="status" sort={sort} dir={dir} onSort={toggleSort}>
                      {isAr ? "الحالة" : "Status"}
                    </SortableHead>
                    <TableHead className="text-end">{isAr ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pg.items.map((sol) => (
                    <TableRow key={sol.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <Checkbox checked={selected.includes(sol.id)} onCheckedChange={() => toggleOne(sol.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => move(sol.id, "up")}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => move(sol.id, "down")}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <img
                          src={sol.image || "/placeholder.svg"}
                          alt=""
                          className="h-10 w-14 rounded-md object-cover border bg-muted shrink-0"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{isAr ? sol.name_ar || sol.name_en : sol.name_en}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{sol.slug}</div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-sm">
                          {stripHtml(isAr ? sol.bio_ar || sol.bio_en : sol.bio_en)}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs font-normal gap-1 bg-accent/5 border-accent/20">
                          <Workflow className="h-3 w-3 text-accent" />
                          <span>{sol.related_solutions?.length || 0}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs font-normal gap-1 bg-purple-500/5 border-purple-500/20 text-purple-700 dark:text-purple-300">
                          <Building2 className="h-3 w-3" />
                          <span>{sol.vendors?.length || 0}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {can.edit ? (
                          <Switch
                            checked={sol.active}
                            onCheckedChange={(checked) => toggleActive(sol.id, checked)}
                          />
                        ) : (
                          <Badge variant={sol.active ? "default" : "secondary"} className="text-[10px]">
                            {sol.active ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <Link to="/solutions/$slug" params={{ slug: sol.slug }} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          {can.edit && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenEdit(sol)}>
                              <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          )}
                          {can.delete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm(isAr ? "هل أنت متأكد من حذف هذا الحل؟" : "Are you sure you want to delete this solution?")) {
                                  remove(sol.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Paginator
            page={pg.page}
            pageCount={pg.pageCount}
            total={sorted.length}
            start={pg.start}
            end={pg.end}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* CREATION & EDIT DIALOG WITH 3 DEDICATED TABS */}
      {/* ========================================================================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b bg-card sticky top-0 z-10">
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <Layers className="h-5 w-5 text-accent" />
              <span>{isEditing ? (isAr ? "تعديل الحل" : "Edit Solution") : (isAr ? "إنشاء حل جديد" : "Create New Solution")}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <Tabs value={formTab} onValueChange={(v: any) => setFormTab(v)} className="w-full">
              <TabsList className="grid grid-cols-3 w-full mb-6 h-11 p-1 bg-muted/60">
                <TabsTrigger value="basic" className="gap-2 text-xs sm:text-sm font-medium">
                  <Layers className="h-4 w-4 shrink-0" />
                  <span>{isAr ? "1. البيانات الأساسية" : "1. Solution Details"}</span>
                </TabsTrigger>
                <TabsTrigger value="related" className="gap-2 text-xs sm:text-sm font-medium">
                  <Workflow className="h-4 w-4 shrink-0" />
                  <span>{isAr ? "2. الحلول الفرعية" : "2. Related Solutions"}</span>
                  {formData.related_solutions?.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-full ms-0.5">
                      {formData.related_solutions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="vendors" className="gap-2 text-xs sm:text-sm font-medium">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>{isAr ? "3. الشركاء والموردين" : "3. Vendors"}</span>
                  {formData.vendors?.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-full ms-0.5">
                      {formData.vendors.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ================================================================= */}
              {/* TAB 1: Solution Name, Short Bio, Image */}
              {/* ================================================================= */}
              <TabsContent value="basic" className="space-y-5 focus-visible:outline-hidden mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      {isAr ? "اسم الحل (بالإنجليزية)" : "Solution Name (English)"} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={formData.name_en}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          name_en: val,
                          slug: !isEditing && (!prev.slug || prev.slug.startsWith("solution-")) ? generateSlug(val) : prev.slug,
                        }));
                      }}
                      placeholder="e.g. Enterprise Networking & SD-WAN"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      {isAr ? "اسم الحل (بالعربية)" : "Solution Name (Arabic)"}
                    </Label>
                    <Input
                      dir="rtl"
                      value={formData.name_ar}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name_ar: e.target.value }))}
                      placeholder="مثال: الحلول الشبكية المتقدمة وشبكات SD-WAN"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    {isAr ? "معرّف الرابط (Slug)" : "URL Slug"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2.5 py-2 rounded-md border shrink-0">
                      /solutions/
                    </span>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))}
                      placeholder="enterprise-networking"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      {isAr ? "الوصف الموجز (بالإنجليزية)" : "Short Bio (English)"}
                    </Label>
                    <RichTextEditor
                      value={formData.bio_en || ""}
                      onChange={(v) => setFormData((prev) => ({ ...prev, bio_en: v }))}
                      dir="ltr"
                      minHeight="140px"
                      placeholder="Brief summary of the solution's business value, scope, and technical capabilities..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      {isAr ? "الوصف الموجز (بالعربية)" : "Short Bio (Arabic)"}
                    </Label>
                    <RichTextEditor
                      value={formData.bio_ar || ""}
                      onChange={(v) => setFormData((prev) => ({ ...prev, bio_ar: v }))}
                      dir="rtl"
                      minHeight="140px"
                      placeholder="ملخص موجز حول القيمة التشغيلية والأثر التقني للمنظومة..."
                    />
                  </div>
                </div>

                {/* Solution Cover Image */}
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>{isAr ? "صورة الحل الرئيسية" : "Solution Main Image"}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {isAr ? "PNG, JPG, WEBP بحد أقصى 5MB" : "PNG, JPG, WEBP up to 5MB"}
                    </span>
                  </Label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                    <div className="sm:col-span-2 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={formData.image}
                          onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                          placeholder="https://images.unsplash.com/..."
                          className="text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept={ACCEPTED_TYPES.join(",")}
                            className="hidden"
                            onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                            disabled={uploadingImage}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="gap-2 pointer-events-none"
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            <span>{uploadingImage ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع صورة جديدة" : "Upload Image")}</span>
                          </Button>
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          {isAr ? "أو أدخل رابطاً مباشراً للصورة" : "or paste direct image URL above"}
                        </span>
                      </div>
                    </div>

                    <div className="relative rounded-lg border bg-muted overflow-hidden aspect-video flex items-center justify-center">
                      {formData.image ? (
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-3 text-muted-foreground">
                          <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px]">{isAr ? "معاينة الصورة" : "Image Preview"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">{isAr ? "حالة النشر" : "Publish Status"}</Label>
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "إظهار الحل في القائمة والموقع العام" : "Make this solution visible on the public website"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
                  />
                </div>
              </TabsContent>

              {/* ================================================================= */}
              {/* TAB 2: Related Solutions (icon, title, bio) */}
              {/* ================================================================= */}
              <TabsContent value="related" className="space-y-5 focus-visible:outline-hidden mt-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm">{isAr ? "الحلول والأنظمة الفرعية" : "Related Sub-Solutions"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {isAr
                        ? "أضف الوحدات والأنظمة الهندسية المندرجة تحت هذه المنظومة (أيقونة، عنوان، وصف)."
                        : "Define components, modules, and sub-systems included in this solution (icon, title, bio)."}
                    </p>
                  </div>
                </div>

                {/* Sub-item Builder Box */}
                <Card className="border-dashed bg-muted/30 p-4 rounded-xl space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>{editingRelatedId ? (isAr ? "تعديل النظام الفرعي" : "Edit Sub-Solution") : (isAr ? "إضافة نظام فرعي جديد" : "Add New Sub-Solution")}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "الأيقونة" : "Icon"}</Label>
                      <Select
                        value={relatedDraft.icon}
                        onValueChange={(val) => setRelatedDraft((prev) => ({ ...prev, icon: val }))}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {AVAILABLE_SOLUTION_ICONS.map((ic) => {
                            const IconComponent = ic.icon;
                            return (
                              <SelectItem key={ic.name} value={ic.name} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-3.5 w-3.5 text-accent" />
                                  <span>{ic.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "العنوان (بالإنجليزية)" : "Title (EN)"}</Label>
                      <Input
                        value={relatedDraft.title_en}
                        onChange={(e) => setRelatedDraft((prev) => ({ ...prev, title_en: e.target.value }))}
                        placeholder="e.g. Core Switching & LAN"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "العنوان (بالعربية)" : "Title (AR)"}</Label>
                      <Input
                        dir="rtl"
                        value={relatedDraft.title_ar}
                        onChange={(e) => setRelatedDraft((prev) => ({ ...prev, title_ar: e.target.value }))}
                        placeholder="مثال: شبكات التحويل المركزي"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "الوصف (بالإنجليزية)" : "Bio (EN)"}</Label>
                      <RichTextEditor
                        value={relatedDraft.bio_en || ""}
                        onChange={(v) => setRelatedDraft((prev) => ({ ...prev, bio_en: v }))}
                        dir="ltr"
                        minHeight="100px"
                        placeholder="Multi-gigabit non-blocking campus infrastructure..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "الوصف (بالعربية)" : "Bio (AR)"}</Label>
                      <RichTextEditor
                        value={relatedDraft.bio_ar || ""}
                        onChange={(v) => setRelatedDraft((prev) => ({ ...prev, bio_ar: v }))}
                        dir="rtl"
                        minHeight="100px"
                        placeholder="بنية تحتية متعددة الجيجابت مع توجيه بدون تأخير..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {editingRelatedId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setRelatedDraft({ id: "", icon: "Network", title_en: "", title_ar: "", bio_en: "", bio_ar: "" });
                          setEditingRelatedId(null);
                        }}
                      >
                        {isAr ? "إلغاء" : "Cancel"}
                      </Button>
                    )}
                    <Button type="button" size="sm" className="h-8 text-xs gap-1.5" onClick={handleSaveRelatedItem}>
                      {editingRelatedId ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      <span>{editingRelatedId ? (isAr ? "تحديث" : "Update") : (isAr ? "إضافة إلى القائمة" : "Add to List")}</span>
                    </Button>
                  </div>
                </Card>

                {/* List of Added Related Solutions */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>{isAr ? "الأنظمة المضافة حالياً" : "Current Sub-Solutions"} ({formData.related_solutions.length})</span>
                  </div>

                  {formData.related_solutions.length === 0 ? (
                    <div className="p-6 text-center border rounded-xl text-xs text-muted-foreground">
                      {isAr ? "لم تتم إضافة أي أنظمة فرعية بعد. استخدم النموذج أعلاه للإضافة." : "No sub-solutions added yet. Use the form above to add items."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.related_solutions.map((item, idx) => {
                        const IconComponent = getSolutionIcon(item.icon);
                        return (
                          <div
                            key={item.id || idx}
                            className="p-3.5 rounded-xl border bg-card/60 flex items-start justify-between gap-3 hover:border-accent/40 transition-colors"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-xs truncate">
                                  {isAr ? item.title_ar || item.title_en : item.title_en}
                                </div>
                                <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                  {stripHtml(isAr ? item.bio_ar || item.bio_en : item.bio_en)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => handleEditRelatedItem(item)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteRelatedItem(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ================================================================= */}
              {/* TAB 3: Vendors (name, logo, optional url) */}
              {/* ================================================================= */}
              <TabsContent value="vendors" className="space-y-5 focus-visible:outline-hidden mt-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm">{isAr ? "الشركاء والمصنعين المعتمدين" : "Technology Vendors & OEM Partners"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {isAr
                        ? "أضف المصنعين والشركات التقنية العالمية التي تبنى عليها هذه المنظومة (الاسم والشعار)."
                        : "Assign leading global technology vendors and OEMs supporting this solution (name, logo)."}
                    </p>
                  </div>
                </div>

                {/* Vendor Builder Box */}
                <Card className="border-dashed bg-muted/30 p-4 rounded-xl space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>{editingVendorId ? (isAr ? "تعديل المورد" : "Edit Vendor") : (isAr ? "إضافة مورد جديد" : "Add New Vendor")}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "اسم المورد / الشريك" : "Vendor Name"} <span className="text-destructive">*</span></Label>
                      <Input
                        value={vendorDraft.name}
                        onChange={(e) => setVendorDraft((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Cisco, Fortinet, Dell"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "رابط الشعار (URL أو رفع)" : "Logo URL / Upload"}</Label>
                      <div className="flex gap-2">
                        <Input
                          value={vendorDraft.logo}
                          onChange={(e) => setVendorDraft((prev) => ({ ...prev, logo: e.target.value }))}
                          placeholder="https://...logo.svg"
                          className="h-9 text-xs font-mono"
                        />
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept={ACCEPTED_TYPES.join(",")}
                            className="hidden"
                            onChange={(e) => handleVendorLogoUpload(e.target.files?.[0] || null)}
                            disabled={uploadingVendorLogo}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-9 px-2.5 pointer-events-none shrink-0"
                            disabled={uploadingVendorLogo}
                          >
                            {uploadingVendorLogo ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "الموقع الإلكتروني (اختياري)" : "Website URL (Optional)"}</Label>
                      <Input
                        value={vendorDraft.website_url || ""}
                        onChange={(e) => setVendorDraft((prev) => ({ ...prev, website_url: e.target.value }))}
                        placeholder="https://www.cisco.com"
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Live thumbnail preview */}
                    <div className="flex items-center gap-2">
                      {vendorDraft.logo && (
                        <div className="h-8 w-16 bg-white dark:bg-slate-900 border rounded p-1 flex items-center justify-center">
                          <img src={vendorDraft.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {editingVendorId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setVendorDraft({ id: "", name: "", logo: "", website_url: "" });
                            setEditingVendorId(null);
                          }}
                        >
                          {isAr ? "إلغاء" : "Cancel"}
                        </Button>
                      )}
                      <Button type="button" size="sm" className="h-8 text-xs gap-1.5" onClick={handleSaveVendorItem}>
                        {editingVendorId ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        <span>{editingVendorId ? (isAr ? "تحديث المورد" : "Update Vendor") : (isAr ? "إضافة المورد" : "Add Vendor")}</span>
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* List of Added Vendors */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">
                    {isAr ? "الموردين المعتمدين المضافين" : "Configured Vendors"} ({formData.vendors.length})
                  </div>

                  {formData.vendors.length === 0 ? (
                    <div className="p-6 text-center border rounded-xl text-xs text-muted-foreground">
                      {isAr ? "لم تتم إضافة موردين بعد. استخدم النموذج أعلاه للإضافة." : "No vendors added yet. Use the form above to add vendor partners."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {formData.vendors.map((vendor, idx) => (
                        <div
                          key={vendor.id || idx}
                          className="p-3 rounded-xl border bg-card/60 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-12 rounded-md bg-white dark:bg-slate-900 border p-1 flex items-center justify-center shrink-0">
                              {vendor.logo ? (
                                <img src={vendor.logo} alt={vendor.name} className="max-h-full max-w-full object-contain" />
                              ) : (
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs truncate">{vendor.name}</div>
                              {vendor.website_url && (
                                <a
                                  href={vendor.website_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-accent hover:underline flex items-center gap-1 truncate"
                                >
                                  <LinkIcon className="h-2.5 w-2.5" />
                                  <span className="truncate">{vendor.website_url.replace(/^https?:\/\//, "")}</span>
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditVendorItem(vendor)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteVendorItem(vendor.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-4 px-6 border-t bg-card sticky bottom-0 z-10 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {formTab === "basic" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormTab("related")}
                >
                  <span>{isAr ? "التالي: الحلول الفرعية ←" : "Next: Related Solutions →"}</span>
                </Button>
              )}
              {formTab === "related" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormTab("basic")}
                  >
                    <span>{isAr ? "← السابق" : "← Previous"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormTab("vendors")}
                  >
                    <span>{isAr ? "التالي: الموردين ←" : "Next: Vendors →"}</span>
                  </Button>
                </>
              )}
              {formTab === "vendors" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormTab("related")}
                >
                  <span>{isAr ? "← السابق" : "← Previous"}</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="button" onClick={handleSaveSolution} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الحل" : "Save Solution")}</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
