import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductCategory } from "@/lib/products";

export const Route = createFileRoute("/dashboard/admin/product-categories/")({
  component: ProductCategoriesAdmin,
});

function ProductCategoriesAdmin() {
  const _perms = useCurrentPagePerms();
  const [items, setItems] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductCategory | (Omit<ProductCategory, "id"> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from("product_categories" as any) as any).select("*").order("name_en");
    setItems((data as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [c.name_en, c.name_ar].some(v => (v || "").toLowerCase().includes(q));
  });

  const save = async () => {
    if (!editing) return;
    if (!editing.name_en || !editing.name_ar) {
      toast.error("Please fill in both English and Arabic names.");
      return;
    }
    setSaving(true);
    try {
      const { id, created_at, ...payload } = editing as any;
      if (id) {
        const { error } = await (supabase.from("product_categories" as any) as any).update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await (supabase.from("product_categories" as any) as any).insert(payload);
        if (error) throw error;
        toast.success("Category created");
      }
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const { error } = await (supabase.from("product_categories" as any) as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("Category deleted");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin me-2" /> Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Categories</h2>
          <p className="text-muted-foreground">Manage your product categories in English and Arabic.</p>
        </div>
        <Button onClick={() => setEditing({ name_en: "", name_ar: "" })}><Plus className="h-4 w-4 me-2" /> Add Category</Button>
      </div>

      <Card>
        <div className="p-4 border-b">
          <Input 
            placeholder="Search categories..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="max-w-md"
          />
        </div>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="grid sm:grid-cols-2 gap-2 sm:gap-8 flex-1">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">English</div>
                    <div className="font-medium">{c.name_en}</div>
                  </div>
                  <div dir="rtl">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Arabic</div>
                    <div className="font-medium">{c.name_ar}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ms-4 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No categories found.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>English Name</Label>
              <Input 
                value={editing?.name_en || ""} 
                onChange={(e) => setEditing(editing ? { ...editing, name_en: e.target.value } : null)} 
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>Arabic Name (الاسم بالعربي)</Label>
              <Input 
                value={editing?.name_ar || ""} 
                onChange={(e) => setEditing(editing ? { ...editing, name_ar: e.target.value } : null)} 
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
