import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Headset, X, Send, User as UserIcon, RefreshCw, Download, Sparkles, CornerDownLeft } from "lucide-react";
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

const DEFAULT_FALLBACK_QAS: QA[] = [
  {
    id: "default-1",
    question_en: "What services do you offer?",
    question_ar: "ما الخدمات التي تقدمونها؟",
    answer_en: "We provide turnkey Security Systems (CCTV & Access Control), Enterprise Network Infrastructure, Data Centers, Audio/Video Boardrooms, and Technology Consultation.",
    answer_ar: "نقدم حلولاً متكاملة لأنظمة الأمن والمراقبة (CCTV والتحكم بالدخول)، والبنية التحتية للشبكات، ومراكز البيانات، وتجهيز قاعات الاجتماعات الصوتية والمرئية، والاستشارات التقنية.",
    keywords: "services products solutions cctv network security خدمات منتجات حلول شبكات امن",
    sort_order: 1,
    active: true,
  },
  {
    id: "default-2",
    question_en: "How can I request a price quote or proposal?",
    question_ar: "كيف يمكنني طلب عرض سعر أو دراسة مشروع؟",
    answer_en: "You can request a proposal directly via our Contact page, by clicking 'Request a Quote' on any Service page, or by chatting with our engineers on WhatsApp.",
    answer_ar: "يمكنك طلب عرض سعر مباشرة عبر صفحة 'اتصل بنا'، أو بالنقر على 'طلب عرض سعر' في أي صفحة خدمة، أو بالتواصل المباشر مع مهندسينا عبر واتساب.",
    keywords: "quote pricing cost proposal proposal boq سعر تكلفة عرض اسعار مناقصة",
    sort_order: 2,
    active: true,
  },
  {
    id: "default-3",
    question_en: "What industries do you serve?",
    question_ar: "ما القطاعات التي تخدمونها؟",
    answer_en: "We serve Government, Banking & Financial Institutions, Healthcare & Hospitals, Education & Campuses, Retail & Commercial Malls, Hospitality, and Industrial Mega-Projects.",
    answer_ar: "نخدم القطاعات الحكومية، البنوك والمؤسسات المالية، المستشفيات والرعاية الصحية، التعليم والجامعات، المراكز التجارية، الفنادق والمشاريع الصناعية الكبرى.",
    keywords: "industries sectors banking healthcare government قطاعات بنوك مستشفيات حكومة مصانع",
    sort_order: 3,
    active: true,
  },
  {
    id: "default-4",
    question_en: "How do I contact technical support or open a maintenance ticket?",
    question_ar: "كيف أتواصل مع الدعم الفني أو أفتح تذكرة صيانة؟",
    answer_en: "You can open a support ticket directly from your Client Workspace under Support Tickets, or reach our 24/7 engineering helpdesk via WhatsApp or email.",
    answer_ar: "يمكنك فتح تذكرة دعم فني مباشرة من لوحة تحكم العميل عبر قسم 'تذاكر الدعم'، أو التواصل مع فريق الصيانة 24/7 عبر واتساب والبريد الإلكتروني.",
    keywords: "support maintenance ticket helpdesk sla صيانة دعم تذكرة طوارئ بلاغ",
    sort_order: 4,
    active: true,
  },
  {
    id: "default-5",
    question_en: "Where are your offices located and what regions do you cover?",
    question_ar: "أين تقع مكاتبكم وما النطاق الجغرافي لخدماتكم؟",
    answer_en: "Our headquarters are based in Cairo, Egypt, delivering enterprise infrastructure projects across Egypt, Saudi Arabia, and the wider MENA region.",
    answer_ar: "يقع مقرنا الرئيسي في القاهرة، مصر، وننفذ المشاريع الكبرى في جميع أنحاء جمهورية مصر العربية والمملكة العربية السعودية ومنطقة الشرق الأوسط.",
    keywords: "location office address cairo egypt ksa mena عنوان موقع مقر القاهرة مصر السعودية",
    sort_order: 5,
    active: true,
  },
];

export function Chatbot() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inDashboard = pathname.startsWith("/dashboard");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Autofill suggestions state
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showAutofill, setShowAutofill] = useState(true);

  const labels = useMemo(
    () =>
      isAr
        ? {
            title: "المساعد الذكي",
            subtitle: "كيف يمكننا مساعدتك؟",
            greet: "مرحبًا! اختر سؤالًا أدناه أو اكتب استفسارك للإكمال التلقائي.",
            placeholder: "اكتب سؤالك (إكمال تلقائي أثناء الكتابة)…",
            send: "إرسال",
            noMatch:
              "نعتذر بشدة، نحن حاليًا نتعامل مع حجم كبير من الطلبات. للحصول على دعم فوري، يُرجى التواصل عبر واتساب:",
            suggestions: "الأسئلة الشائعة",
            open: "افتح المحادثة",
            close: "إغلاق",
            reset: "بدء محادثة جديدة",
            whatsappCta: "تواصل عبر واتساب",
            installCta: "أو ثبّت التطبيق للوصول السريع",
            installBtn: "تثبيت التطبيق",
            autofillTitle: "اقتراحات إكمال تلقائي",
            autofillHint: "انقر للإرسال أو اضغط Tab للإكمال",
          }
        : {
            title: "AI Assistant",
            subtitle: "How can we help?",
            greet: "Hi! Pick a question below or start typing for smart autofill.",
            placeholder: "Type a message (autofill active)…",
            send: "Send",
            noMatch:
              "We sincerely apologize — we're currently handling a high volume of requests. For immediate support, please contact us on WhatsApp:",
            suggestions: "Frequently Asked Questions",
            open: "Open chat",
            close: "Close",
            reset: "Start new chat",
            whatsappCta: "Chat on WhatsApp",
            installCta: "Or install the app for faster access",
            installBtn: "Install app",
            autofillTitle: "Suggested questions (Autofill)",
            autofillHint: "Click to send or press Tab to fill",
          },
    [isAr],
  );

  const [qas, setQas] = useState<QA[]>(() => {
    try {
      const raw = localStorage.getItem("it_chatbot_qa_cache");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter((q: QA) => q.active);
      }
    } catch {}
    return DEFAULT_FALLBACK_QAS;
  });

  useEffect(() => {
    let mounted = true;
    supabase
      .from("chatbot_qa")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (mounted && data && data.length > 0) {
          setQas(data as QA[]);
        }
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

  // Autofill matches computed in real-time as user types (from 1st character)
  const autofillMatches = useMemo(() => {
    const q = input.trim();
    if (!q || q.length < 1) return [];
    const normInput = normalize(q);
    const tokens = normInput.split(" ").filter((t) => t.length > 0);

    const scored = qas
      .map((qa) => {
        const textEn = qa.question_en || "";
        const textAr = qa.question_ar || "";
        const keywords = qa.keywords || "";
        const primaryQuestion = isAr ? textAr || textEn : textEn || textAr;
        const normPrimary = normalize(primaryQuestion);
        const normEn = normalize(textEn);
        const normAr = normalize(textAr);
        const normKw = normalize(keywords);

        let score = 0;

        // 1. Direct Question Prefix match (e.g. "wh" -> "What...", "do" -> "Do you...")
        if (normPrimary.startsWith(normInput)) {
          score += 300;
        } else if (normEn.startsWith(normInput) || normAr.startsWith(normInput)) {
          score += 250;
        }
        // 2. Substring match inside question
        else if (normPrimary.includes(normInput)) {
          score += 150;
        } else if (normEn.includes(normInput) || normAr.includes(normInput)) {
          score += 120;
        }
        // 3. Match each word in the question or keywords
        else {
          let wordMatches = 0;
          for (const token of tokens) {
            const qWords = normPrimary.split(" ");
            const kwWords = normKw.split(" ");
            if (qWords.some((w) => w.startsWith(token) || token.startsWith(w))) {
              score += 60;
              wordMatches++;
            } else if (kwWords.some((kw) => kw.startsWith(token) || token.startsWith(kw))) {
              score += 40;
              wordMatches++;
            }
          }
          if (wordMatches === 0) score = 0;
        }

        return {
          qa,
          question: primaryQuestion,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return scored;
  }, [input, qas, isAr]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (autofillMatches.length === 0 || !showAutofill) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < autofillMatches.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : autofillMatches.length - 1));
    } else if (e.key === "Tab") {
      if (selectedIndex >= 0 && autofillMatches[selectedIndex]) {
        e.preventDefault();
        setInput(autofillMatches[selectedIndex].question);
        setSelectedIndex(-1);
      } else if (autofillMatches[0]) {
        e.preventDefault();
        setInput(autofillMatches[0].question);
      }
    } else if (e.key === "Escape") {
      setShowAutofill(false);
      setSelectedIndex(-1);
    }
  };

  if (inDashboard) return null;

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { from: "user", text: trimmed }]);
    setInput("");
    setShowAutofill(false);
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
    setShowAutofill(false);
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
          {/* Header */}
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

          {/* Messages Feed */}
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
                        className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-muted transition-colors text-start shadow-xs"
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form with Autofill Suggestions Popover */}
          <div className="relative border-t bg-card">
            {/* Live Autofill Suggestions Dropdown */}
            {showAutofill && autofillMatches.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 max-h-56 overflow-y-auto bg-card/95 backdrop-blur-md border-t border-x rounded-t-xl shadow-xl z-30 p-2 space-y-1 divide-y divide-border/40 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {autofillMatches.map((match, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={match.qa.id}
                      type="button"
                      onClick={() => {
                        ask(match.question);
                        setShowAutofill(false);
                      }}
                      className={`w-full px-3 py-2 text-start text-xs rounded-lg flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                          : "text-foreground hover:text-accent hover:bg-accent/10 font-medium"
                      }`}
                    >
                      <span className="truncate flex-1">{match.question}</span>
                      <CornerDownLeft className="h-3 w-3 opacity-50 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedIndex >= 0 && autofillMatches[selectedIndex]) {
                  ask(autofillMatches[selectedIndex].question);
                } else {
                  ask(input);
                }
                setShowAutofill(false);
                setSelectedIndex(-1);
              }}
              className="p-2 flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowAutofill(true);
                  setSelectedIndex(-1);
                }}
                onFocus={() => setShowAutofill(true)}
                onKeyDown={handleKeyDown}
                placeholder={labels.placeholder}
                dir={dir}
                className="flex-1 h-9"
              />
              <Button type="submit" size="icon" aria-label={labels.send} disabled={!input.trim()} className="h-9 w-9">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}