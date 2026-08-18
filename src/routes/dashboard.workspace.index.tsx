import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { services } from "@/data/site";
import { CheckCircle2, Clock, Loader2, Send, FileText, LifeBuoy, Plus } from "lucide-react";
import { useClientT } from "@/lib/client-i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/workspace/")({
  component: ClientOverview,
});

export type RequestStatus = "submitted" | "in_review" | "in_progress" | "completed";

export type ClientRequest = {
  id: string;
  title: string;
  service: string;
  description: string;
  status: RequestStatus;
  progress: number;
  updatedAt: string;
};

const statusIcon: Record<RequestStatus, any> = {
  submitted: Send,
  in_review: Clock,
  in_progress: Loader2,
  completed: CheckCircle2,
};

const statusTone: Record<RequestStatus, string> = {
  submitted: "bg-muted text-foreground",
  in_review: "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400",
  in_progress: "bg-accent/15 text-accent",
  completed: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400",
};

function ClientOverview() {
  const { t, lang, isRtl } = useClientT();
  const { user } = useAuth();

  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ title: "", service: services[0]?.title.en || "Security Systems", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadWorkspaceData = async () => {
    try {
      if (!user) return;

      // 1. Fetch Client Leads / Inquiries
      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, service, message, status, created_at")
        .or(`email.eq.${user.email},full_name.eq.${user.user_metadata?.full_name || ""}`)
        .order("created_at", { ascending: false });

      if (leadsData && leadsData.length > 0) {
        const mappedRequests: ClientRequest[] = leadsData.map((l: any, idx: number) => {
          let s: RequestStatus = "submitted";
          let prog = 15;
          if (l.status === "contacted" || l.status === "in_review") { s = "in_review"; prog = 40; }
          else if (l.status === "qualified" || l.status === "in_progress") { s = "in_progress"; prog = 75; }
          else if (l.status === "won" || l.status === "closed") { s = "completed"; prog = 100; }

          return {
            id: l.id,
            title: l.service || `Project Request #${idx + 1}`,
            service: l.service || "Enterprise Solution",
            description: l.message || "Consultation request",
            status: s,
            progress: prog,
            updatedAt: l.created_at ? new Date(l.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
          };
        });
        setRequests(mappedRequests);
      }

      // 2. Fetch Client Orders / Quotes
      const { data: quotesData } = await supabase
        .from("quotes")
        .select("id, total, status")
        .eq("email", user.email);

      setOrdersCount((quotesData || []).length);

      // 3. Fetch Client Support Tickets
      const { data: ticketsData } = await supabase
        .from("support_tickets")
        .select("id, status")
        .or(`created_by.eq.${user.id},client_id.eq.${user.id}`);

      const tickets = ticketsData || [];
      const openTkts = tickets.filter((tk: any) => tk.status === "open" || tk.status === "pending" || tk.status === "in_progress").length;
      setOpenTicketsCount(openTkts);
    } catch (err) {
      console.warn("[workspace] data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspaceData();
  }, [user]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    setSubmitting(true);
    try {
      // 1. Insert into Supabase leads table
      const { data, error } = await supabase.from("leads").insert({
        full_name: user?.name || user?.email?.split("@")[0] || "Client User",
        email: user?.email || "client@company.com",
        category: form.service,
        message: `${form.title}: ${form.description}`,
        status: "new",
      }).select().single();

      if (error) throw error;

      // 2. Add Notification for Admins
      await supabase.from("admin_notifications").insert({
        type: "lead",
        title: `New Workspace Inquiry: ${form.title}`,
        message: `From: ${user?.email || "Client"} · Service: ${form.service}`,
        href: "/dashboard/admin/leads",
        read: false,
      });

      toast.success(t("submittedMsg", "تم إرسال طلبك بنجاح وسيتواصل معك الفريق قريباً."));
      setForm({ title: "", service: services[0]?.title.en || "Security Systems", description: "" });
      void loadWorkspaceData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { label: t("statsActive", "الطلبات النشطة"), value: requests.filter((r) => r.status === "in_progress" || r.status === "submitted").length, tone: "from-accent/20 to-accent/5" },
    { label: t("statsCompleted", "المكتملة"), value: requests.filter((r) => r.status === "completed").length, tone: "from-emerald-500/20 to-emerald-500/5" },
    { label: t("statsOrders", "عروض الأسعار والطلبات"), value: ordersCount, tone: "from-blue-500/20 to-blue-500/5" },
    { label: t("statsOpenTickets", "التذاكر المفتوحة"), value: openTicketsCount, tone: "from-amber-500/20 to-amber-500/5" },
  ];

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.tone} border-0 shadow-xs`}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="font-display text-3xl font-bold mt-1">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" />
              <span>{t("newInquiry", "طلب مشروع / استشارة جديدة")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">{t("title", "عنوان المشروع / المتطلب")}</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. CCTV & Access Control Upgrade"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("service", "الخدمة / القطاع")}</Label>
                <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.slug} value={s.title.en}>
                        {lang === "ar" ? s.title.ar : s.title.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">{t("description", "تفاصيل المتطلبات الهندسية")}</Label>
                <Textarea
                  id="desc"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your site requirements, scale, or timeline..."
                  required
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <Send className={`h-4 w-4 ${isRtl ? "ms-2" : "me-2"}`} />
                )}
                <span>{t("submit", "إرسال الطلب")}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Requests List */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader>
            <CardTitle className="font-display text-lg">{t("myRequests", "طلباتي ومشاريعي")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-accent" />
                <span>{t("Loading your project requests...", "جارٍ جلب طلباتك...")}</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs border border-dashed rounded-xl">
                <span>{t("No requests submitted yet. Use the form on the left to start.", "لا توجد طلبات بعد. يمكنك إنشاء طلب جديد من النموذج.")}</span>
              </div>
            ) : (
              requests.map((r) => {
                const Icon = statusIcon[r.status] || Send;
                return (
                  <div key={r.id} className="p-4 rounded-xl border bg-card space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-sm text-foreground">{r.title}</div>
                      <Badge className={`text-[10.5px] capitalize ${statusTone[r.status]}`}>
                        <Icon className="h-3 w-3 me-1" />
                        {r.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.description}</p>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10.5px] text-muted-foreground">
                        <span>{t("progress", "التقدم")}</span>
                        <span className="font-mono">{r.progress}%</span>
                      </div>
                      <Progress value={r.progress} className="h-1.5" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
