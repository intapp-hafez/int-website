import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { FileText, Loader2, Search, Plus, DollarSign, CheckCircle2, Send, Save, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type DbQuotation = {
  id: string;
  client: string;
  company?: string;
  email?: string;
  phone?: string;
  service: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  date: string;
};

export const Route = createFileRoute("/dashboard/admin/quotations/")({
  head: () => ({ meta: [{ title: "Quotations Management — Admin" }] }),
  validateSearch: validateListSearch,
  component: QuotationsPage,
});

const PAGE_SIZE = 10;
const Q_STATUSES = ["draft", "sent", "accepted", "rejected"] as const;

function QuotationsPage() {
  const [items, setItems] = useState<DbQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // New quotation form state
  const [newQuote, setNewQuote] = useState({
    full_name: "",
    company: "",
    email: "",
    phone: "",
    service_name: "",
    total: 5000,
    currency: "USD",
    status: "sent" as "draft" | "sent" | "accepted" | "rejected",
    notes: "",
  });

  const navigate = useNavigate();
  const { t, lang, isRtl } = useAdminT();
  const isAr = lang === "ar";
  const can = useCanAccess("quotations");
  const { view, page, sort, dir, setPage, toggleSort } = useListSearch({ defaultView: "table" });

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any).from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        const mapped: DbQuotation[] = data.map((x: any) => ({
          id: x.id,
          client: x.full_name || x.company || x.email || "Enterprise Client",
          company: x.company,
          email: x.email,
          phone: x.phone,
          service: x.service_name || x.items?.[0]?.name_en || "System Integration Solution",
          amount: Number(x.total) || 0,
          currency: x.currency || "USD",
          status: (x.status as any) || "sent",
          date: x.created_at ? new Date(x.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        }));
        setItems(mapped);
      }
    } catch (err) {
      console.warn("[admin-quotes] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuotes();

    const channel = supabase
      .channel("admin_quotes_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, () => {
        void loadQuotes();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const total = items.reduce((a, b) => a + b.amount, 0);
  const won = items.filter((q) => q.status === "accepted").reduce((a, b) => a + b.amount, 0);

  const filtered = items.filter((item) =>
    [item.client, item.service, item.id, item.company || "", item.email || ""].some((v) =>
      v.toLowerCase().includes(q.toLowerCase())
    )
  );

  const sorted = useMemo(
    () =>
      sortItems(filtered, sort, dir, {
        id: (q) => q.id,
        client: (q) => q.client,
        service: (q) => q.service,
        amount: (q) => q.amount,
        date: (q) => q.date,
        status: (q) => q.status,
      }),
    [filtered, sort, dir]
  );

  const pg = paginate(sorted, page, PAGE_SIZE);

  const setStatus = async (id: string, status: DbQuotation["status"]) => {
    if (!can.edit) return;
    setItems((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    try {
      const { error } = await (supabase as any).from("quotes").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(isAr ? "تم تحديث حالة عرض السعر" : "Quotation status updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
      void loadQuotes();
    }
  };

  const handleCreateQuotation = async () => {
    if (!newQuote.full_name && !newQuote.company) {
      toast.error(isAr ? "يرجى كتابة اسم العميل أو اسم الشركة" : "Please provide client name or company");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await (supabase as any)
        .from("quotes")
        .insert({
          full_name: newQuote.full_name.trim(),
          company: newQuote.company.trim(),
          email: newQuote.email.trim(),
          phone: newQuote.phone.trim(),
          service_name: newQuote.service_name.trim() || "Integrated Solution",
          total: Number(newQuote.total) || 0,
          currency: newQuote.currency,
          status: newQuote.status,
          message: newQuote.notes,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(isAr ? "تم إنشاء عرض السعر بنجاح" : "Quotation created successfully");
      setIsCreateOpen(false);
      setNewQuote({
        full_name: "",
        company: "",
        email: "",
        phone: "",
        service_name: "",
        total: 5000,
        currency: "USD",
        status: "sent",
        notes: "",
      });
      void loadQuotes();

      if (data?.id) {
        navigate({ to: "/dashboard/admin/quotations/$id", params: { id: data.id } } as any);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create quotation");
    } finally {
      setCreating(false);
    }
  };

  const bulkDelete = async () => {
    if (!can.delete || selected.length === 0) return;
    if (!confirm(isAr ? `هل تريد حذف ${selected.length} عروض أسعار؟` : `Delete ${selected.length} quotations?`)) return;

    const toDelete = [...selected];
    setItems((prev) => prev.filter((q) => !toDelete.includes(q.id)));
    setSelected([]);

    try {
      const { error } = await (supabase as any).from("quotes").delete().in("id", toDelete);
      if (error) throw error;
      toast.success(isAr ? "تم حذف العروض المحددة" : "Selected quotations deleted");
    } catch (err: any) {
      toast.error(err?.message || "Bulk deletion failed");
      void loadQuotes();
    }
  };

  const bulkStatus = async (status: string) => {
    if (!can.edit || selected.length === 0) return;
    const toUpdate = [...selected];
    setItems((prev) =>
      prev.map((q) => (toUpdate.includes(q.id) ? { ...q, status: status as DbQuotation["status"] } : q))
    );
    setSelected([]);

    try {
      const { error } = await (supabase as any).from("quotes").update({ status }).in("id", toUpdate);
      if (error) throw error;
      toast.success(isAr ? "تم تحديث حالة العروض" : "Quotations status updated");
    } catch (err: any) {
      toast.error(err?.message || "Bulk update failed");
      void loadQuotes();
    }
  };

  const pageIds = pg.items.map((q) => q.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAllOnPage = () =>
    setSelected((prev) =>
      allOnPage ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))
    );
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const StatusSelect = ({ q }: { q: DbQuotation }) => (
    <Select value={q.status} onValueChange={(v) => setStatus(q.id, v as DbQuotation["status"])}>
      <SelectTrigger className="h-8 w-28 text-xs rounded-xl">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Q_STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="capitalize text-xs">
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const go = (id: string) => navigate({ to: "/dashboard/admin/quotations/$id", params: { id } });

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Metric Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{isAr ? "إجمالي قيمة العروض" : "Total Pipeline"}</span>
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
            <div className="font-display text-2xl font-bold mt-1 text-foreground font-mono">
              ${total.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{isAr ? "العروض المقبولة" : "Won Quotations"}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="font-display text-2xl font-bold mt-1 text-emerald-600 font-mono">
              ${won.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{isAr ? "عدد العروض" : "Active Quotes"}</span>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="font-display text-2xl font-bold mt-1">{items.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap pb-4">
          <div>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              <span>{isAr ? "عروض الأسعار" : "Quotations"}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {sorted.length} {isAr ? "من" : "of"} {items.length} {isAr ? "إجمالي" : "total"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث..." : "Search quotes..."}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="ps-9 h-9 text-xs rounded-xl w-48 sm:w-64"
              />
            </div>
            <ViewToggle value={view} />
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="rounded-xl">
              <Plus className="h-4 w-4 me-1.5" />
              {isAr ? "عرض سعر جديد" : "Create Quote"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <BulkActionBar
            count={selected.length}
            onClear={() => setSelected([])}
            onDelete={can.delete ? bulkDelete : undefined}
            statusOptions={
              can.edit
                ? Q_STATUSES.map((s) => ({ value: s, label: s }))
                : undefined
            }
            onStatusChange={can.edit ? bulkStatus : undefined}
          />

          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
              <span>{isAr ? "جارٍ جلب عروض الأسعار..." : "Loading quotations..."}</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {isAr ? "لا توجد عروض أسعار مطابقة." : "No quotations found."}
            </p>
          ) : view === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pg.items.map((q) => (
                <Card
                  key={q.id}
                  className="p-4 rounded-xl border bg-card hover:border-accent/40 transition cursor-pointer"
                  onClick={() => go(q.id)}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs text-accent font-bold">#{q.id.slice(0, 8)}</span>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {q.status}
                    </Badge>
                  </div>
                  <div className="font-bold text-sm text-foreground">{q.client}</div>
                  <div className="text-xs text-muted-foreground">{q.service}</div>
                  <div className="font-mono font-bold text-base mt-2 text-foreground">
                    ${q.amount.toLocaleString()} {q.currency}
                  </div>
                  <div
                    className="flex items-center justify-between pt-3 border-t mt-3 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-muted-foreground font-mono">{q.date}</span>
                    <StatusSelect q={q} />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allOnPage} onCheckedChange={toggleAllOnPage} />
                    </TableHead>
                    <SortableHead field="id" sort={sort} dir={dir} onSort={toggleSort}>
                      {isAr ? "الرقم" : "ID"}
                    </SortableHead>
                    <SortableHead field="client" sort={sort} dir={dir} onSort={toggleSort}>
                      {isAr ? "العميل" : "Client"}
                    </SortableHead>
                    <SortableHead field="service" sort={sort} dir={dir} onSort={toggleSort}>
                      {isAr ? "الخدمة" : "Service"}
                    </SortableHead>
                    <SortableHead field="amount" sort={sort} dir={dir} onSort={toggleSort}>
                      {isAr ? "المبلغ" : "Amount"}
                    </SortableHead>
                    <SortableHead field="date" sort={sort} dir={dir} onSort={toggleSort}>
                      {isAr ? "التاريخ" : "Date"}
                    </SortableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-end">{isAr ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pg.items.map((q) => (
                    <TableRow
                      key={q.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => go(q.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.includes(q.id)}
                          onCheckedChange={() => toggleOne(q.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-accent">
                        #{q.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs font-bold">{q.client}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{q.service}</TableCell>
                      <TableCell className="text-xs font-mono font-bold">
                        ${q.amount.toLocaleString()} {q.currency}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{q.date}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <StatusSelect q={q} />
                      </TableCell>
                      <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => go(q.id)}>
                          {isAr ? "عرض" : "View"}
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
        </CardContent>
      </Card>

      {/* Create Quotation Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isAr ? "إنشاء عرض سعر جديد" : "Create New Quotation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isAr ? "اسم العميل" : "Client Name *"}</Label>
                <Input
                  value={newQuote.full_name}
                  onChange={(e) => setNewQuote({ ...newQuote, full_name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "الشركة" : "Company Name"}</Label>
                <Input
                  value={newQuote.company}
                  onChange={(e) => setNewQuote({ ...newQuote, company: e.target.value })}
                  placeholder="e.g. Acme Corp"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                <Input
                  value={newQuote.email}
                  onChange={(e) => setNewQuote({ ...newQuote, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "الهاتف" : "Phone"}</Label>
                <Input
                  value={newQuote.phone}
                  onChange={(e) => setNewQuote({ ...newQuote, phone: e.target.value })}
                  placeholder="+966 50 000 0000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? "الخدمة أو الحل الهندسي" : "Service or Solution *"}</Label>
              <Input
                value={newQuote.service_name}
                onChange={(e) => setNewQuote({ ...newQuote, service_name: e.target.value })}
                placeholder="e.g. Enterprise Security Architecture & Access Control"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>{isAr ? "المبلغ الإجمالي" : "Total Amount *"}</Label>
                <Input
                  type="number"
                  value={newQuote.total}
                  onChange={(e) => setNewQuote({ ...newQuote, total: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "العملة" : "Currency"}</Label>
                <Select
                  value={newQuote.currency}
                  onValueChange={(v) => setNewQuote({ ...newQuote, currency: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                    <SelectItem value="AED">AED (د.إ)</SelectItem>
                    <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "الحالة الأولية" : "Initial Status"}</Label>
                <Select
                  value={newQuote.status}
                  onValueChange={(v) => setNewQuote({ ...newQuote, status: v as any })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? "ملاحظات إضافية" : "Project Notes & Scope"}</Label>
              <Textarea
                rows={3}
                value={newQuote.notes}
                onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
                placeholder="Details of deliverables, hardware warranty, SLA terms..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateQuotation} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
              {isAr ? "إنشاء وحفظ" : "Create & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}