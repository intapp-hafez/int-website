import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Mail, Phone, Building2, FileText, Loader2, Plus, ShoppingBag, DollarSign, Calendar, ExternalLink } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paginator } from "@/components/admin/Paginator";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/clients/$id")({
  head: () => ({ meta: [{ title: "Client Details — Admin" }] }),
  component: ClientDetail,
});

type ClientData = {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  tier: "Strategic" | "Enterprise" | "SMB";
  created_at?: string;
};

const TIER_TONES: Record<string, string> = {
  Strategic: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400",
  Enterprise: "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400",
  SMB: "bg-muted text-foreground",
};

const QUOTE_TONE: Record<string, string> = {
  draft: "bg-muted text-foreground",
  sent: "bg-blue-500/10 text-blue-700",
  accepted: "bg-emerald-100 text-emerald-900",
  rejected: "bg-destructive/10 text-destructive",
};

function ClientDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { t, lang, isRtl } = useAdminT();
  const isAr = lang === "ar";

  const [client, setClient] = useState<ClientData | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination for quotes
  const [quotePage, setQuotePage] = useState(1);
  const QUOTE_PAGE_SIZE = 5;

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Try finding in user_roles first (registered client account)
      const { data: userRole } = await (supabase as any)
        .from("user_roles")
        .select("*")
        .or(`user_id.eq.${id},id.eq.${id}`)
        .maybeSingle();

      // 2. Try finding in leads
      const { data: lead } = !userRole
        ? await supabase.from("leads").select("*").eq("id", id).maybeSingle()
        : { data: null };

      // 3. Try finding in quotes
      const { data: quoteMatch } = (!userRole && !lead)
        ? await supabase.from("quotes").select("*").eq("id", id).maybeSingle()
        : { data: null };

      let clientInfo: ClientData | null = null;
      let emailToMatch = "";
      let companyToMatch = "";

      if (userRole) {
        clientInfo = {
          id: userRole.user_id || userRole.id,
          company: userRole.display_name ? `${userRole.display_name} (Client)` : "Client Account",
          contact: userRole.display_name || "Registered Client",
          email: "—",
          phone: "—",
          tier: "Strategic",
          created_at: userRole.created_at,
        };
      } else if (lead) {
        emailToMatch = lead.email || "";
        companyToMatch = lead.company || "";
        clientInfo = {
          id: lead.id,
          company: lead.company || lead.full_name || "Enterprise Client",
          contact: lead.full_name || "Primary Contact",
          email: lead.email || "—",
          phone: lead.phone || "—",
          tier: "Enterprise",
          created_at: lead.created_at,
        };
      } else if (quoteMatch) {
        emailToMatch = quoteMatch.email || "";
        companyToMatch = quoteMatch.company || "";
        clientInfo = {
          id: quoteMatch.id,
          company: quoteMatch.company || quoteMatch.full_name || "Enterprise Client",
          contact: quoteMatch.full_name || "Primary Contact",
          email: quoteMatch.email || "—",
          phone: quoteMatch.phone || "—",
          tier: "Strategic",
          created_at: quoteMatch.created_at,
        };
      } else {
        clientInfo = {
          id,
          company: "Enterprise Client",
          contact: "Representative",
          email: "—",
          phone: "—",
          tier: "SMB",
        };
      }

      setClient(clientInfo);

      // Fetch related quotations and orders by email or company
      const quoteQueries = [];
      if (emailToMatch && emailToMatch !== "—") {
        quoteQueries.push((supabase as any).from("quotes").select("*").eq("email", emailToMatch));
        quoteQueries.push((supabase as any).from("orders").select("*").eq("email", emailToMatch));
      } else if (companyToMatch) {
        quoteQueries.push((supabase as any).from("quotes").select("*").eq("company", companyToMatch));
        quoteQueries.push((supabase as any).from("orders").select("*").eq("company", companyToMatch));
      }

      if (quoteQueries.length > 0) {
        const [quotesRes, ordersRes] = await Promise.all(quoteQueries);
        setQuotes(quotesRes?.data || []);
        setOrders(ordersRes?.data || []);
      } else {
        setQuotes([]);
        setOrders([]);
      }
    } catch (err: any) {
      console.warn("[client-detail] load error:", err);
      toast.error(err?.message || "Failed to load client details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  const updateTier = (tier: "Strategic" | "Enterprise" | "SMB") => {
    if (!client) return;
    setClient({ ...client, tier });
    toast.success(isAr ? "تم تحديث تصنيف العميل" : "Client tier updated");
  };

  const totalQuotesValue = useMemo(() => {
    return quotes.reduce((acc, q) => acc + (Number(q.total) || 0), 0);
  }, [quotes]);

  const acceptedQuotesCount = useMemo(() => {
    return quotes.filter((q) => q.status === "accepted").length;
  }, [quotes]);

  const pagedQuotes = useMemo(() => {
    const start = (quotePage - 1) * QUOTE_PAGE_SIZE;
    return quotes.slice(start, start + QUOTE_PAGE_SIZE);
  }, [quotes, quotePage]);

  if (loading) {
    return (
      <Card className="p-12 text-center text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
        <span>{isAr ? "جارٍ جلب تفاصيل العميل..." : "Loading client information..."}</span>
      </Card>
    );
  }

  if (!client) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        <p>{isAr ? "العميل غير موجود" : "Client not found"}</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/dashboard/admin/clients">
            <ArrowLeft className="h-4 w-4 me-2" /> {isAr ? "العودة للعملاء" : "Back to Clients"}
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl" dir={isRtl ? "rtl" : "ltr"}>
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/admin/clients">
            <ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} />
            {isAr ? "الرجوع لدليل العملاء" : "Back to Clients Directory"}
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Select value={client.tier} onValueChange={(v) => updateTier(v as any)}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Strategic">Strategic</SelectItem>
              <SelectItem value="Enterprise">Enterprise</SelectItem>
              <SelectItem value="SMB">SMB</SelectItem>
            </SelectContent>
          </Select>

          {client.email && client.email !== "—" && (
            <Button size="sm" variant="outline" asChild>
              <a href={`mailto:${client.email}`}>
                <Mail className="h-3.5 w-3.5 me-1.5" />
                {isAr ? "إرسال بريد" : "Send Email"}
              </a>
            </Button>
          )}

          <Button size="sm" onClick={() => navigate({ to: "/dashboard/admin/quotations" })}>
            <Plus className="h-3.5 w-3.5 me-1.5" />
            {isAr ? "إنشاء عرض سعر" : "Create Quotation"}
          </Button>
        </div>
      </div>

      {/* Client Overview Card */}
      <Card className="rounded-2xl border shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="font-display text-2xl font-bold">{client.company}</CardTitle>
                <Badge className={`${TIER_TONES[client.tier] || "bg-muted"} border-0 text-xs`}>
                  {client.tier}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Client ID: #{client.id.slice(0, 8)}
              </p>
            </div>
            {client.created_at && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(client.created_at).toLocaleDateString(isAr ? "ar" : "en")}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3.5 rounded-xl border bg-card space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> {isAr ? "المسؤول / جهة الاتصال" : "Primary Contact"}
              </div>
              <div className="font-semibold text-foreground">{client.contact}</div>
            </div>

            <div className="p-3.5 rounded-xl border bg-card space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {isAr ? "البريد الإلكتروني" : "Email Address"}
              </div>
              <div className="font-semibold text-foreground truncate">
                {client.email !== "—" ? (
                  <a href={`mailto:${client.email}`} className="hover:text-accent">
                    {client.email}
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border bg-card space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {isAr ? "رقم الهاتف" : "Phone Number"}
              </div>
              <div className="font-semibold font-mono text-foreground" dir="ltr">
                {client.phone !== "—" ? (
                  <a href={`tel:${client.phone}`} className="hover:text-accent">
                    {client.phone}
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-muted/40 border">
              <div className="text-xs text-muted-foreground">{isAr ? "إجمالي العروض" : "Total Quotations"}</div>
              <div className="text-xl font-bold font-mono mt-1">{quotes.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border">
              <div className="text-xs text-muted-foreground">{isAr ? "العروض المقبولة" : "Accepted Quotes"}</div>
              <div className="text-xl font-bold font-mono mt-1 text-emerald-600">{acceptedQuotesCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border">
              <div className="text-xs text-muted-foreground">{isAr ? "قيمة خط الأنابيب" : "Pipeline Value"}</div>
              <div className="text-xl font-bold font-mono mt-1 text-accent">${totalQuotesValue.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border">
              <div className="text-xs text-muted-foreground">{isAr ? "الطلبات المكتملة" : "Placed Orders"}</div>
              <div className="text-xl font-bold font-mono mt-1">{orders.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Associated Quotations Section */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <CardTitle className="font-display text-lg">
              {isAr ? "عروض الأسعار المرتبطة" : "Associated Quotations"} ({quotes.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {isAr ? "لا توجد عروض أسعار مسجلة لهذا العميل بعد." : "No quotations recorded for this client yet."}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">{isAr ? "الرقم" : "Quote #"}</TableHead>
                      <TableHead className="text-xs font-semibold">{isAr ? "الخدمة / المنتج" : "Service / Product"}</TableHead>
                      <TableHead className="text-xs font-semibold">{isAr ? "المبلغ" : "Amount"}</TableHead>
                      <TableHead className="text-xs font-semibold">{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="text-xs font-semibold">{isAr ? "التاريخ" : "Date"}</TableHead>
                      <TableHead className="text-xs font-semibold text-end">{isAr ? "عرض" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedQuotes.map((q) => (
                      <TableRow key={q.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-bold text-accent">
                          #{q.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {q.service_name || q.items?.[0]?.name_en || "Integrated Solution"}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-bold">
                          ${(Number(q.total) || 0).toLocaleString()} {q.currency || "USD"}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${QUOTE_TONE[q.status] || "bg-muted"} capitalize text-[10px]`}>
                            {q.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {new Date(q.created_at).toLocaleDateString(isAr ? "ar" : "en")}
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                          >
                            <Link to="/dashboard/admin/quotations/$id" params={{ id: q.id }}>
                              <ExternalLink className="h-3 w-3 me-1" /> {isAr ? "عرض" : "View"}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {quotes.length > QUOTE_PAGE_SIZE && (
                <Paginator
                  page={quotePage}
                  pageCount={Math.ceil(quotes.length / QUOTE_PAGE_SIZE)}
                  total={quotes.length}
                  start={(quotePage - 1) * QUOTE_PAGE_SIZE + 1}
                  end={Math.min(quotePage * QUOTE_PAGE_SIZE, quotes.length)}
                  onPageChange={setQuotePage}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Associated Orders Section */}
      {orders.length > 0 && (
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent" />
              <CardTitle className="font-display text-lg">
                {isAr ? "الطلبات المنفذة" : "Placed Orders"} ({orders.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">{isAr ? "رقم الطلب" : "Order #"}</TableHead>
                    <TableHead className="text-xs font-semibold">{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-xs font-semibold">{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead className="text-xs font-semibold text-end">{isAr ? "عرض" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-bold text-accent">
                        #{o.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(o.created_at).toLocaleDateString(isAr ? "ar" : "en")}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                          <Link to="/dashboard/admin/orders/$id" params={{ id: o.id }}>
                            <ExternalLink className="h-3 w-3 me-1" /> {isAr ? "عرض" : "View"}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}