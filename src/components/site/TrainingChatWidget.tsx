import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTrainings } from "@/lib/trainings";
import { answerTrainingQuestion } from "@/components/admin/TrainingAssistant";

type Msg = { role: "user" | "bot"; text: string };

/** Floating training Q&A widget for the public Training page. */
export function TrainingChatWidget() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const { items } = useTrainings("training", true);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const greeting = isAr
    ? "مرحباً! اسألني عن مواعيد البرامج التدريبية، المدربين، الأماكن أو طريقة التسجيل."
    : "Hi! Ask me about training dates, trainers, locations or how to register.";

  useEffect(() => {
    if (open && messages.length === 0) setMessages([{ role: "bot", text: greeting }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const suggestions = isAr
    ? ["ما هي المواعيد القادمة؟", "من هم المدربون؟", "كيف أسجل؟"]
    : ["What are the upcoming dates?", "Who are the trainers?", "How do I register?"];

  const ask = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const reply = answerTrainingQuestion(q, items);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "bot", text: reply }]);
    setValue("");
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
  };

  return (
    <div dir={dir} className="fixed bottom-24 md:bottom-6 end-4 z-40">
      {open ? (
        <div className="w-[min(92vw,22rem)] rounded-xl border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 bg-primary text-primary-foreground px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="h-4 w-4" />
              {isAr ? "مساعد التدريب" : "Training assistant"}
            </div>
            <button onClick={() => setOpen(false)} aria-label={isAr ? "إغلاق" : "Close"} className="opacity-80 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={listRef} className="max-h-[320px] min-h-[180px] overflow-y-auto space-y-3 p-3 bg-muted/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                <div className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm max-w-[85%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 px-3 pt-3">
            {suggestions.map((s) => (
              <Button key={s} type="button" size="sm" variant="outline" className="text-[11px] h-7" onClick={() => ask(s)}>
                {s}
              </Button>
            ))}
          </div>

          <form
            className="flex gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(value);
            }}
          >
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={isAr ? "اكتب سؤالك…" : "Type your question…"}
              aria-label={isAr ? "اسأل مساعد التدريب" : "Ask the training assistant"}
            />
            <Button type="submit" size="icon" aria-label={isAr ? "إرسال" : "Send"}><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      ) : (
        <Button onClick={() => setOpen(true)} className="rounded-full shadow-lg h-12 px-5 gap-2">
          <MessageCircle className="h-4 w-4" />
          {isAr ? "اسأل عن التدريب" : "Ask about training"}
        </Button>
      )}
    </div>
  );
}
