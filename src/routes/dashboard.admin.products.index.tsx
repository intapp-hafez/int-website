import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Star,
  Search,
  Building2,
  Upload,
  Check,
  X,
  ExternalLink,
  Layers,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  type Product,
  type VendorItem,
  emptyProduct,
  slugify,
  assertBilingualPairs,
  useProductCategories,
} from "@/lib/products";
import { ProductImagesManager } from "@/components/admin/ProductImagesManager";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export const Route = createFileRoute("/dashboard/admin/products/")({
  component: ProductsAdmin,
});

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Unsupported format. Use PNG, JPG, WEBP, SVG or GIF.";
  if (file.size > MAX_BYTES) return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`;
  return null;
}

async function uploadFile(file: File, folder = "products/vendors"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("slide-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("slide-images").getPublicUrl(path);
  return data.publicUrl;
}

function ProductsAdmin() {
  const _perms = useCurrentPagePerms();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | (Omit<Product, "id"> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [formTab, setFormTab] = useState<"basic" | "vendors" | "seo">("basic");
  const { categories } = useProductCategories();

  // Vendor draft state
  const [vendorDraft, setVendorDraft] = useState<VendorItem>({ id: "", name: "", logo: "", website_url: "" });
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [uploadingVendorLogo, setUploadingVendorLogo] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("sort_order")
      .order("created_at", { ascending: false });
    setItems((data as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const openNewProduct = () => {
    setEditing({ ...emptyProduct, vendors: [] });
    setVendorDraft({ id: "", name: "", logo: "", website_url: "" });
    setEditingVendorId(null);
    setFormTab("basic");
  };

  const openEditProduct = (p: Product) => {
    setEditing({ ...p, vendors: p.vendors || [] });
    setVendorDraft({ id: "", name: "", logo: "", website_url: "" });
    setEditingVendorId(null);
    setFormTab("basic");
  };

  // Combined ordered list: index 0 = main image, rest = gallery
  const images: string[] = editing
    ? [editing.image_url, ...(editing.gallery || [])].filter(Boolean)
    : [];
  const setImages = (next: string[]) => {
    if (!editing) return;
    setEditing({ ...editing, image_url: next[0] || "", gallery: next.slice(1) });
  };

  // Vendor Logo Upload
  const handleVendorLogoUpload = async (file: File | null) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast.error(err);

    setUploadingVendorLogo(true);
    try {
      const url = await uploadFile(file, "products/vendors");
      setVendorDraft((prev) => ({ ...prev, logo: url }));
      toast.success("Logo uploaded successfully");
    } catch (e: any) {
      toast.error(e?.message || "Failed to upload logo");
    } finally {
      setUploadingVendorLogo(false);
    }
  };

  // Vendor Add/Update
  const handleSaveVendorItem = () => {
    if (!vendorDraft.name.trim()) {
      return toast.error("Please enter vendor / manufacturer name");
    }

    if (!editing) return;

    const currentVendors = editing.vendors || [];

    if (editingVendorId) {
      // Update existing
      setEditing({
        ...editing,
        vendors: currentVendors.map((item) =>
          item.id === editingVendorId ? { ...vendorDraft, id: editingVendorId } : item
        ),
      });
      toast.success("Vendor updated");
    } else {
      // Add new
      const newItem: VendorItem = {
        ...vendorDraft,
        id: `v-${Date.now().toString().slice(-6)}`,
      };
      setEditing({
        ...editing,
        vendors: [...currentVendors, newItem],
      });
      toast.success("Vendor added");
    }

    // Reset draft
    setVendorDraft({ id: "", name: "", logo: "", website_url: "" });
    setEditingVendorId(null);
  };

  const handleEditVendorItem = (item: VendorItem) => {
    setVendorDraft({ ...item });
    setEditingVendorId(item.id);
  };

  const handleDeleteVendorItem = (id: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      vendors: (editing.vendors || []).filter((v) => v.id !== id),
    });
    if (editingVendorId === id) {
      setVendorDraft({ id: "", name: "", logo: "", website_url: "" });
      setEditingVendorId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (filterFeatured && !p.featured) return false;
      if (!q) return true;
      return [p.name_en, p.name_ar, p.category_en, p.category_ar, p.slug].some((v) =>
        (v || "").toLowerCase().includes(q)
      );
    });
  }, [items, search, filterFeatured]);

  const save = async () => {
    if (!editing) return;
    try {
      assertBilingualPairs([
        { en: editing.name_en, ar: editing.name_ar, label: "Name" },
        { en: editing.description_en, ar: editing.description_ar, label: "Description" },
        { en: editing.category_en, ar: editing.category_ar, label: "Category" },
      ]);
    } catch (e: any) {
      toast.error(e.message);
      return;
    }
    const slug = editing.slug?.trim() || slugify(editing.name_en);
    if (!slug) {
      toast.error("Slug is required");
      return;
    }
    setSaving(true);
    const record = {
      slug,
      name_en: editing.name_en?.trim() || "",
      name_ar: editing.name_ar?.trim() || "",
      description_en: editing.description_en || "",
      description_ar: editing.description_ar || "",
      category_en: editing.category_en || "",
      category_ar: editing.category_ar || "",
      image_url: editing.image_url || "",
      gallery: Array.isArray(editing.gallery) ? editing.gallery.filter(Boolean) : [],
      vendors: Array.isArray(editing.vendors) ? editing.vendors : [],
      featured: Boolean(editing.featured),
      active: editing.active !== false,
      sort_order: Number(editing.sort_order) || 0,
      meta_title_en: editing.meta_title_en?.trim() || null,
      meta_title_ar: editing.meta_title_ar?.trim() || null,
      meta_description_en: editing.meta_description_en?.trim() || null,
      meta_description_ar: editing.meta_description_ar?.trim() || null,
      meta_keywords: editing.meta_keywords?.trim() || null,
      og_image: editing.og_image?.trim() || null,
      canonical_url: editing.canonical_url?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if ("id" in editing && editing.id) {
      const res = await supabase.from("products").update(record as any).eq("id", editing.id);
      error = res.error;
    } else {
      const res = await supabase.from("products").insert(record as any);
      error = res.error;
    }

    setSaving(false);
    if (error) {
      console.error("[Products Save Error]:", error);
      toast.error(error.message || "Failed to save product");
      return;
    }
    toast.success("Product and vendors saved successfully");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleActive = async (p: Product) => {
    const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };
  const toggleFeatured = async (p: Product) => {
    const { error } = await supabase.from("products").update({ featured: !p.featured }).eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  const e = editing;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute start-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-8 w-[220px]"
              placeholder="Search name, category, slug…"
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
            />
          </div>
          <label className="text-xs inline-flex items-center gap-2">
            <Switch checked={filterFeatured} onCheckedChange={setFilterFeatured} /> Featured only
          </label>
          <Button disabled={!_perms.add} onClick={openNewProduct}>
            <Plus className="h-4 w-4 me-2" /> New product
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin inline" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No products yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 flex flex-wrap items-center gap-3">
                <div className="h-14 w-14 rounded-md bg-muted overflow-hidden shrink-0">
                  {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{p.name_en}</h3>
                    {p.featured && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    )}
                    {!p.active && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">Hidden</span>
                    )}
                    {p.vendors && p.vendors.length > 0 && (
                      <Badge variant="outline" className="text-[10px] gap-1 bg-purple-500/5 text-purple-700 dark:text-purple-300 border-purple-500/20">
                        <Building2 className="h-3 w-3" />
                        {p.vendors.length} {p.vendors.length === 1 ? "Vendor" : "Vendors"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5" dir="rtl">
                    {p.name_ar}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {[p.category_en].filter(Boolean).join(" • ")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={!_perms.edit}
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFeatured(p)}
                  >
                    <Star className={`h-3.5 w-3.5 ${p.featured ? "fill-amber-500 text-amber-500" : ""}`} />
                  </Button>
                  <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                  <Button disabled={!_perms.edit} size="sm" variant="outline" onClick={() => openEditProduct(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button disabled={!_perms.delete} size="sm" variant="outline" onClick={() => remove(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* WIDER CREATE / EDIT PRODUCT DIALOG WITH TABS & VENDORS BUILDER */}
      {/* ========================================================================= */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b bg-card sticky top-0 z-10">
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <Layers className="h-5 w-5 text-accent" />
              <span>{e && "id" in e && e.id ? "Edit Product" : "New Product"}</span>
            </DialogTitle>
          </DialogHeader>

          {e && (
            <div className="p-6">
              <Tabs value={formTab} onValueChange={(v: any) => setFormTab(v)} className="w-full">
                <TabsList className="grid grid-cols-3 w-full mb-6 h-11 p-1 bg-muted/60">
                  <TabsTrigger value="basic" className="gap-2 text-xs sm:text-sm font-medium">
                    <Layers className="h-4 w-4 shrink-0" />
                    <span>1. Product Details</span>
                  </TabsTrigger>
                  <TabsTrigger value="vendors" className="gap-2 text-xs sm:text-sm font-medium">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>2. Vendors & Partners</span>
                    {e.vendors && e.vendors.length > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-full ms-0.5">
                        {e.vendors.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="gap-2 text-xs sm:text-sm font-medium">
                    <Settings className="h-4 w-4 shrink-0" />
                    <span>3. Visibility & SEO</span>
                  </TabsTrigger>
                </TabsList>

                {/* ================================================================= */}
                {/* TAB 1: PRODUCT DETAILS */}
                {/* ================================================================= */}
                <TabsContent value="basic" className="space-y-5 focus-visible:outline-hidden mt-0">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Name (English) *</Label>
                      <Input
                        value={e.name_en}
                        onChange={(ev) =>
                          setEditing({
                            ...e,
                            name_en: ev.target.value,
                            slug: e.slug || slugify(ev.target.value),
                          })
                        }
                        placeholder="e.g. Next-Gen Enterprise Switch 48-Port"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Name (Arabic) *</Label>
                      <Input
                        dir="rtl"
                        value={e.name_ar}
                        onChange={(ev) => setEditing({ ...e, name_ar: ev.target.value })}
                        placeholder="مثال: محول شبكي متقدم 48 منفذ"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Category (English) *</Label>
                      <Select
                        value={e.category_en}
                        onValueChange={(v) => {
                          const cat = categories.find((c) => c.name_en === v);
                          setEditing({
                            ...e,
                            category_en: v,
                            category_ar: cat ? cat.name_ar : e.category_ar,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.name_en}>
                              {c.name_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Category (Arabic) *</Label>
                      <Input
                        dir="rtl"
                        readOnly
                        value={e.category_ar}
                        placeholder="Auto-filled"
                        onChange={(ev) => setEditing({ ...e, category_ar: ev.target.value })}
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold">URL Slug *</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-2.5 py-2 rounded-md border shrink-0">
                          /products/
                        </span>
                        <Input
                          value={e.slug}
                          onChange={(ev) => setEditing({ ...e, slug: slugify(ev.target.value) })}
                          placeholder="enterprise-switch-48p"
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rich Text Descriptions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Description (English) *</Label>
                        <span className="text-[11px] text-muted-foreground">Rich Text (LTR)</span>
                      </div>
                      <RichTextEditor
                        dir="ltr"
                        minHeight="140px"
                        value={e.description_en}
                        onChange={(val) => setEditing({ ...e, description_en: val })}
                        placeholder="Detailed product specifications, architecture and features..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Description (Arabic) *</Label>
                        <span className="text-[11px] text-muted-foreground">محرر نصوص منسقة (RTL)</span>
                      </div>
                      <RichTextEditor
                        dir="rtl"
                        minHeight="140px"
                        value={e.description_ar}
                        onChange={(val) => setEditing({ ...e, description_ar: val })}
                        placeholder="المواصفات والوصف التفصيلي للمنتج بالعربية..."
                      />
                    </div>
                  </div>

                  {/* Product Images */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-semibold">Product Images & Gallery</Label>
                    <p className="text-xs text-muted-foreground">
                      The first image is used as the primary hero image. Drag and drop to reorder.
                    </p>
                    <ProductImagesManager value={images} onChange={setImages} />
                  </div>
                </TabsContent>

                {/* ================================================================= */}
                {/* TAB 2: VENDORS & PARTNERS (Name, Logo, URL) */}
                {/* ================================================================= */}
                <TabsContent value="vendors" className="space-y-5 focus-visible:outline-hidden mt-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm">Product Vendors & Manufacturers</h3>
                      <p className="text-xs text-muted-foreground">
                        Add partnered equipment vendors, OEMs, and technology suppliers associated with this product.
                      </p>
                    </div>
                  </div>

                  {/* Vendor Builder Box */}
                  <Card className="border-dashed bg-muted/30 p-4 rounded-xl space-y-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{editingVendorId ? "Edit Vendor / OEM" : "Add New Vendor / Manufacturer"}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Vendor / Brand Name *</Label>
                        <Input
                          value={vendorDraft.name}
                          onChange={(e) => setVendorDraft((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Cisco, Fortinet, Dell"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Logo URL / Upload</Label>
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
                        <Label className="text-xs">Website URL (Optional)</Label>
                        <Input
                          value={vendorDraft.website_url || ""}
                          onChange={(e) => setVendorDraft((prev) => ({ ...prev, website_url: e.target.value }))}
                          placeholder="https://www.cisco.com"
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* Live logo thumbnail */}
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
                            Cancel
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={handleSaveVendorItem}
                        >
                          {editingVendorId ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          <span>{editingVendorId ? "Update Vendor" : "Add Vendor"}</span>
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* List of Added Vendors */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">
                      Configured Vendors ({e.vendors?.length || 0})
                    </div>

                    {!e.vendors || e.vendors.length === 0 ? (
                      <div className="p-6 text-center border rounded-xl text-xs text-muted-foreground">
                        No vendors added yet. Use the form above to add vendor partners or manufacturers.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {e.vendors.map((vendor, idx) => (
                          <div
                            key={vendor.id || idx}
                            className="p-3 rounded-xl border bg-card/60 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-12 rounded-md bg-white dark:bg-slate-900 border p-1 flex items-center justify-center shrink-0">
                                {vendor.logo ? (
                                  <img
                                    src={vendor.logo}
                                    alt={vendor.name}
                                    className="max-h-full max-w-full object-contain"
                                  />
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
                                    className="text-[11px] text-accent hover:underline flex items-center gap-1 truncate"
                                  >
                                    <span>Website</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleEditVendorItem(vendor)}
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
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

                {/* ================================================================= */}
                {/* TAB 3: VISIBILITY & SEO */}
                {/* ================================================================= */}
                <TabsContent value="seo" className="space-y-5 focus-visible:outline-hidden mt-0">
                  <div className="grid sm:grid-cols-3 gap-4 p-4 rounded-xl border bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={e.featured}
                        onCheckedChange={(v) => setEditing({ ...e, featured: v })}
                      />
                      <Label className="text-xs font-semibold">Featured on Homepage / Shop</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={e.active}
                        onCheckedChange={(v) => setEditing({ ...e, active: v })}
                      />
                      <Label className="text-xs font-semibold">Visible publicly</Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Sort Order</Label>
                      <Input
                        type="number"
                        value={e.sort_order}
                        onChange={(ev) =>
                          setEditing({ ...e, sort_order: Number(ev.target.value) || 0 })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border p-4 space-y-3 bg-muted/30">
                    <div>
                      <div className="font-semibold text-sm">SEO & Social Meta Tags</div>
                      <div className="text-xs text-muted-foreground">
                        Optimize this product for search engines and social media previews.
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Meta title (EN)</Label>
                        <Input
                          maxLength={70}
                          value={e.meta_title_en ?? ""}
                          onChange={(ev) => setEditing({ ...e, meta_title_en: ev.target.value })}
                          placeholder="≤ 60 chars recommended"
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Meta title (AR)</Label>
                        <Input
                          dir="rtl"
                          maxLength={70}
                          value={e.meta_title_ar ?? ""}
                          onChange={(ev) => setEditing({ ...e, meta_title_ar: ev.target.value })}
                          className="text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Meta description (EN)</Label>
                        <Textarea
                          rows={2}
                          maxLength={180}
                          value={e.meta_description_en ?? ""}
                          onChange={(ev) => setEditing({ ...e, meta_description_en: ev.target.value })}
                          placeholder="≤ 160 chars recommended"
                          className="text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Meta description (AR)</Label>
                        <Textarea
                          dir="rtl"
                          rows={2}
                          maxLength={180}
                          value={e.meta_description_ar ?? ""}
                          onChange={(ev) => setEditing({ ...e, meta_description_ar: ev.target.value })}
                          className="text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Keywords (comma-separated)</Label>
                        <Input
                          value={e.meta_keywords ?? ""}
                          onChange={(ev) => setEditing({ ...e, meta_keywords: ev.target.value })}
                          placeholder="cisco, switch, networking, 48-port"
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">OG image URL</Label>
                        <Input
                          value={e.og_image ?? ""}
                          onChange={(ev) => setEditing({ ...e, og_image: ev.target.value })}
                          placeholder="https://…"
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Canonical URL</Label>
                        <Input
                          value={e.canonical_url ?? ""}
                          onChange={(ev) => setEditing({ ...e, canonical_url: ev.target.value })}
                          placeholder="https://…"
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter className="p-4 border-t bg-card sticky bottom-0 z-10 flex items-center justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!_perms.edit || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
              Save Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}