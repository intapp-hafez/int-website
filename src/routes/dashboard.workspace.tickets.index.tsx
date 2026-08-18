import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Loader2, LifeBuoy } from "lucide-react";
import { useClientT } from "@/lib/client-i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

import { dispatchTicketNotificationEmails } from "@/lib/smtp-store";

export const Route = createFileRoute("/dashboard/workspace/tickets/")({
  head: () => ({ meta: [{ title: "Support Tickets — Client Workspace" }] }),
  component: ClientTickets,
});

export type SupportCategoryItem = {
  value: string;
  name_en: string;
  name_ar: string;
  default_sla_policy_id?: string | null;
  responsible_emails?: string;
};

export type Ticket = {
  id: string;
  ticket_no?: string;
  subject: string;
  client: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "pending" | "resolved" | "closed";
  updated: string;
  category?: string;
};

const DEFAULT_CATEGORIES: SupportCategoryItem[] = [
  { value: "cctv", name_en: "CCTV & Video Surveillance", name_ar: "أنظمة المراقبة والكاميرات CCTV" },
  { value: "access_control", name_en: "Access Control & Attendance", name_ar: "التحكم في الأبواب وبصمة الحضور" },
  { value: "fire_alarm", name_en: "Fire Alarm & Safety", name_ar: "إنذار الحريق وأنظمة السلامة" },
  { value: "networking", name_en: "Network Infrastructure & VoIP", name_ar: "البنية التحتية للشبكات والسنترال" },
  { value: "datacenter", name_en: "Data Center & UPS", name_ar: "غرف الخوادم وأنظمة الطاقة" },
  { value: "sound_av", name_en: "Audio Visual & Public Address", name_ar: "الأنظمة الصوتية والمرئية" },
  { value: "maintenance", name_en: "General Maintenance & SLA", name_ar: "الصيانة الدورية وعقود التشغيل" },
];

function ClientTickets() {
  const { t, isRtl } = useClientT();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<SupportCategoryItem[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<Ticket["priority"] | "all">("all");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<{
    subject: string;
    priority: Ticket["priority"];
    category: string;
    message: string;
  }>({
    subject: "",
    priority: "medium",
    category: "cctv",
    message: "",
  });

  const loadCategories = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("support_categories")
        .select("value, name_en, name_ar, default_sla_policy_id, responsible_emails")
        .eq("active", true)
        .order("sort_order");

      if (!error && data && data.length > 0) {
        setCategories(data);
        setForm((prev) => ({ ...prev, category: data[0].value }));
      }
    } catch (err) {
      console.warn("[workspace-tickets] categories load error:", err);
    }
  };

  const loadTickets = async () => {
    try {
      if (!user) return;
      const { data, error } = await (supabase as any)
        .from("support_tickets")
        .select("*")
        .or(`created_by.eq.${user.id},client_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (data) {
        const mapped: Ticket[] = data.map((tk: any) => ({
          id: tk.id,
          ticket_no: tk.ticket_no || "TIC",
          subject: tk.subject,
          client: user.user_metadata?.full_name || user.email || "Client",
          priority: tk.priority || "medium",
          status: tk.status || "open",
          updated: tk.updated_at ? new Date(tk.updated_at).toLocaleDateString(isAr ? "ar" : "en") : new Date().toLocaleDateString(isAr ? "ar" : "en"),
          category: tk.category || "general",
        }));
        setTickets(mapped);
      }
    } catch (err) {
      console.warn("[workspace-tickets] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
    void loadTickets();

    const ticketsChannel = (supabase as any)
      .channel("workspace_tickets_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => {
        void loadTickets();
      })
      .subscribe();

    const categoriesChannel = (supabase as any)
      .channel("workspace_categories_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_categories" }, () => {
        void loadCategories();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(ticketsChannel);
      void supabase.removeChannel(categoriesChannel);
    };
  }, [user]);

  const priorityTone: Record<string, string> = {
    low: "bg-muted text-foreground",
    medium: "bg-blue-500/10 text-blue-700",
    high: "bg-amber-100 text-amber-900",
    urgent: "bg-destructive/10 text-destructive",
  };
  const statusTone: Record<string, string> = {
    open: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400",
    in_progress: "bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-400",
    pending: "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400",
    waiting_client: "bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-400",
    resolved: "bg-blue-500/10 text-blue-700",
    closed: "bg-muted text-foreground",
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;

    setSubmitting(true);
    try {
      const matchedCat = categories.find((c) => c.value === form.category);
      const payload: any = {
        subject: form.subject.trim(),
        priority: form.priority,
        category: form.category,
        status: "open",
        created_by: user?.id,
        client_id: user?.id,
        sla_policy_id: matchedCat?.default_sla_policy_id || null,
      };

      // 1. Insert into support_tickets
      const { data: ticketData, error: ticketError } = await (supabase as any)
        .from("support_tickets")
        .insert(payload)
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Insert initial message
      if (ticketData) {
        await (supabase as any).from("support_ticket_messages").insert({
          ticket_id: ticketData.id,
          author_id: user?.id,
          body: form.message.trim(),
          is_internal: false,
        });

        // 3. Dispatch Email Alerts to Assigned Category Technicians/Engineers
        await dispatchTicketNotificationEmails({
          ticketId: ticketData.id,
          ticketNo: ticketData.ticket_no || "TIC",
          subject: form.subject.trim(),
          categoryName: matchedCat ? (isAr ? matchedCat.name_ar : matchedCat.name_en) : form.category,
          priority: form.priority,
          clientName: user?.user_metadata?.full_name || user?.email || "Client",
          clientEmail: user?.email || "",
          message: form.message.trim(),
          responsibleEmails: matchedCat?.responsible_emails || "",
        });
      }

      toast.success(
        isAr
          ? "تم فتح تذكرة الدعم وإشعار الفريق الفني المختص عبر البريد الإلكتروني"
          : "Support ticket opened & notified to designated technicians!"
      );
      setForm({
        subject: "",
        priority: "medium",
        category: categories[0]?.value || "cctv",
        message: "",
      });
      setOpen(false);
      void loadTickets();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create support ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (val?: string) => {
    if (!val) return "—";
    const found = categories.find((c) => c.value === val);
    if (found) return isAr ? found.name_ar || found.name_en : found.name_en;
    return val;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((tk) => {
      if (filterCategory !== "all" && tk.category !== filterCategory) return false;
      if (filterPriority !== "all" && tk.priority !== filterPriority) return false;
      if (q && !(tk.subject.toLowerCase().includes(q) || (tk.ticket_no && tk.ticket_no.toLowerCase().includes(q)))) return false;
      return true;
    });
  }, [tickets, query, filterCategory, filterPriority]);

  return (
    <Card className="rounded-2xl border shadow-xs" dir={isRtl ? "rtl" : "ltr"}>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 flex-wrap pb-4">
        <div>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-accent" />
            <span>{isAr ? "تذاكر الدعم والصيانة" : "Support & Maintenance Tickets"}</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr
              ? "افتح وتابع تذاكر الصيانة للأنظمة الأمنية والشبكات ومتابعة المهندسين المسؤولين."
              : "Open and track maintenance tickets for security systems, networks, and assignees."}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className={`h-4 w-4 ${isRtl ? "ms-1" : "me-1"}`} />
              <span>{isAr ? "فتح تذكرة جديدة" : "Open New Ticket"}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isAr ? "فتح تذكرة دعم جديدة" : "Open New Support Ticket"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onCreate} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>{isAr ? "الموضوع / عنوان المشكلة *" : "Subject / Issue Summary *"}</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder={isAr ? "مثال: عطل في كاميرات البوابة الرئيسية" : "e.g. CCTV camera offline at Gate 1"}
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{isAr ? "فئة النظام / الخدمة *" : "System Category *"}</Label>
                  <Select value={form.category} onValueChange={(v: string) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {isAr ? c.name_ar || c.name_en : c.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{isAr ? "درجة الأولوية" : "Priority Level"}</Label>
                  <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{isAr ? "منخفضة (Low)" : "Low"}</SelectItem>
                      <SelectItem value="medium">{isAr ? "متوسطة (Medium)" : "Medium"}</SelectItem>
                      <SelectItem value="high">{isAr ? "عالية (High)" : "High"}</SelectItem>
                      <SelectItem value="urgent">{isAr ? "حرجة / طارئة (Urgent)" : "Urgent"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "تفاصيل المشكلة والموقع أو الأرقام التسلسلية للأجهزة *" : "Issue Details & Device Serial Numbers *"}</Label>
                <Textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={isAr ? "صف المشكلة بدقة واذكر موقع المبنى، الجهاز أو الأعطال الظاهرة..." : "Provide branch location, device models, serial numbers or observed error..."}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  <span>{isAr ? "إرسال التذكرة" : "Submit Ticket"}</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث في تذاكر الدعم..." : "Search tickets..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ps-9 h-9 text-xs rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={(v: any) => setFilterCategory(v)}>
              <SelectTrigger className="w-40 h-9 text-xs rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الفئات" : "All Categories"}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {isAr ? c.name_ar || c.name_en : c.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={(v: any) => setFilterPriority(v)}>
              <SelectTrigger className="w-32 h-9 text-xs rounded-xl"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الأولويات" : "All Priorities"}</SelectItem>
                <SelectItem value="low">{isAr ? "منخفضة" : "Low"}</SelectItem>
                <SelectItem value="medium">{isAr ? "متوسطة" : "Medium"}</SelectItem>
                <SelectItem value="high">{isAr ? "عالية" : "High"}</SelectItem>
                <SelectItem value="urgent">{isAr ? "حرجة" : "Urgent"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-accent" />
            <span>{isAr ? "جارٍ جلب تذاكر الدعم..." : "Loading your tickets..."}</span>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{isAr ? "لا توجد تذاكر مطابقة." : "No tickets found."}</p>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-28">{isAr ? "رقم التذكرة" : "Ticket No"}</TableHead>
                  <TableHead>{isAr ? "الموضوع" : "Subject"}</TableHead>
                  <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                  <TableHead>{isAr ? "الأولوية" : "Priority"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-end">{isAr ? "آخر تحديث" : "Updated"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tk) => (
                  <TableRow
                    key={tk.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate({ to: "/dashboard/workspace/tickets/$id", params: { id: tk.id } })}
                  >
                    <TableCell className="font-mono text-xs font-bold text-accent">{tk.ticket_no || "TIC"}</TableCell>
                    <TableCell className="text-xs sm:text-sm font-medium">{tk.subject}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      <Badge variant="outline" className="text-[10px]">
                        {getCategoryLabel(tk.category)}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge className={`${priorityTone[tk.priority] || "bg-muted"} border-0 capitalize text-[10px]`}>{tk.priority}</Badge></TableCell>
                    <TableCell><Badge className={`${statusTone[tk.status] || "bg-muted"} border-0 capitalize text-[10px]`}>{tk.status}</Badge></TableCell>
                    <TableCell className="text-end text-xs text-muted-foreground font-mono">{tk.updated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
