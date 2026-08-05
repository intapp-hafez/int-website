import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoRequests, demoQuotations, demoTickets, type ClientRequest, type RequestStatus } from "@/data/demo";
import { services } from "@/data/site";
import { CheckCircle2, Clock, Loader2, Send, FileText, LifeBuoy } from "lucide-react";
import { useClientT, getDemoClientCompany } from "@/lib/client-i18n";

export const Route = createFileRoute("/dashboard/workspace/")({
  component: ClientOverview,
});

const statusIcon: Record<RequestStatus, any> = {
  submitted: Send, in_review: Clock, in_progress: Loader2, completed: CheckCircle2,
};
const statusTone: Record<RequestStatus, string> = {
  submitted: "bg-muted text-foreground",
  in_review: "bg-amber-100 text-amber-900",
  in_progress: "bg-accent/15 text-accent",
  completed: "bg-emerald-100 text-emerald-900",
};

function ClientOverview() {
  const { t, lang, isRtl } = useClientT();
  const company = getDemoClientCompany();
  const [requests, setRequests] = useState<ClientRequest[]>(demoRequests);
  const [form, setForm] = useState({ title: "", service: services[0].title.en, description: "" });
  const [submitted, setSubmitted] = useState(false);

  const myOrders = demoQuotations.filter((q) => q.client === company);
  const myOpenTickets = demoTickets.filter((tk) => tk.client === company && (tk.status === "open" || tk.status === "pending"));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    const next: ClientRequest = {
      id: `R-${2032 + requests.length}`,
      title: form.title, service: form.service, description: form.description,
      status: "submitted", progress: 5,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setRequests([next, ...requests]);
    setForm({ title: "", service: services[0].title.en, description: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const stats = [
    { label: t("statsActive"), value: requests.filter((r) => r.status === "in_progress").length, tone: "from-accent/20 to-accent/5" },
    { label: t("statsCompleted"), value: requests.filter((r) => r.status === "completed").length, tone: "from-emerald-500/20 to-emerald-500/5" },
    { label: t("statsOrders"), value: myOrders.length, tone: "from-blue-500/20 to-blue-500/5" },
    { label: t("statsOpenTickets"), value: myOpenTickets.length, tone: "from-amber-500/20 to-amber-500/5" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.tone} border-0`}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="font-display text-3xl font-bold mt-1">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">{t("newInquiry")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">{t("title")}</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t("service")}</Label>
                <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => <SelectItem key={s.slug} value={s.title.en}>{lang === "ar" ? s.title.ar : s.title.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">{t("description")}</Label>
                <Textarea id="desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full"><Send className={`h-4 w-4 ${isRtl ? "ms-2" : "me-2"}`} /> {t("submit")}</Button>
              {submitted && <p className="text-sm text-emerald-600">{t("submittedMsg")}</p>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="font-display text-lg">{t("myRequests")}</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard/workspace/orders"><FileText className="h-4 w-4 me-1" /> {t("orders")}</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard/workspace/tickets"><LifeBuoy className="h-4 w-4 me-1" /> {t("tickets")}</Link></Button>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {requests.map((r) => {
                const Icon = statusIcon[r.status];
                return (
                  <li key={r.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{r.title}</div>
                        <div className="text-xs text-muted-foreground">{r.id} · {r.service} · {t("updated")} {r.updatedAt}</div>
                      </div>
                      <Badge className={statusTone[r.status] + " border-0"}>
                        <Icon className="h-3 w-3 me-1" /> {t(r.status as any)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{r.description}</p>
                    <Progress value={r.progress} />
                    <div className="text-xs text-muted-foreground mt-1">{r.progress}%</div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
