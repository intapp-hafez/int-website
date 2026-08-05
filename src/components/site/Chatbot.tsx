import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Headset, X, Send, User as UserIcon, RefreshCw, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerInstallPrompt } from "@/components/site/InstallPrompt";

type QA = {
  id: string;
  question_en: string;
  question_ar: string;
  answer_en: string;
  answer_ar: string;
  keywords: string;
  sort_order: number;
  active: boolean;
};

type Msg = { from: "bot" | "user"; text: string; whatsapp?: boolean };

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "") // strip Arabic diacritics
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findBestAnswer(query: string, qas: QA[], lang: "en" | "ar"): QA | null {
  const q = normalize(query);
  if (!q) return null;
  const tokens = q.split(" ").filter((t) => t.length > 1);
  let best: { qa: QA; score: number } | null = null;
  for (const qa of qas) {
    const haystack = normalize(
      `${qa.question_en} ${qa.question_ar} ${qa.answer_en} ${qa.answer_ar} ${qa.keywords}`,
    );
    let score = 0;
    for (const t of tokens) if (haystack.includes(t)) score += t.length;
    const target = normalize(lang === "ar" ? qa.question_ar : qa.question_en);
    if (target && (target.includes(q) || q.includes(target))) score += 50;
    if (score > (best?.score ?? 0)) best = { qa, score };
  }
  return best && best.score >= 2 ? best.qa : null;
}

export function Chatbot() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inDashboard = pathname.startsWith("/dashboard");
  const [open, setOpen] = useState(false);
  const [qas, setQas] = useState<QA[]>([]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const labels = useMemo(
    () =>
      isAr
        ? {
            title: "المساعد الذكي",
            subtitle: "كيف يمكننا مساعدتك؟",
            greet: "مرحبًا! اختر سؤالًا أدناه أو اكتب استفسارك.",
            placeholder: "اكتب رسالتك…",
            send: "إرسال",
            noMatch:
              "نعتذر بشدة، نحن حاليًا نتعامل مع حجم كبير من الطلبات. للحصول على دعم فوري، يُرجى التواصل عبر واتساب:",
            suggestions: "اقتراحات",
            open: "افتح المحادثة",
            close: "إغلاق",
            reset: "بدء محادثة جديدة",
            whatsappCta: "تواصل عبر واتساب",
            installCta: "أو ثبّت التطبيق للوصول السريع",
            installBtn: "تثبيت التطبيق",
          }
        : {
            title: "AI Assistant",
            subtitle: "How can we help?",
            greet: "Hi! Pick a question below or type your own.",
            placeholder: "Type your message…",
            send: "Send",
            noMatch:
              "We sincerely apologize — we're currently handling a high volume of requests. For immediate support, please contact us on WhatsApp:",
            suggestions: "Suggestions",
            open: "Open chat",
            close: "Close",
            reset: "Start new chat",
            whatsappCta: "Chat on WhatsApp",
            installCta: "Or install the app for faster access",
            installBtn: "Install app",
          },
    [isAr],
  );

  useEffect(() => {
    let mounted = true;
    supabase
      .from("chatbot_qa")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (mounted && data) setQas(data as QA[]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ from: "bot", text: labels.greet }]);
    }
  }, [open, messages.length, labels.greet]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  if (inDashboard) return null;

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { from: "user", text: trimmed }]);
    setInput("");
    setTimeout(() => {
      const match = findBestAnswer(trimmed, qas, isAr ? "ar" : "en");
      if (match) {
        const reply = isAr
          ? match.answer_ar || match.answer_en
          : match.answer_en || match.answer_ar;
        setMessages((m) => [...m, { from: "bot", text: reply }]);
      } else {
        setMessages((m) => [
          ...m,
          { from: "bot", text: labels.noMatch, whatsapp: true },
        ]);
      }
    }, 350);
  };

  const resetChat = () => {
    setMessages([{ from: "bot", text: labels.greet }]);
    setInput("");
  };

  const waNumber = "201007419344";
  const waDisplay = "+20 100 741 9344";

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={labels.open}
          className="fixed end-4 lg:end-6 bottom-20 lg:bottom-24 z-40 h-12 w-12 lg:h-14 lg:w-14 rounded-full bg-accent text-accent-foreground shadow-elegant flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Headset className="h-6 w-6 lg:h-7 lg:w-7" />
        </button>
      )}
      {open && (
        <div
          dir={dir}
          className="fixed end-2 bottom-2 lg:end-6 lg:bottom-24 z-50 w-[min(88vw,340px)] lg:w-[380px] h-[min(72vh,500px)] lg:h-[560px] bg-card border rounded-2xl shadow-elegant flex flex-col overflow-hidden text-sm"
        >
          <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 bg-accent text-accent-foreground">
            <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-white/15 flex items-center justify-center">
              <Headset className="h-4 w-4 lg:h-5 lg:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] lg:text-sm font-semibold truncate">{labels.title}</div>
              <div className="text-[11px] lg:text-xs opacity-90 truncate">{labels.subtitle}</div>
            </div>
          <button
            onClick={resetChat}
            aria-label={labels.reset}
            title={labels.reset}
            className="h-8 w-8 rounded-md hover:bg-white/15 flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
            <button
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="h-8 w-8 rounded-md hover:bg-white/15 flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-background/60">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.from === "bot" && (
                  <div className="h-7 w-7 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    <Headset className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.from === "user"
                      ? "bg-accent text-accent-foreground rounded-ee-sm"
                      : "bg-muted text-foreground rounded-es-sm"
                  }`}
                >
                  {m.text}
                  {m.whatsapp && (
                    <div className="mt-2 flex flex-col gap-2">
                      <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-medium hover:opacity-90 transition-opacity self-start"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <path d="M17.6 6.32A7.85 7.85 0 0012 4a7.94 7.94 0 00-6.78 12L4 20l4.13-1.08A7.93 7.93 0 0012 19.9a7.94 7.94 0 005.6-13.58zM12 18.5a6.55 6.55 0 01-3.34-.92l-.24-.14-2.45.64.65-2.39-.16-.25A6.57 6.57 0 1118.57 12 6.6 6.6 0 0112 18.5zm3.6-4.92c-.2-.1-1.16-.57-1.34-.64s-.31-.1-.44.1-.5.63-.62.76-.23.15-.43.05a5.36 5.36 0 01-1.58-1 6 6 0 01-1.1-1.36c-.11-.2 0-.3.09-.4s.2-.23.3-.34a1.4 1.4 0 00.2-.34.37.37 0 000-.35c0-.1-.44-1.07-.6-1.46s-.32-.34-.44-.34h-.38a.74.74 0 00-.53.25 2.22 2.22 0 00-.7 1.65 3.85 3.85 0 00.81 2.05 8.85 8.85 0 003.39 3 11.4 11.4 0 001.13.42 2.71 2.71 0 001.25.08 2.05 2.05 0 001.34-.95 1.65 1.65 0 00.12-.95c-.05-.08-.18-.13-.38-.23z" />
                        </svg>
                        <span dir="ltr">{waDisplay}</span>
                      </a>
                      <div className="text-[11px] text-muted-foreground">{labels.installCta}</div>
                      <button
                        onClick={() => triggerInstallPrompt()}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity self-start"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {labels.installBtn}
                      </button>
                    </div>
                  )}
                </div>
                {m.from === "user" && (
                  <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {qas.length > 0 && messages.length <= 1 && (
              <div className="pt-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 px-1">
                  {labels.suggestions}
                </div>
                <div className="flex flex-wrap gap-2">
                  {qas.slice(0, 6).map((qa) => {
                    const q = isAr ? qa.question_ar || qa.question_en : qa.question_en || qa.question_ar;
                    return (
                      <button
                        key={qa.id}
                        onClick={() => ask(q)}
                        className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-muted transition-colors text-start"
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="border-t p-2 flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={labels.placeholder}
              dir={dir}
              className="flex-1"
            />
            <Button type="submit" size="icon" aria-label={labels.send} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}