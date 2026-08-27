import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Headset,
  X,
  Send,
  User as UserIcon,
  RefreshCw,
  Download,
  Sparkles,
  CornerDownLeft,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Lock,
  Clock,
  Loader2,
  MessageSquare,
} from "lucide-react";
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

type Msg = {
  from: "bot" | "user";
  text: string;
  whatsapp?: boolean;
  created_at?: string;
};

type ChatMode = "select" | "assistant" | "live_chat";
type LiveMessage = {
  id: string;
  sender_type: "visitor" | "agent" | "system";
  sender_name: string;
  message: string;
  created_at: string;
};

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

function formatChatDateTime(dateVal?: string | Date, lang: string = "en"): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return "";

  const isAr = lang === "ar";
  const locale = isAr ? "ar-EG" : "en-US";

  const timeStr = d.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const now = new Date();
  const isToday = now.toDateString() === d.toDateString();

  if (isToday) {
    return timeStr;
  }

  const dateStr = d.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });

  return `${dateStr}, ${timeStr}`;
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
  const [chatMode, setChatMode] = useState<ChatMode>("select");

  // AI Assistant state
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveScrollRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showAutofill, setShowAutofill] = useState(true);

  // Live Chat Form & Session state
  const [liveForm, setLiveForm] = useState({
    name: "",
    phone: "",
    email: "",
    category: "support",
    message: "",
  });
  const [liveSubmitting, setLiveSubmitting] = useState(false);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const [liveSessionStatus, setLiveSessionStatus] = useState<"active" | "closed">("active");
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [liveReplyInput, setLiveReplyInput] = useState("");
  const [liveSending, setLiveSending] = useState(false);
  const [liveError, setLiveError] = useState("");

  const labels = useMemo(
    () =>
      isAr
        ? {
            mainTitle: "مركز المساعدة والدعم",
            mainSubtitle: "اختر طريقة التواصل المناسبة",
            title: "المساعد الذكي (INT Assistant)",
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
            backToMenu: "العودة للخيارات",
            whatsappCta: "تواصل عبر واتساب",
            installCta: "أو ثبّت التطبيق للوصول السريع",
            installBtn: "تثبيت التطبيق",
            autofillTitle: "اقتراحات إكمال تلقائي",
            autofillHint: "انقر للإرسال أو اضغط Tab للإكمال",
            // Selection screen
            welcomeGreeting: "أهلاً بك في إنتجريتد تكنيكس! كيف تفضل الحصول على المساعدة اليوم؟",
            assistantTitle: "المساعد الذكي",
            assistantTag: "INT Assistant",
            assistantDesc: "إجابات فورية ذكية على كافة استفساراتك والخدمات والأسئلة الشائعة.",
            assistantBadge: "إجابة فورية",
            liveChatTitle: "الدعم المباشر",
            liveChatTag: "Live Chat",
            liveChatDesc: "تواصل مع فريق المهندسين والدعم الفني والمبيعات مباشرة.",
            liveChatBadge: "متصل الآن",
            // Live chat form
            liveFormHeader: "بدء محادثة مع الدعم المباشر",
            liveFormDesc: "يرجى ملء البيانات أدناه لربطك مع المهندس أو الاستشاري المختص:",
            nameLabel: "الاسم بالكامل",
            namePlaceholder: "اكتب اسمك الكريم",
            phoneLabel: "رقم الهاتف / واتساب",
            phonePlaceholder: "0100 000 0000",
            emailLabel: "البريد الإلكتروني",
            emailPlaceholder: "name@company.com",
            categoryLabel: "نوع الاستفسار",
            messageLabel: "تفاصيل الاستفسار (اختياري)",
            messagePlaceholder: "اكتب نبذة عن طلبك أو مشروعك...",
            submitLiveBtn: "بدء المحادثة المباشرة",
            submittingLiveBtn: "جاري ربط الجلسة...",
            thanksTitle: "شكرًا لك!",
            thanksMessage:
              "تم استلام بياناتك بنجاح. أنت الآن متصل مع فريق الدعم الفني والمبيعات، يُرجى كتابة استفسارك:",
            liveConnecting: "أنت الآن متصل مباشرة مع فريق الدعم الهندسي",
            liveReplyPlaceholder: "اكتب رسالتك لفريق الدعم هنا...",
            directWhatsapp: "تواصل على واتساب",
            supportAgent: "مهندس الدعم",
            chatClosedBanner: "تم إغلاق المحادثة من قبل فريق الدعم",
            chatClosedMsg: "تم إنهاء وإغلاق جلسة المحادثة هذه. شكرًا لتواصلك معنا!",
            chatClosedSub: "تم إغلاق المحادثة. لا يمكن إرسال رسائل جديدة في هذه الجلسة.",
            startNewChatBtn: "بدء محادثة جديدة",
            categories: {
              support: "الدعم الفني والصيانة",
              sales: "المبيعات وطلب عروض الأسعار (BOQ)",
              projects: "المشاريع وتكامل الأنظمة",
              general: "استفسار عام",
            },
          }
        : {
            mainTitle: "Help & Support Center",
            mainSubtitle: "Select your preferred assistance",
            title: "INT Assistant",
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
            backToMenu: "Back to options",
            whatsappCta: "Chat on WhatsApp",
            installCta: "Or install the app for faster access",
            installBtn: "Install app",
            autofillTitle: "Suggested questions (Autofill)",
            autofillHint: "Click to send or press Tab to fill",
            // Selection screen
            welcomeGreeting: "Welcome to Integrated Technics! How would you like to get assistance today?",
            assistantTitle: "INT Assistant",
            assistantTag: "AI & FAQs",
            assistantDesc: "Instant smart answers to services, products, and frequently asked questions.",
            assistantBadge: "Instant AI",
            liveChatTitle: "Live Chat",
            liveChatTag: "Support Team",
            liveChatDesc: "Connect directly with our engineering & customer support team.",
            liveChatBadge: "Online",
            // Live chat form
            liveFormHeader: "Start Live Support Chat",
            liveFormDesc: "Please provide your contact details to route you to the right engineer:",
            nameLabel: "Full Name",
            namePlaceholder: "Your full name",
            phoneLabel: "Phone / WhatsApp",
            phonePlaceholder: "+20 100 000 0000",
            emailLabel: "Email Address",
            emailPlaceholder: "name@company.com",
            categoryLabel: "Category of Enquiry",
            messageLabel: "Message (Optional)",
            messagePlaceholder: "Briefly describe your enquiry or project...",
            submitLiveBtn: "Start Live Chat",
            submittingLiveBtn: "Connecting you...",
            thanksTitle: "Connected!",
            thanksMessage:
              "Your details have been received. You are connected to our support engineers. Feel free to type below:",
            liveConnecting: "Connected to INT Engineering & Sales Support",
            liveReplyPlaceholder: "Type your message to support team...",
            directWhatsapp: "Chat on WhatsApp",
            supportAgent: "Support Engineer",
            chatClosedBanner: "Conversation closed by support team",
            chatClosedMsg: "This chat session has been closed by the support team. Thank you for contacting us!",
            chatClosedSub: "This session is closed. No further messages can be sent.",
            startNewChatBtn: "Start New Chat",
            categories: {
              support: "Technical Support & Helpdesk",
              sales: "Sales & Price Quotations (BOQ)",
              projects: "Projects & System Integration",
              general: "General Enquiry",
            },
          },
    [isAr],
  );

  const [qas, setQas] = useState<QA[]>(DEFAULT_FALLBACK_QAS);

  // Load FAQs from Supabase
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("chatbot_qas")
          .select("*")
          .eq("active", true)
          .order("sort_order", { ascending: true });
        if (!error && data && data.length > 0 && active) {
          setQas(data as QA[]);
        }
      } catch {
        // Fall back to default QAs silently
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Check existing live chat session in localStorage
  useEffect(() => {
    const savedSessionId = localStorage.getItem("it_live_chat_session_id");
    if (savedSessionId) {
      setLiveSessionId(savedSessionId);
      // Fetch existing session status and messages
      (async () => {
        try {
          const { data: sessionData } = await (supabase as any)
            .from("live_chat_sessions")
            .select("status")
            .eq("id", savedSessionId)
            .single();

          if (sessionData?.status === "closed") {
            setLiveSessionStatus("closed");
          } else {
            setLiveSessionStatus("active");
          }

          const { data } = await (supabase as any)
            .from("live_chat_messages")
            .select("*")
            .eq("session_id", savedSessionId)
            .order("created_at", { ascending: true });
          if (data && data.length > 0) {
            setLiveMessages(data);
          }
        } catch {}
      })();
    }
  }, []);

  // Realtime subscription for visitor's live chat messages and session status
  useEffect(() => {
    if (!liveSessionId) return;

    const channel = supabase
      .channel(`visitor-chat-${liveSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
          filter: `session_id=eq.${liveSessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as LiveMessage;
          setLiveMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_chat_sessions",
          filter: `id=eq.${liveSessionId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.status === "closed") {
            setLiveSessionStatus("closed");
          } else if (updated.status === "active") {
            setLiveSessionStatus("active");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveSessionId]);

  // Autofill Suggestions
  const autofillMatches = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length < 1) return [];
    const q = normalize(trimmed);
    const tokens = q.split(" ").filter((t) => t.length > 0);

    const matches: { qa: QA; question: string; score: number }[] = [];
    for (const qa of qas) {
      const primaryQ = isAr ? qa.question_ar || qa.question_en : qa.question_en || qa.question_ar;
      const altQ = isAr ? qa.question_en : qa.question_ar;
      const normPrimary = normalize(primaryQ);
      const normAlt = normalize(altQ);
      const normKeywords = normalize(qa.keywords || "");

      let score = 0;
      if (normPrimary.startsWith(q)) score += 100;
      else if (normPrimary.includes(q)) score += 60;
      else if (normAlt.includes(q)) score += 40;
      else if (normKeywords.includes(q)) score += 20;

      for (const t of tokens) {
        if (normPrimary.includes(t)) score += 10;
        if (normKeywords.includes(t)) score += 5;
      }

      if (score > 0) {
        matches.push({ qa, question: primaryQ, score });
      }
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [input, qas, isAr]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAutofill || autofillMatches.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < autofillMatches.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : autofillMatches.length - 1));
    } else if (e.key === "Tab") {
      if (autofillMatches.length > 0) {
        e.preventDefault();
        const target = selectedIndex >= 0 ? autofillMatches[selectedIndex] : autofillMatches[0];
        setInput(target.question);
        setSelectedIndex(-1);
      }
    } else if (e.key === "Escape") {
      setShowAutofill(false);
      setSelectedIndex(-1);
    }
  };

  const ask = (text: string) => {
    if (!text.trim()) return;
    const userMsg = text.trim();
    const now = new Date().toISOString();
    setMessages((prev) => [...prev, { from: "user", text: userMsg, created_at: now }]);
    setInput("");
    setShowAutofill(false);
    setSelectedIndex(-1);

    setTimeout(() => {
      const match = findBestAnswer(userMsg, qas, lang);
      const resTime = new Date().toISOString();
      if (match) {
        const answer = isAr ? match.answer_ar || match.answer_en : match.answer_en || match.answer_ar;
        setMessages((prev) => [...prev, { from: "bot", text: answer, created_at: resTime }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: labels.noMatch,
            whatsapp: true,
            created_at: resTime,
          },
        ]);
      }
    }, 350);
  };

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ from: "bot", text: labels.greet, created_at: new Date().toISOString() }]);
    }
  }, [open, labels.greet, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    liveScrollRef.current?.scrollTo({
      top: liveScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [liveMessages]);

  const resetChat = () => {
    setMessages([{ from: "bot", text: labels.greet, created_at: new Date().toISOString() }]);
    setInput("");
    setShowAutofill(false);
  };

  // Start fresh chat session
  const handleStartNewChat = () => {
    localStorage.removeItem("it_live_chat_session_id");
    setLiveSessionId(null);
    setLiveSessionStatus("active");
    setLiveMessages([]);
    setLiveForm({
      name: "",
      phone: "",
      email: "",
      category: "support",
      message: "",
    });
    setChatMode("select");
  };

  // Submit Live Chat Initial Form
  const handleLiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLiveError("");

    if (!liveForm.name.trim()) {
      setLiveError(isAr ? "يرجى كتابة الاسم" : "Please enter your name");
      return;
    }
    if (!liveForm.phone.trim() && !liveForm.email.trim()) {
      setLiveError(isAr ? "يرجى كتابة رقم الهاتف أو البريد الإلكتروني" : "Please enter a phone number or email");
      return;
    }

    setLiveSubmitting(true);
    try {
      const token = `live_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // 1. Create Live Chat Session in Supabase
      const { data: sessionData, error: sessionErr } = await (supabase as any)
        .from("live_chat_sessions")
        .insert({
          session_token: token,
          visitor_name: liveForm.name.trim().slice(0, 200),
          visitor_phone: liveForm.phone.trim().slice(0, 50) || null,
          visitor_email: liveForm.email.trim().slice(0, 255) || null,
          category: liveForm.category,
          status: "active",
          last_message: liveForm.message.trim().slice(0, 500) || `Started chat (${liveForm.category})`,
          lang,
        })
        .select()
        .single();

      const newSessionId = sessionData?.id || token;
      setLiveSessionId(newSessionId);
      setLiveSessionStatus("active");
      localStorage.setItem("it_live_chat_session_id", newSessionId);

      // 2. Insert initial visitor message if typed
      if (liveForm.message.trim() && sessionData?.id) {
        await (supabase as any).from("live_chat_messages").insert({
          session_id: sessionData.id,
          sender_type: "visitor",
          sender_name: liveForm.name.trim(),
          message: liveForm.message.trim(),
        });
      }

      // 3. Save to leads table
      await (supabase as any).from("leads").insert({
        source: "live_chat",
        full_name: liveForm.name.trim().slice(0, 200),
        phone: liveForm.phone.trim().slice(0, 50),
        email: liveForm.email.trim().slice(0, 255),
        category: liveForm.category,
        message: liveForm.message.trim().slice(0, 2000),
        lang,
        status: "new",
        priority: "high",
      });

      // 4. Notify admins
      await (supabase as any).from("admin_notifications").insert({
        type: "lead",
        title: isAr ? `طلب محادثة مباشرة: ${liveForm.name}` : `Live Chat Request: ${liveForm.name}`,
        message: `${liveForm.name} started live chat (${liveForm.category}) - Phone: ${liveForm.phone || "N/A"}`,
        link: "/dashboard/admin/chat",
      });

      // Initial welcome message from system
      setLiveMessages([
        {
          id: "welcome-1",
          sender_type: "system",
          sender_name: "INT System",
          message: labels.thanksMessage,
          created_at: new Date().toISOString(),
        },
        ...(liveForm.message.trim()
          ? [
              {
                id: "initial-1",
                sender_type: "visitor" as const,
                sender_name: liveForm.name.trim(),
                message: liveForm.message.trim(),
                created_at: new Date().toISOString(),
              },
            ]
          : []),
      ]);
    } catch (err: any) {
      console.error("Live chat submission error:", err);
      const fallbackId = `temp_${Date.now()}`;
      setLiveSessionId(fallbackId);
      setLiveSessionStatus("active");
    } finally {
      setLiveSubmitting(false);
    }
  };

  // Send visitor message in ongoing live chat
  const handleSendLiveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (liveSessionStatus === "closed") return;

    const text = liveReplyInput.trim();
    if (!text || !liveSessionId || liveSending) return;

    setLiveSending(true);
    try {
      const visitorName = liveForm.name.trim() || "Visitor";
      const { data, error } = await (supabase as any)
        .from("live_chat_messages")
        .insert({
          session_id: liveSessionId,
          sender_type: "visitor",
          sender_name: visitorName,
          message: text,
        })
        .select()
        .single();

      if (!error && data) {
        setLiveMessages((prev) => [...prev, data]);
      } else {
        // Local echo fallback
        setLiveMessages((prev) => [
          ...prev,
          {
            id: `temp_${Date.now()}`,
            sender_type: "visitor",
            sender_name: visitorName,
            message: text,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      setLiveReplyInput("");
    } catch (err) {
      console.error("Error sending live message:", err);
    } finally {
      setLiveSending(false);
    }
  };

  const waNumber = "201007419344";
  const waDisplay = "+20 100 741 9344";
  const waLiveMsg = encodeURIComponent(
    isAr
      ? `مرحبًا إنتجريتد تكنيكس، أنا ${liveForm.name || "عميل"} وأرغب في المتابعة بخصوص: ${labels.categories[liveForm.category as keyof typeof labels.categories] || "استفسار"}.`
      : `Hello Integrated Technics, I am ${liveForm.name || "a client"} and would like to follow up regarding: ${labels.categories[liveForm.category as keyof typeof labels.categories] || "enquiry"}.`
  );

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
          className="fixed end-2 bottom-2 lg:end-6 lg:bottom-24 z-50 w-[min(92vw,360px)] lg:w-[390px] h-[min(80vh,540px)] lg:h-[580px] bg-card border rounded-2xl shadow-elegant flex flex-col overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 lg:px-4 py-2.5 lg:py-3 bg-accent text-accent-foreground shrink-0">
            {chatMode !== "select" && (
              <button
                onClick={() => setChatMode("select")}
                aria-label={labels.backToMenu}
                title={labels.backToMenu}
                className="h-8 w-8 rounded-md hover:bg-white/15 flex items-center justify-center transition-colors"
              >
                {isAr ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
            )}
            <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              {chatMode === "live_chat" ? <Users className="h-4 w-4 lg:h-5 lg:w-5" /> : <Headset className="h-4 w-4 lg:h-5 lg:w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] lg:text-sm font-semibold truncate">
                {chatMode === "select"
                  ? labels.mainTitle
                  : chatMode === "live_chat"
                  ? labels.liveChatTitle
                  : labels.title}
              </div>
              <div className="text-[11px] lg:text-xs opacity-90 truncate">
                {chatMode === "select"
                  ? labels.mainSubtitle
                  : chatMode === "live_chat"
                  ? liveSessionStatus === "closed"
                    ? labels.chatClosedBanner
                    : labels.liveChatBadge
                  : labels.subtitle}
              </div>
            </div>
            {chatMode === "assistant" && (
              <button
                onClick={resetChat}
                aria-label={labels.reset}
                title={labels.reset}
                className="h-8 w-8 rounded-md hover:bg-white/15 flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="h-8 w-8 rounded-md hover:bg-white/15 flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* VIEW 1: Initial Selection Screen */}
          {chatMode === "select" && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between bg-gradient-to-b from-background via-background to-muted/30">
              <div className="space-y-4">
                {/* Greeting Banner */}
                <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/20 text-foreground flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                    {labels.welcomeGreeting}
                  </p>
                </div>

                {/* Option Cards */}
                <div className="space-y-3 pt-1">
                  {/* Option A: INT Assistant */}
                  <button
                    onClick={() => {
                      setChatMode("assistant");
                      if (messages.length === 0) {
                        setMessages([{ from: "bot", text: labels.greet, created_at: new Date().toISOString() }]);
                      }
                    }}
                    className="w-full text-start p-4 rounded-2xl border-2 border-border/80 hover:border-accent bg-card hover:bg-accent/5 transition-all shadow-xs hover:shadow-md group flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                        <Headset className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">
                            {labels.assistantTitle}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/15 text-accent">
                            {labels.assistantBadge}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {labels.assistantDesc}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all">
                      {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                  </button>

                  {/* Option B: Live Chat */}
                  <button
                    onClick={() => setChatMode("live_chat")}
                    className="w-full text-start p-4 rounded-2xl border-2 border-border/80 hover:border-emerald-500 bg-card hover:bg-emerald-500/5 transition-all shadow-xs hover:shadow-md group flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {labels.liveChatTitle}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {labels.liveChatBadge}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {labels.liveChatDesc}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all">
                      {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Direct WhatsApp Quick Link */}
              <div className="pt-3 border-t text-center space-y-1.5">
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/20 text-xs font-semibold transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M17.6 6.32A7.85 7.85 0 0012 4a7.94 7.94 0 00-6.78 12L4 20l4.13-1.08A7.93 7.93 0 0012 19.9a7.94 7.94 0 005.6-13.58zM12 18.5a6.55 6.55 0 01-3.34-.92l-.24-.14-2.45.64.65-2.39-.16-.25A6.57 6.57 0 1118.57 12 6.6 6.6 0 0112 18.5zm3.6-4.92c-.2-.1-1.16-.57-1.34-.64s-.31-.1-.44.1-.5.63-.62.76-.23.15-.43.05a5.36 5.36 0 01-1.58-1 6 6 0 01-1.1-1.36c-.11-.2 0-.3.09-.4s.2-.23.3-.34a1.4 1.4 0 00.2-.34.37.37 0 000-.35c0-.1-.44-1.07-.6-1.46s-.32-.34-.44-.34h-.38a.74.74 0 00-.53.25 2.22 2.22 0 00-.7 1.65 3.85 3.85 0 00.81 2.05 8.85 8.85 0 003.39 3 11.4 11.4 0 001.13.42 2.71 2.71 0 001.25.08 2.05 2.05 0 001.34-.95 1.65 1.65 0 00.12-.95c-.05-.08-.18-.13-.38-.23z" />
                  </svg>
                  <span>{labels.whatsappCta}</span>
                  <span dir="ltr" className="opacity-75 font-normal">({waDisplay})</span>
                </a>
              </div>
            </div>
          )}

          {/* VIEW 2: INT Assistant (QA / Autofill Chat) */}
          {chatMode === "assistant" && (
            <>
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
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                        m.from === "user"
                          ? "bg-accent text-accent-foreground rounded-ee-sm font-medium"
                          : "bg-muted text-foreground rounded-es-sm"
                      }`}
                    >
                      <div>{m.text}</div>

                      {/* Message Date & Time */}
                      <div
                        className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                          m.from === "user" ? "text-accent-foreground/75" : "text-muted-foreground/75"
                        }`}
                      >
                        <Clock className="h-2.5 w-2.5 opacity-60" />
                        <span>{formatChatDateTime(m.created_at || new Date(), lang)}</span>
                      </div>

                      {m.whatsapp && (
                        <div className="mt-2.5 flex flex-col gap-2">
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
                            className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-muted transition-colors text-start shadow-xs hover:border-accent"
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
            </>
          )}

          {/* VIEW 3: Live Chat Intake Form & Realtime Conversation Thread */}
          {chatMode === "live_chat" && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
              {!liveSessionId ? (
                /* Registration / Intake Screen */
                <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
                  <form onSubmit={handleLiveSubmit} className="space-y-3.5">
                    <div>
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-accent" />
                        <span>{labels.liveFormHeader}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {labels.liveFormDesc}
                      </p>
                    </div>

                    {liveError && (
                      <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                        {liveError}
                      </div>
                    )}

                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                        <span>{labels.nameLabel}</span>
                        <span className="text-destructive">*</span>
                      </label>
                      <Input
                        required
                        value={liveForm.name}
                        onChange={(e) => setLiveForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder={labels.namePlaceholder}
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                        <span>{labels.phoneLabel}</span>
                        <span className="text-destructive">*</span>
                      </label>
                      <Input
                        required
                        type="tel"
                        value={liveForm.phone}
                        onChange={(e) => setLiveForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder={labels.phonePlaceholder}
                        dir="ltr"
                        className="h-8 text-xs text-start"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                        <span>{labels.emailLabel}</span>
                      </label>
                      <Input
                        type="email"
                        value={liveForm.email}
                        onChange={(e) => setLiveForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder={labels.emailPlaceholder}
                        dir="ltr"
                        className="h-8 text-xs text-start"
                      />
                    </div>

                    {/* Category of Enquiry */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">
                        {labels.categoryLabel}
                      </label>
                      <select
                        value={liveForm.category}
                        onChange={(e) => setLiveForm((f) => ({ ...f, category: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="support">{labels.categories.support}</option>
                        <option value="sales">{labels.categories.sales}</option>
                        <option value="projects">{labels.categories.projects}</option>
                        <option value="general">{labels.categories.general}</option>
                      </select>
                    </div>

                    {/* Optional Message */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        {labels.messageLabel}
                      </label>
                      <Input
                        value={liveForm.message}
                        onChange={(e) => setLiveForm((f) => ({ ...f, message: e.target.value }))}
                        placeholder={labels.messagePlaceholder}
                        className="h-8 text-xs"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={liveSubmitting}
                      className="w-full h-9 text-xs font-semibold gap-2 mt-2 shadow-sm"
                    >
                      {liveSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{labels.submittingLiveBtn}</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-3.5 w-3.5" />
                          <span>{labels.submitLiveBtn}</span>
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Direct WhatsApp Option */}
                  <div className="pt-3 border-t text-center">
                    <a
                      href={`https://wa.me/${waNumber}?text=${waLiveMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/20 text-xs font-semibold transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M17.6 6.32A7.85 7.85 0 0012 4a7.94 7.94 0 00-6.78 12L4 20l4.13-1.08A7.93 7.93 0 0012 19.9a7.94 7.94 0 005.6-13.58zM12 18.5a6.55 6.55 0 01-3.34-.92l-.24-.14-2.45.64.65-2.39-.16-.25A6.57 6.57 0 1118.57 12 6.6 6.6 0 0112 18.5zm3.6-4.92c-.2-.1-1.16-.57-1.34-.64s-.31-.1-.44.1-.5.63-.62.76-.23.15-.43.05a5.36 5.36 0 01-1.58-1 6 6 0 01-1.1-1.36c-.11-.2 0-.3.09-.4s.2-.23.3-.34a1.4 1.4 0 00.2-.34.37.37 0 000-.35c0-.1-.44-1.07-.6-1.46s-.32-.34-.44-.34h-.38a.74.74 0 00-.53.25 2.22 2.22 0 00-.7 1.65 3.85 3.85 0 00.81 2.05 8.85 8.85 0 003.39 3 11.4 11.4 0 001.13.42 2.71 2.71 0 001.25.08 2.05 2.05 0 001.34-.95 1.65 1.65 0 00.12-.95c-.05-.08-.18-.13-.38-.23z" />
                      </svg>
                      <span>{labels.directWhatsapp}</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* Live Realtime Conversation Thread */
                <>
                  {/* Status Banner */}
                  {liveSessionStatus === "closed" ? (
                    <div className="px-3 py-2 bg-muted/80 border-b text-muted-foreground text-[11px] font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-destructive font-semibold">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>{labels.chatClosedBanner}</span>
                      </span>
                      <button
                        onClick={handleStartNewChat}
                        className="text-[10px] font-bold text-accent underline hover:opacity-80"
                      >
                        {labels.startNewChatBtn}
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{labels.liveConnecting}</span>
                      </span>
                      <a
                        href={`https://wa.me/${waNumber}?text=${waLiveMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold underline hover:opacity-80"
                      >
                        WhatsApp
                      </a>
                    </div>
                  )}

                  {/* Messages Feed */}
                  <div ref={liveScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-background/50">
                    {liveMessages.map((msg) => {
                      const isAgent = msg.sender_type === "agent";
                      const isSystem = msg.sender_type === "system";

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-foreground text-xs text-center space-y-1">
                            <div className="flex items-center justify-center gap-1 font-bold text-accent">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{labels.thanksTitle}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {msg.message}
                            </p>
                            <div className="text-[9px] text-muted-foreground/70 flex items-center justify-center gap-1 mt-1">
                              <Clock className="h-2.5 w-2.5 opacity-50" />
                              <span>{formatChatDateTime(msg.created_at, lang)}</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2 ${isAgent ? "justify-start" : "justify-end"}`}
                        >
                          {isAgent && (
                            <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Headset className="h-3.5 w-3.5" />
                            </div>
                          )}

                          <div
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-xs ${
                              isAgent
                                ? "bg-card border text-foreground rounded-es-sm"
                                : "bg-accent text-accent-foreground rounded-ee-sm font-medium"
                            }`}
                          >
                            {isAgent && (
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                                {labels.supportAgent}
                              </div>
                            )}
                            <div>{msg.message}</div>

                            {/* Timestamp for Live Messages */}
                            <div
                              className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                                isAgent ? "text-muted-foreground/70" : "text-accent-foreground/75"
                              }`}
                            >
                              <Clock className="h-2.5 w-2.5 opacity-60" />
                              <span>{formatChatDateTime(msg.created_at, lang)}</span>
                            </div>
                          </div>

                          {!isAgent && (
                            <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                              <UserIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Notice if chat was closed */}
                    {liveSessionStatus === "closed" && (
                      <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-1 my-2">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-destructive">
                          <Lock className="h-3.5 w-3.5" />
                          <span>{labels.chatClosedBanner}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {labels.chatClosedMsg}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Area: Either Locked notice or Reply Input */}
                  {liveSessionStatus === "closed" ? (
                    <div className="p-2.5 border-t bg-muted/40 text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                        <Lock className="h-3 w-3 text-destructive" />
                        <span>{labels.chatClosedSub}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleStartNewChat}
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs font-semibold gap-1.5 shadow-2xs"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>{labels.startNewChatBtn}</span>
                        </Button>
                        <a
                          href={`https://wa.me/${waNumber}?text=${waLiveMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                            <path d="M17.6 6.32A7.85 7.85 0 0012 4a7.94 7.94 0 00-6.78 12L4 20l4.13-1.08A7.93 7.93 0 0012 19.9a7.94 7.94 0 005.6-13.58zM12 18.5a6.55 6.55 0 01-3.34-.92l-.24-.14-2.45.64.65-2.39-.16-.25A6.57 6.57 0 1118.57 12 6.6 6.6 0 0112 18.5zm3.6-4.92c-.2-.1-1.16-.57-1.34-.64s-.31-.1-.44.1-.5.63-.62.76-.23.15-.43.05a5.36 5.36 0 01-1.58-1 6 6 0 01-1.1-1.36c-.11-.2 0-.3.09-.4s.2-.23.3-.34a1.4 1.4 0 00.2-.34.37.37 0 000-.35c0-.1-.44-1.07-.6-1.46s-.32-.34-.44-.34h-.38a.74.74 0 00-.53.25 2.22 2.22 0 00-.7 1.65 3.85 3.85 0 00.81 2.05 8.85 8.85 0 003.39 3 11.4 11.4 0 001.13.42 2.71 2.71 0 001.25.08 2.05 2.05 0 001.34-.95 1.65 1.65 0 00.12-.95c-.05-.08-.18-.13-.38-.23z" />
                          </svg>
                          <span>{labels.directWhatsapp}</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSendLiveMessage} className="p-2 border-t bg-card flex items-center gap-2">
                      <Input
                        value={liveReplyInput}
                        onChange={(e) => setLiveReplyInput(e.target.value)}
                        placeholder={labels.liveReplyPlaceholder}
                        className="flex-1 h-9 text-xs"
                      />
                      <Button
                        type="submit"
                        disabled={!liveReplyInput.trim() || liveSending}
                        size="icon"
                        className="h-9 w-9 shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}