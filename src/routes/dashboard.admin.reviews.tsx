import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Trash2, Loader2, Plus, MessageSquare, Sparkles, RefreshCw, Save } from "lucide-react";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { useListSearch, validateListSearch } from "@/components/admin/useListSearch";
import { sortItems, paginate } from "@/lib/list-utils";
import { SortableHead } from "@/components/admin/SortableHead";
import { Paginator } from "@/components/admin/Paginator";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCanAccess } from "@/lib/permissions-store";
import { useAdminT } from "@/lib/admin-i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_REVIEWS } from "@/data/default-helpdesk";

export type Review = {
  id: string;
  author: string;
  company: string;
  rating: number;
  text: string;
  approved: boolean;
  created_at: string;
};

export const Route = createFileRoute("/dashboard/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews & Testimonials — Admin" }] }),
  validateSearch: validateListSearch,
  component: ReviewsPage,
});

const PAGE_SIZE = 8;

function ReviewsPage() {
  const { t, isRtl, lang } = useAdminT();
  const isAr = lang === "ar";
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New review form
  const [newReview, setNewReview] = useState({
    author: "",
    company: "",
    rating: 5,
    text: "",
    approved: true,
  });

  const can = useCanAccess("reviews");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[reviews] database load failed:", error);
      } else if (data) {
        setItems(data as Review[]);
      }
    } catch (err) {
      console.error("[reviews] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();

    const channel = supabase
      .channel("reviews_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const toggle = async (id: string, currentStatus: boolean) => {
    if (!can.edit) return;
    const nextStatus = !currentStatus;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, approved: nextStatus } : x)));

    try {
      const { error } = await supabase
        .from("reviews")
        .update({ approved: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success(nextStatus ? (isAr ? "تم اعتماد التقييم" : "Review approved") : (isAr ? "تم إخفاء التقييم" : "Review hidden"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to update review status");
      void load();
    }
  };

  const remove = async (id: string) => {
    if (!can.delete) return;
    if (!confirm(isAr ? "هل تريد حذف هذا التقييم؟" : "Delete this review?")) return;

    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      toast.success(isAr ? "تم حذف التقييم" : "Review deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete review");
      void load();
    }
  };

  const handleAddReview = async () => {
    if (!newReview.author || !newReview.text) {
      toast.error(isAr ? "يرجى إدخال اسم العميل ونص التقييم" : "Please provide author name and review text");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        author: newReview.author.trim(),
        company: newReview.company.trim(),
        rating: Number(newReview.rating) || 5,
        text: newReview.text.trim(),
        approved: newReview.approved,
      });

      if (error) throw error;
      toast.success(isAr ? "تمت إضافة التقييم بنجاح" : "Review added successfully");
      setIsAddOpen(false);
      setNewReview({ author: "", company: "", rating: 5, text: "", approved: true });
      void load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add review");
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const { error } = await supabase.from("reviews").insert(DEFAULT_REVIEWS);
      if (error) throw error;
      toast.success(isAr ? "تم تحميل عينات التقييمات بنجاح!" : "Sample reviews loaded successfully!");
      void load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to seed reviews");
    } finally {
      setSeeding(false);
    }
  };

  const sorted = useMemo(
    () =>
      sortItems(items, sort, dir, {
        author: (r) => r.author,
        company: (r) => r.company,
        rating: (r) => r.rating,
        date: (r) => r.created_at,
        status: (r) => (r.approved ? 1 : 0),
      }),
    [items, sort, dir]
  );

  const pg = paginate(sorted, page, PAGE_SIZE);
  const pageIds = pg.items.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) => (allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))));
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const bulkDelete = async () => {
    if (!can.delete || selected.length === 0) return;
    if (!confirm(isAr ? `هل تريد حذف ${selected.length} تقييمات؟` : `Delete ${selected.length} reviews?`)) return;

    const toDelete = [...selected];
    setItems((prev) => prev.filter((x) => !toDelete.includes(x.id)));
    setSelected([]);

    try {
      const { error } = await supabase.from("reviews").delete().in("id", toDelete);
      if (error) throw error;
      toast.success(isAr ? "تم حذف التقييمات المحددة" : "Selected reviews deleted");
    } catch (err: any) {
      toast.error(err?.message || "Bulk deletion failed");
      void load();
    }
  };

  const bulkStatus = async (v: string) => {
    if (!can.edit || selected.length === 0) return;
    const approved = v === "approved";
    const toUpdate = [...selected];

    setItems((prev) => prev.map((x) => (toUpdate.includes(x.id) ? { ...x, approved } : x)));
    setSelected([]);

    try {
      const { error } = await supabase
        .from("reviews")
        .update({ approved, updated_at: new Date().toISOString() })
        .in("id", toUpdate);

      if (error) throw error;
      toast.success(isAr ? "تم تحديث حالة التقييمات" : "Selected reviews updated");
    } catch (err: any) {
      toast.error(err?.message || "Bulk status update failed");
      void load();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-accent" />
              <span>{isAr ? "تقييمات وآراء العملاء" : "Customer Reviews & Testimonials"}</span>
            </h1>
            <Badge variant="secondary" className="text-xs font-mono">
              {items.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr
              ? "إدارة واعتماد تقييمات العملاء وشهادات الموقع العام في الوقت الفعلي."
              : "Moderate customer ratings and public homepage testimonials in real-time."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {items.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDefaults}
              disabled={seeding || loading}
              className="text-xs"
            >
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" /> : <Sparkles className="h-3.5 w-3.5 text-accent me-1.5" />}
              {isAr ? "تحميل عينات التقييمات" : "Load Sample Reviews"}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 me-1.5 ${loading ? "animate-spin" : ""}`} />
            {isAr ? "تحديث" : "Refresh"}
          </Button>

          <Button size="sm" onClick={() => setIsAddOpen(true)} className="rounded-xl">
            <Plus className="h-4 w-4 me-1.5" />
            {isAr ? "إضافة تقييم" : "Add Review"}
          </Button>

          <ViewToggle value={view} />
        </div>
      </div>

      <BulkActionBar
        count={selected.length}
        onClear={() => setSelected([])}
        onDelete={can.delete ? bulkDelete : undefined}
        statusOptions={[
          { label: isAr ? "اعتماد" : "Approve", value: "approved" },
          { label: isAr ? "إخفاء / رفض" : "Hide / Reject", value: "rejected" },
        ]}
        onStatusChange={can.edit ? bulkStatus : undefined}
      />

      {loading ? (
        <Card className="p-12 text-center text-muted-foreground rounded-2xl">
          <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2 text-accent" />
          <span>{isAr ? "جارٍ جلب التقييمات..." : "Loading reviews..."}</span>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-2xl">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <h3 className="font-bold text-base">{isAr ? "لا توجد تقييمات عملاء بعد" : "No customer reviews yet"}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? "يمكنك إضافة تقييم يدوي أو تحميل التقييمات القياسية بنقرة واحدة." : "Add a review manually or load sample testimonials."}
          </p>
        </Card>
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pg.items.map((r) => (
            <Card key={r.id} className="relative overflow-hidden group hover:border-accent/40 transition-all rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < r.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={r.approved}
                      onCheckedChange={() => toggle(r.id, r.approved)}
                      disabled={!can.edit}
                    />
                  </div>
                </div>

                <p className="text-xs italic text-muted-foreground line-clamp-3 leading-relaxed">
                  "{r.text}"
                </p>

                <div className="pt-2 border-t flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs">{r.author}</div>
                    <div className="text-[11px] text-muted-foreground">{r.company}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(r.id)}
                    disabled={!can.delete}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} />
                </TableHead>
                <SortableHead field="author" sort={sort} dir={dir} onSort={toggleSort}>
                  {isAr ? "العميل" : "Client"}
                </SortableHead>
                <SortableHead field="company" sort={sort} dir={dir} onSort={toggleSort}>
                  {isAr ? "الشركة" : "Company"}
                </SortableHead>
                <SortableHead field="rating" sort={sort} dir={dir} onSort={toggleSort}>
                  {isAr ? "التقييم" : "Rating"}
                </SortableHead>
                <TableHead>{isAr ? "المراجعة" : "Feedback"}</TableHead>
                <SortableHead field="date" sort={sort} dir={dir} onSort={toggleSort}>
                  {isAr ? "التاريخ" : "Date"}
                </SortableHead>
                <TableHead className="text-center">{isAr ? "معتمد" : "Approved"}</TableHead>
                <TableHead className="text-end">{isAr ? "إجراء" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pg.items.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggleOne(r.id)} />
                  </TableCell>
                  <TableCell className="font-bold text-xs">{r.author}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.company}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < r.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    "{r.text}"
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {new Date(r.created_at).toLocaleDateString(isAr ? "ar" : "en")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={r.approved}
                      onCheckedChange={() => toggle(r.id, r.approved)}
                      disabled={!can.edit}
                    />
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => remove(r.id)}
                      disabled={!can.delete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
        total={pg.total}
        start={pg.start}
        end={pg.end}
        onPageChange={setPage}
      />

      {/* Add Review Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة تقييم عميل جديد" : "Add New Customer Review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isAr ? "اسم العميل *" : "Client Name *"}</Label>
                <Input
                  value={newReview.author}
                  onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                  placeholder="e.g. Eng. Tariq"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "الشركة" : "Company"}</Label>
                <Input
                  value={newReview.company}
                  onChange={(e) => setNewReview({ ...newReview, company: e.target.value })}
                  placeholder="e.g. Logistics Park"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? "التقييم (النجوم)" : "Rating (1 to 5 Stars)"}</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="p-1 rounded hover:bg-muted"
                  >
                    <Star
                      className={`h-6 w-6 ${star <= newReview.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold ms-2">{newReview.rating} / 5</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? "نص التقييم *" : "Review / Testimonial Text *"}</Label>
              <Textarea
                rows={3}
                value={newReview.text}
                onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                placeholder="Share client feedback about project delivery, quality, or support..."
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="rev-appr"
                checked={newReview.approved}
                onCheckedChange={(c) => setNewReview({ ...newReview, approved: !!c })}
              />
              <Label htmlFor="rev-appr" className="cursor-pointer">
                {isAr ? "اعتماد التقييم فوراً (يظهر في الموقع العام)" : "Approve immediately (visible on public site)"}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddReview} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
              {isAr ? "حفظ التقييم" : "Save Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}