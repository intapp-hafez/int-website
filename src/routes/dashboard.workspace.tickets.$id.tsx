import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { demoTickets } from "@/data/demo";
import { useClientT } from "@/lib/client-i18n";

export const Route = createFileRoute("/dashboard/workspace/tickets/$id")({
  component: ClientTicketDetail,
});

type Msg = { from: "you" | "support"; text: string; at: string };

function ClientTicketDetail() {
  const { id } = Route.useParams();
  const { t, isRtl } = useClientT();
  const tk = demoTickets.find((x) => x.id === id);
  const [messages, setMessages] = useState<Msg[]>(() => tk ? [
    { from: "you", text: tk.subject, at: tk.updated },
    { from: "support", text: "Thanks for reaching out — our team is reviewing this and will respond shortly.", at: tk.updated },
  ] : []);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);
  if (!tk) return <Card><CardContent className="p-6">{t("notFound")}</CardContent></Card>;

  const priorityTone: Record<string, string> = {
    low: "bg-muted text-foreground",
    medium: "bg-blue-500/10 text-blue-700",
    high: "bg-amber-100 text-amber-900",
    urgent: "bg-destructive/10 text-destructive",
  };
  const statusTone: Record<string, string> = {
    open: "bg-emerald-100 text-emerald-900",
    pending: "bg-amber-100 text-amber-900",
    resolved: "bg-blue-500/10 text-blue-700",
    closed: "bg-muted text-foreground",
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setMessages([...messages, { from: "you", text: draft, at: new Date().toISOString().slice(0, 10) }]);
    setDraft("");
  };

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard/workspace/tickets"><ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {t("back")}</Link>
      </Button>
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{tk.id}</div>
            <CardTitle className="font-display text-2xl mt-1">{tk.subject}</CardTitle>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <Badge className={`${priorityTone[tk.priority]} border-0 capitalize`}>{t(tk.priority as any)}</Badge>
            <Badge className={`${statusTone[tk.status]} border-0 capitalize`}>{t(tk.status as any)}</Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">{t("conversation")}</CardTitle></CardHeader>
        <CardContent className="space-y-3" dir={isRtl ? "rtl" : "ltr"}>
          <div ref={scrollRef} className="max-h-[420px] overflow-y-auto space-y-3 pe-1">
            {messages.map((m, i) => {
              const isYou = m.from === "you";
              return (
                <div key={i} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isYou ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"} ${isRtl ? "text-right" : "text-left"}`}>
                    <div className={`flex items-center gap-2 text-[10px] uppercase opacity-70 mb-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <span className="font-medium">{isYou ? t("you") : t("support")}</span>
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
            <Textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("message")} className="flex-1" dir={isRtl ? "rtl" : "ltr"} />
            <Button type="submit"><Send className="h-4 w-4" /></Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
