import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, LifeBuoy, Send, Loader2 } from "lucide-react";
import { useClientT } from "@/lib/client-i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/workspace/track")({
  component: TrackPage,
});

function TrackPage() {
  const { t, isRtl } = useClientT();
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;

    setSearching(true);
    setSearched(true);
    setResult(null);

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
      const cleanText = query.replace(/[%,()]/g, "").trim();

      // 1. Try search in support_tickets by ticket_no or id
      let ticketQuery = supabase.from("support_tickets").select("*");
      if (isUuid) {
        ticketQuery = ticketQuery.or(`ticket_no.ilike.%${cleanText}%,id.eq.${query}`);
      } else if (cleanText) {
        ticketQuery = ticketQuery.ilike("ticket_no", `%${cleanText}%`);
      }

      const { data: ticket } = await ticketQuery.maybeSingle();

      if (ticket) {
        setResult({ type: "ticket", data: ticket });
        return;
      }

      // 2. Try search in quotes by id (only if valid UUID)
      if (isUuid) {
        const { data: quote } = await (supabase as any)
          .from("quotes")
          .select("*")
          .eq("id", query)
          .maybeSingle();

        if (quote) {
          setResult({ type: "quote", data: quote });
          return;
        }

        // 3. Try search in leads by id
        const { data: lead } = await supabase
          .from("leads")
          .select("*")
          .eq("id", query)
          .maybeSingle();

        if (lead) {
          setResult({ type: "lead", data: lead });
          return;
        }
      }

      setResult({ type: "none" });
    } catch (err) {
      console.warn("[track] search error:", err);
      setResult({ type: "none" });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Search className="h-5 w-5 text-accent" />
            <span>{t("track", "تتبع الطلبات وعروض الأسعار")}</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {t("trackTagline", "أدخل رقم الطلب أو التذكرة أو كود المتابعة لمعرفة الحالة الحالية")}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("trackPlaceholder", "e.g. TIC-1042 or Quote UUID...")}
              className="flex-1 rounded-xl text-xs sm:text-sm"
            />
            <Button type="submit" disabled={searching} className="rounded-xl">
              {searching ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Search className="h-4 w-4 me-2" />}
              <span>{t("trackSearch", "بحث ومتابعة")}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {searched && result?.type === "none" && (
        <Card className="rounded-2xl border">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("trackNoMatch", "لم يتم العثور على سجل مطابق لرقم التتبع المدخل.")}
          </CardContent>
        </Card>
      )}

      {searched && result?.type === "ticket" && (
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-accent" />
              <span>{t("trackTypeTicket", "تذكرة دعم فني")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-sm text-foreground">{result.data.subject}</div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                  {result.data.ticket_no || result.data.id.slice(0, 8)} · {new Date(result.data.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge variant="outline" className="capitalize text-xs">
                {result.data.status}
              </Badge>
            </div>
            <div className="pt-2">
              <Button asChild size="sm" variant="outline" className="rounded-xl text-xs">
                <Link to="/dashboard/workspace/tickets/$id" params={{ id: result.data.id }}>
                  {t("viewDetails", "عرض تفاصيل ومحادثة التذكرة")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {searched && result?.type === "quote" && (
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              <span>{t("trackTypeOrder", "عرض سعر / طلب")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-sm text-foreground">{result.data.service_name || "Enterprise Quotation"}</div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                  #{result.data.id.slice(0, 8)} · {new Date(result.data.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge variant="secondary" className="capitalize text-xs">
                {result.data.status}
              </Badge>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">{t("amount", "المبلغ")}: </span>
              <span className="font-mono font-bold text-foreground">${Number(result.data.total || 0).toLocaleString()} {result.data.currency || "USD"}</span>
            </div>
            <div className="pt-2">
              <Button asChild size="sm" variant="outline" className="rounded-xl text-xs">
                <Link to="/dashboard/workspace/orders/$id" params={{ id: result.data.id }}>
                  {t("viewDetails", "عرض وتحميل عرض السعر")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}