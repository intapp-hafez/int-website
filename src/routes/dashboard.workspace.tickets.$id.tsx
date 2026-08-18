import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2, LifeBuoy } from "lucide-react";
import { useClientT } from "@/lib/client-i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/workspace/tickets/$id")({
  component: ClientTicketDetail,
});

type MessageRow = {
  id: string;
  author_id?: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

function ClientTicketDetail() {
  const { id } = Route.useParams();
  const { t, isRtl } = useClientT();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadTicketAndMessages = async () => {
    try {
      // 1. Fetch Ticket
      const { data: tData } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (tData) setTicket(tData);

      // 2. Fetch Messages (exclude internal staff notes)
      const { data: mData } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", id)
        .eq("is_internal", false)
        .order("created_at", { ascending: true });

      if (mData) setMessages(mData as MessageRow[]);
    } catch (err) {
      console.warn("[ticket-detail] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTicketAndMessages();

    const channel = supabase
      .channel(`ticket_messages_${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_ticket_messages", filter: `ticket_id=eq.${id}` }, () => {
        void loadTicketAndMessages();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const priorityTone: Record<string, string> = {
    low: "bg-muted text-foreground",
    medium: "bg-blue-500/10 text-blue-700",
    high: "bg-amber-100 text-amber-900",
    urgent: "bg-destructive/10 text-destructive",
  };
  const statusTone: Record<string, string> = {
    open: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400",
    pending: "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400",
    resolved: "bg-blue-500/10 text-blue-700",
    closed: "bg-muted text-foreground",
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: id,
        author_id: user?.id,
        body: draft.trim(),
        is_internal: false,
      });

      if (error) throw error;

      // Update ticket updated_at
      await supabase
        .from("support_tickets")
        .update({ updated_at: new Date().toISOString(), status: "open" })
        .eq("id", id);

      setDraft("");
      void loadTicketAndMessages();
    } catch (err: any) {
      toast.error(err?.message || "Failed to post reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-xs">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
        <span>{t("Loading ticket conversation...", "جارٍ جلب تفاصيل التذكرة والمحادثة...")}</span>
      </Card>
    );
  }

  const tk = ticket || {
    id,
    ticket_no: "TIC",
    subject: "Support Request",
    priority: "medium",
    status: "open",
    created_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard/workspace/tickets">
          <ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} />
          <span>{t("back", "العودة للتذاكر")}</span>
        </Link>
      </Button>

      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-accent font-mono font-bold">
              {tk.ticket_no || `#${tk.id.slice(0, 8)}`}
            </div>
            <CardTitle className="font-display text-xl sm:text-2xl mt-1">{tk.subject}</CardTitle>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <Badge className={`${priorityTone[tk.priority] || "bg-muted"} border-0 capitalize text-xs`}>
              {t(tk.priority as any, tk.priority)}
            </Badge>
            <Badge className={`${statusTone[tk.status] || "bg-muted"} border-0 capitalize text-xs`}>
              {t(tk.status as any, tk.status)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-accent" />
            <span>{t("conversation", "المحادثة وسجل الردود")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div ref={scrollRef} className="max-h-[440px] overflow-y-auto space-y-3 pe-1">
            {messages.length === 0 ? (
              <div className="text-xs text-center text-muted-foreground p-6">
                <span>{t("No messages yet in this ticket.", "لا توجد رسائل بعد.")}</span>
              </div>
            ) : (
              messages.map((m) => {
                const isYou = m.author_id === user?.id || !m.author_id;
                return (
                  <div key={m.id} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                        isYou
                          ? "bg-accent text-accent-foreground rounded-br-xs"
                          : "bg-muted text-foreground rounded-bl-xs border"
                      } ${isRtl ? "text-right" : "text-left"}`}
                    >
                      <div className={`flex items-center gap-2 text-[10px] opacity-75 mb-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <span className="font-bold">{isYou ? t("you", "أنت") : t("support", "مهندس الدعم الفني")}</span>
                        <span aria-hidden>·</span>
                        <span className="font-mono">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={send} className="flex gap-2 pt-3 border-t">
            <Textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("message", "اكتب ردك أو استفسارك هنا...")}
              className="flex-1 rounded-xl text-xs sm:text-sm"
              dir={isRtl ? "rtl" : "ltr"}
            />
            <Button type="submit" disabled={sending || !draft.trim()} className="self-end h-10 px-4 rounded-xl">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
