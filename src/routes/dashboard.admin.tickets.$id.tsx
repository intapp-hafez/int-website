import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { demoTickets } from "@/data/demo";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/tickets/$id")({
  head: () => ({ meta: [{ title: "Ticket — Admin" }] }),
  component: TicketDetail,
});

function TicketDetail() {
  const { id } = Route.useParams();
  const { t: at, isRtl } = useAdminT();
  const t = demoTickets.find((x) => x.id === id);
  type Msg = { from: "client" | "agent"; text: string; at: string };
  const [messages, setMessages] = useState<Msg[]>(() =>
    t
      ? [
          { from: "client", text: t.subject, at: t.updated },
          { from: "agent", text: "Thanks — our team is on it and will follow up shortly.", at: t.updated },
        ]
      : [],
  );
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const quickReplies: ("qrAcknowledge" | "qrInvestigating" | "qrInfoNeeded" | "qrResolved" | "qrEscalated")[] = [
    "qrAcknowledge", "qrInvestigating", "qrInfoNeeded", "qrResolved", "qrEscalated",
  ];
  const quickLabels: Record<typeof quickReplies[number], string> = {
    qrAcknowledge: isRtl ? "استلام" : "Acknowledge",
    qrInvestigating: isRtl ? "قيد البحث" : "Investigating",
    qrInfoNeeded: isRtl ? "نحتاج معلومات" : "Need info",
    qrResolved: isRtl ? "تم الحل" : "Resolved",
    qrEscalated: isRtl ? "تم التصعيد" : "Escalated",
  };
  const insertQuick = (k: typeof quickReplies[number]) => {
    setDraft((d) => (d ? d + "\n\n" : "") + at(k));
  };
  const sendQuick = (k: typeof quickReplies[number]) => {
    setMessages((m) => [...m, { from: "agent", text: at(k), at: new Date().toISOString().slice(0, 10) }]);
  };
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);
  if (!t) return <Card><CardContent className="p-6">Ticket not found.</CardContent></Card>;
  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setMessages((m) => [...m, { from: "agent", text: draft, at: new Date().toISOString().slice(0, 10) }]);
    setDraft("");
  };
  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard/admin/tickets"><ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {at("back")}</Link>
      </Button>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display text-xl">{t.subject}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">#{t.id} · {t.client}</p>
          </div>
          <Badge variant="secondary" className="capitalize">{t.status}</Badge>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div><span className="text-muted-foreground">Priority:</span> <span className="capitalize font-medium">{t.priority}</span></div>
          <div><span className="text-muted-foreground">Last update:</span> {t.updated}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">{at("conversation")}</CardTitle></CardHeader>
        <CardContent className="space-y-3" dir={isRtl ? "rtl" : "ltr"}>
          <div ref={scrollRef} className="max-h-[420px] overflow-y-auto space-y-3 pe-1">
            {messages.map((m, i) => {
              const isAgent = m.from === "agent";
              return (
                <div key={i} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isAgent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"} ${isRtl ? "text-right" : "text-left"}`}
                  >
                    <div className={`flex items-center gap-2 text-[10px] uppercase opacity-70 mb-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <span className="font-medium">{isAgent ? at("support") : t.client}</span>
                      <span aria-hidden>·</span>
                      <span>{m.at}</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={send} className="flex gap-2 pt-2 border-t">
            <Textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={at("replyPlaceholder")} className="flex-1" dir={isRtl ? "rtl" : "ltr"} />
            <Button type="submit" aria-label={at("send")}><Send className="h-4 w-4" /></Button>
          </form>
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> {at("quickReplies")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickReplies.map((k) => (
                <div key={k} className="inline-flex rounded-md overflow-hidden border">
                  <button type="button" onClick={() => sendQuick(k)} className="px-2 py-1 text-xs hover:bg-primary hover:text-primary-foreground transition" title={at(k)}>
                    {quickLabels[k]}
                  </button>
                  <button type="button" onClick={() => insertQuick(k)} className="px-2 py-1 text-xs border-s hover:bg-muted transition" title={at("qrInsert")}>
                    {at("qrInsert")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}