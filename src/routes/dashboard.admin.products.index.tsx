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
import { Plus, Pencil, Trash2, Loader2, Star, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type Product, emptyProduct, slugify, assertBilingualPairs, STOCK_OPTIONS } from "@/lib/products";
import { ProductImagesManager } from "@/components/admin/ProductImagesManager";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export const Route = createFileRoute("/dashboard/admin/products/")({
  component: ProductsAdmin,
});

function ProductsAdmin() {
  const _perms = useCurrentPagePerms();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | (Omit<Product, "id"> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterFeatured, setFilterFeatured] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false });
    setItems((data as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Combined ordered list: index 0 = main image, rest = gallery
  const images: string[] = editing
    ? [editing.image_url, ...(editing.gallery || [])].filter(Boolean)
    : [];
  const setImages = (next: string[]) => {
    if (!editing) return;
    setEditing({ ...editing, image_url: next[0] || "", gallery: next.slice(1) });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(p => {
      if (filterFeatured && !p.featured) return false;
      if (!q) return true;
      return [p.name_en, p.name_ar, p.sku, p.category_en, p.category_ar, p.slug].some(v => (v || "").toLowerCase().includes(q));
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
    if (!slug) { toast.error("Slug is required"); return; }
    setSaving(true);
    const payload = {
      ...editing,
      slug,
      gallery: editing.gallery || [],
      price: editing.price === null || (editing.price as any) === "" ? null : Number(editing.price),
    };
    let error;
    if ("id" in editing && editing.id) {
      const { id, ...rest } = payload as Product;
      ({ error } = await supabase.from("products").update(rest as any).eq("id", id));
    } else {
      ({ error } = await supabase.from("products").insert(payload as any));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
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
            <Input className="ps-8 w-[220px]" placeholder="Search name, SKU, slug…" value={search} onChange={ev => setSearch(ev.target.value)} />
          </div>
          <label className="text-xs inline-flex items-center gap-2"><Switch checked={filterFeatured} onCheckedChange={setFilterFeatured} /> Featured only</label>
          <Button disabled={!_perms.add} onClick={() => setEditing({ ...emptyProduct })}><Plus className="h-4 w-4 me-2" /> New product</Button>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div> :
        filtered.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No products yet.</CardContent></Card> :
        <div className="grid gap-3">
          {filtered.map(p => (
            <Card key={p.id}>
              <CardContent className="p-3 flex flex-wrap items-center gap-3">
                <div className="h-14 w-14 rounded-md bg-muted overflow-hidden shrink-0">
                  {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{p.name_en}</h3>
                    {p.featured && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 inline-flex items-center gap-1"><Star className="h-3 w-3" /> Featured</span>}
                    {!p.active && <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">Hidden</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5" dir="rtl">{p.name_ar}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {[p.category_en, p.sku, p.price != null ? `${p.price} ${p.currency}` : null].filter(Boolean).join(" • ")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button disabled={!_perms.edit} size="sm" variant="outline" onClick={() => toggleFeatured(p)}><Star className={`h-3.5 w-3.5 ${p.featured ? "fill-amber-500 text-amber-500" : ""}`} /></Button>
                  <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                  <Button disabled={!_perms.edit} size="sm" variant="outline" onClick={() => setEditing(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button disabled={!_perms.delete} size="sm" variant="outline" onClick={() => remove(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{e && "id" in e && e.id ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
          {e && (
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Name (EN) *</Label><Input value={e.name_en} onChange={ev => setEditing({ ...e, name_en: ev.target.value, slug: e.slug || slugify(ev.target.value) })} /></div>
                <div><Label>Name (AR) *</Label><Input dir="rtl" value={e.name_ar} onChange={ev => setEditing({ ...e, name_ar: ev.target.value })} /></div>
                <div><Label>Category (EN) *</Label><Input value={e.category_en} onChange={ev => setEditing({ ...e, category_en: ev.target.value })} /></div>
                <div><Label>Category (AR) *</Label><Input dir="rtl" value={e.category_ar} onChange={ev => setEditing({ ...e, category_ar: ev.target.value })} /></div>
                <div><Label>SKU</Label><Input value={e.sku} onChange={ev => setEditing({ ...e, sku: ev.target.value })} /></div>
                <div><Label>Slug</Label><Input value={e.slug} onChange={ev => setEditing({ ...e, slug: slugify(ev.target.value) })} /></div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div><Label>Price</Label><Input type="number" step="0.01" value={e.price ?? ""} onChange={ev => setEditing({ ...e, price: ev.target.value ? Number(ev.target.value) : null })} /></div>
                <div><Label>Currency</Label><Input maxLength={4} value={e.currency} onChange={ev => setEditing({ ...e, currency: ev.target.value.toUpperCase() })} /></div>
                <div>
                  <Label>Stock</Label>
                  <Select value={e.stock_status} onValueChange={(v) => setEditing({ ...e, stock_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STOCK_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.en}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Description (EN) *</Label>
                  <span className="text-xs text-muted-foreground">Rich Text (LTR)</span>
                </div>
                <RichTextEditor
                  dir="ltr"
                  value={e.description_en}
                  onChange={(val) => setEditing({ ...e, description_en: val })}
                  placeholder="Detailed product specifications and description in English..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Description (AR) *</Label>
                  <span className="text-xs text-muted-foreground">محرر نصوص منسقة (RTL)</span>
                </div>
                <RichTextEditor
                  dir="rtl"
                  value={e.description_ar}
                  onChange={(val) => setEditing({ ...e, description_ar: val })}
                  placeholder="المواصفات والوصف التفصيلي للمنتج بالعربية..."
                />
              </div>

              <div>
                <Label>Product images</Label>
                <div className="text-xs text-muted-foreground mb-2">The first image is used as the main image on the shop. Drag to reorder.</div>
                <ProductImagesManager value={images} onChange={setImages} />
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2"><Switch checked={e.featured} onCheckedChange={(v) => setEditing({ ...e, featured: v })} /><Label>Featured</Label></div>
                <div className="flex items-center gap-2"><Switch checked={e.active} onCheckedChange={(v) => setEditing({ ...e, active: v })} /><Label>Visible publicly</Label></div>
                <div><Label>Sort order</Label><Input type="number" value={e.sort_order} onChange={ev => setEditing({ ...e, sort_order: Number(ev.target.value) || 0 })} /></div>
              </div>

              <div className="rounded-md border p-4 space-y-3 bg-muted/30">
                <div>
                  <div className="font-semibold text-sm">SEO</div>
                  <div className="text-xs text-muted-foreground">Optimize this product for search engines and social sharing.</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Meta title (EN)</Label><Input maxLength={70} value={e.meta_title_en ?? ""} onChange={ev => setEditing({ ...e, meta_title_en: ev.target.value })} placeholder="≤ 60 chars recommended" /></div>
                  <div><Label>Meta title (AR)</Label><Input dir="rtl" maxLength={70} value={e.meta_title_ar ?? ""} onChange={ev => setEditing({ ...e, meta_title_ar: ev.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>Meta description (EN)</Label><Textarea rows={2} maxLength={180} value={e.meta_description_en ?? ""} onChange={ev => setEditing({ ...e, meta_description_en: ev.target.value })} placeholder="≤ 160 chars recommended" /></div>
                  <div className="sm:col-span-2"><Label>Meta description (AR)</Label><Textarea dir="rtl" rows={2} maxLength={180} value={e.meta_description_ar ?? ""} onChange={ev => setEditing({ ...e, meta_description_ar: ev.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>Keywords (comma-separated)</Label><Input value={e.meta_keywords ?? ""} onChange={ev => setEditing({ ...e, meta_keywords: ev.target.value })} placeholder="laptop, business, intel i7" /></div>
                  <div><Label>OG image URL</Label><Input value={e.og_image ?? ""} onChange={ev => setEditing({ ...e, og_image: ev.target.value })} placeholder="https://…" /></div>
                  <div><Label>Canonical URL</Label><Input value={e.canonical_url ?? ""} onChange={ev => setEditing({ ...e, canonical_url: ev.target.value })} placeholder="https://…" /></div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={!_perms.edit || (saving)}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}