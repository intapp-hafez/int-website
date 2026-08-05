import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, FileText, LifeBuoy, Send } from "lucide-react";
import { demoRequests, demoQuotations, demoTickets } from "@/data/demo";
import { useClientT, getDemoClientCompany } from "@/lib/client-i18n";

export const Route = createFileRoute("/dashboard/workspace/track")({
  component: TrackPage,
});

function TrackPage() {
  const { t } = useClientT();
  const company = getDemoClientCompany();
  const [q, setQ] = useState("");
  const [searched, setSearched] = useState(false);

  const result = useMemo(() => {
    const id = q.trim().toUpperCase();
    if (!id) return null;
    const req = demoRequests.find((r) => r.id.toUpperCase() === id);
    if (req) return { type: "request" as const, data: req };
    const order = demoQuotations.find((o) => o.id.toUpperCase() === id && o.client === company);
    if (order) return { type: "order" as const, data: order };
    const ticket = demoTickets.find((tk) => tk.id.toUpperCase() === id && tk.client === company);
    if (ticket) return { type: "ticket" as const, data: ticket };
    return { type: "none" as const };
  }, [q, company]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Search className="h-5 w-5 text-accent" /> {t("track")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{t("trackTagline")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); setSearched(true); }} className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("trackPlaceholder")} className="flex-1" />
            <Button type="submit"><Search className="h-4 w-4 me-2" />{t("trackSearch")}</Button>
          </form>
        </CardContent>
      </Card>

      {searched && result && result.type === "none" && (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{t("trackNoMatch")}</CardContent></Card>
      )}

      {searched && result && result.type === "request" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4 text-accent" /> {t("trackTypeRequest")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{result.data.title}</div>
                <div className="text-xs text-muted-foreground">{result.data.id} · {result.data.service} · {t("updated")} {result.data.updatedAt}</div>
              </div>
              <Badge className="capitalize bg-accent/15 text-accent border-0">{t(result.data.status as any)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{result.data.description}</p>
            <div>
              <div className="text-xs text-muted-foreground mb-1">{t("progress")}: {result.data.progress}%</div>
              <Progress value={result.data.progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {searched && result && result.type === "order" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-accent" /> {t("trackTypeOrder")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{result.data.service}</div>
                <div className="text-xs text-muted-foreground">{result.data.id} · {result.data.date}</div>
              </div>
              <Badge className="capitalize bg-blue-500/10 text-blue-700 border-0">{t(result.data.status as any)}</Badge>
            </div>
            <div className="text-sm">{t("amount")}: <span className="font-semibold">${result.data.amount.toLocaleString()} {result.data.currency}</span></div>
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard/workspace/orders/$id" params={{ id: result.data.id }}>{t("viewDetails")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {searched && result && result.type === "ticket" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-accent" /> {t("trackTypeTicket")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{result.data.subject}</div>
                <div className="text-xs text-muted-foreground">{result.data.id} · {t("updated")} {result.data.updated}</div>
              </div>
              <Badge className="capitalize bg-amber-100 text-amber-900 border-0">{t(result.data.status as any)}</Badge>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard/workspace/tickets/$id" params={{ id: result.data.id }}>{t("viewDetails")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}