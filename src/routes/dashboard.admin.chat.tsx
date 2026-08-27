import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  MessageSquare,
  Search,
  Send,
  User as UserIcon,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  Trash2,
  Sparkles,
  Paperclip,
  Smile,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  CheckCheck,
  Headset,
  Tag,
  FileText,
  AlertCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCanAccess } from "@/lib/permissions-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/chat")({
  component: AdminChatPage,
});

export type LiveChatSession = {
  id: string;
  session_token: string;
  visitor_name: string;
  visitor_phone: string | null;
  visitor_email: string | null;
  category: "support" | "sales" | "projects" | "general";
  status: "active" | "waiting" | "closed" | "archived";
  unread_admin: number;
  unread_visitor: number;
  last_message: string | null;
  last_message_at: string;
  assigned_to: string | null;
  assigned_name: string | null;
  visitor_ip?: string | null;
  user_agent?: string | null;
  lang?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type LiveChatMessage = {
  id: string;
  session_id: string;
  sender_type: "visitor" | "agent" | "system" | "bot";
  sender_name: string;
  sender_id?: string | null;
  message: string;
  attachments?: any[];
  is_read: boolean;
  created_at: string;
};

const CANNED_RESPONSES = [
  {
    en: "Hello! Thank you for reaching out to Integrated Technics. How can our engineering team assist you today?",
    ar: "أهلاً بك في إنتجريتد تكنيكس! كيف يمكن لفريقنا الهندسي مساعدتك اليوم؟",
  },
  {
    en: "We have received your enquiry and our technical specialist is reviewing your requirements now.",
    ar: "تم استلام استفسارك، ويقوم أحد مهندسينا المختصين بمراجعة متطلباتك الآن.",
  },
  {
    en: "Could you please share your project location and timeline so we can provide an accurate proposal?",
    ar: "هل يمكنك تزويدنا بموقع المشروع والجدول الزمني لتقديم دراسة فنية وعرض سعر دقيق؟",
  },
  {
    en: "We can also connect with you directly via WhatsApp or schedule an on-site technical survey.",
    ar: "يمكننا أيضًا التواصل معك مباشرة عبر واتساب أو ترتيب زيارة ومعاينة ميدانية للمشروع.",
  },
  {
    en: "Thank you for contacting us! We will follow up with your quotation shortly.",
    ar: "شكرًا لتواصلك معنا! سنوافيك بعرض السعر والمواصفات الفنية في أقرب وقت.",
  },
];

function formatMessageDateTime(dateStr: string, lang: "ar" | "en" = "en"): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const isAr = lang === "ar";
  const locale = isAr ? "ar-EG" : "en-US";

  const datePart = d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const timePart = d.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} • ${timePart}`;
}

export function AdminChatPage() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const { user } = useAuth();
  const perms = useCanAccess("chat");

  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );

  const t = useMemo(
    () =>
      isAr
        ? {
            title: "المحادثات المباشرة (Live Chat)",
            subtitle: "إدارة التواصل والمحادثات الحية مع زوار وعملاء الموقع في الوقت الفعلي",
            noAccess: "ليس لديك صلاحية لعرض أو إدارة المحادثات المباشرة.",
            searchPlaceholder: "بحث بالاسم، الهاتف، البريد أو الرسالة...",
            allChats: "الكل",
            activeChats: "النشطة والمفتوحة",
            closedChats: "المغلقة",
            allCategories: "جميع الفئات",
            supportCat: "الدعم الفني",
            salesCat: "المبيعات وعروض الأسعار",
            projectsCat: "المشاريع والحلول",
            generalCat: "استفسارات عامة",
            noSessions: "لا توجد محادثات مطابقة في الوقت الحالي.",
            selectPrompt: "اختر محادثة من القائمة لبدء الرد والتواصل مع العميل.",
            typeReply: "اكتب ردك هنا... (اضغط Enter للإرسال)",
            send: "إرسال",
            canned: "ردود سريعة جاهزة",
            visitorInfo: "بيانات الزائر",
            phone: "الهاتف",
            email: "البريد",
            category: "الفئة",
            startedAt: "بدء المحادثة",
            status: "الحالة",
            active: "نشط",
            waiting: "في الانتظار",
            closed: "مغلق",
            closeChat: "إغلاق المحادثة",
            reopenChat: "إعادة فتح المحادثة",
            deleteChat: "حذف المحادثة",
            deleteConfirm: "هل أنت متأكد من حذف هذه المحادثة بالكامل؟",
            notes: "ملاحظات داخلية للمشرفين",
            saveNotes: "حفظ الملاحظات",
            notesSaved: "تم حفظ الملاحظات بنجاح",
            whatsapp: "فتح واتساب",
            call: "اتصال",
            copied: "تم النسخ",
            unreadBadge: "جديد",
            visitorTyping: "العميل متصل الآن",
            agentBadge: "فريق الدعم",
            refresh: "تحديث",
            onlineBadge: "متصل",
          }
        : {
            title: "Live Chat & Realtime Support",
            subtitle: "Manage and respond to real-time conversations with website visitors and leads",
            noAccess: "You do not have permission to view or manage live chat sessions.",
            searchPlaceholder: "Search by visitor name, phone, email, or message...",
            allChats: "All",
            activeChats: "Active & Open",
            closedChats: "Closed",
            allCategories: "All Categories",
            supportCat: "Technical Support",
            salesCat: "Sales & BOQ",
            projectsCat: "Projects & Solutions",
            generalCat: "General Enquiry",
            noSessions: "No matching conversations found.",
            selectPrompt: "Select a conversation from the list to start messaging.",
            typeReply: "Type your reply... (Press Enter to send)",
            send: "Send",
            canned: "Quick Canned Replies",
            visitorInfo: "Visitor Details",
            phone: "Phone",
            email: "Email",
            category: "Category",
            startedAt: "Started",
            status: "Status",
            active: "Active",
            waiting: "Waiting",
            closed: "Closed",
            closeChat: "Close Chat",
            reopenChat: "Reopen Chat",
            deleteChat: "Delete Chat",
            deleteConfirm: "Are you sure you want to permanently delete this chat?",
            notes: "Internal Admin Notes",
            saveNotes: "Save Notes",
            notesSaved: "Notes saved successfully",
            whatsapp: "Open WhatsApp",
            call: "Call",
            copied: "Copied",
            unreadBadge: "New",
            visitorTyping: "Visitor is online",
            agentBadge: "Support Agent",
            refresh: "Refresh",
            onlineBadge: "Online",
          },
    [isAr]
  );

  // Play notification tone
  const playPing = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // 1. Fetch Sessions
  const fetchSessions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("live_chat_sessions")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error) {
        console.error("Error fetching chat sessions:", error);
        return;
      }

      setSessions(data || []);
      if (!selectedSessionId && data && data.length > 0) {
        setSelectedSessionId(data[0].id);
      }
    } finally {
      setLoadingSessions(false);
    }
  };

  // 2. Fetch Messages for Selected Session
  const fetchMessages = async (sessionId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await (supabase as any)
        .from("live_chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching chat messages:", error);
        return;
      }

      setMessages(data || []);

      // Mark admin unread as 0
      await (supabase as any)
        .from("live_chat_sessions")
        .update({ unread_admin: 0 })
        .eq("id", sessionId);

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, unread_admin: 0 } : s))
      );
    } finally {
      setLoadingMessages(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchSessions();
  }, []);

  // Update selected session notes
  useEffect(() => {
    if (selectedSession) {
      setAdminNotes(selectedSession.notes || "");
      fetchMessages(selectedSession.id);
    } else {
      setMessages([]);
      setAdminNotes("");
    }
  }, [selectedSessionId]);

  // Realtime Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("admin-live-chat-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_chat_sessions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newSession = payload.new as LiveChatSession;
            setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
            playPing();
            toast.info(isAr ? `محادثة جديدة من: ${newSession.visitor_name}` : `New chat from: ${newSession.visitor_name}`);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as LiveChatSession;
            setSessions((prev) => {
              const others = prev.filter((s) => s.id !== updated.id);
              return [updated, ...others].sort(
                (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              );
            });
          } else if (payload.eventType === "DELETE") {
            setSessions((prev) => prev.filter((s) => s.id !== (payload.old as any).id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_chat_messages" },
        (payload) => {
          const newMsg = payload.new as LiveChatMessage;
          if (newMsg.session_id === selectedSessionId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            if (newMsg.sender_type === "visitor") {
              playPing();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSessionId, isAr, soundEnabled]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send Reply
  const handleSendReply = async (customText?: string) => {
    const text = (customText || replyText).trim();
    if (!text || !selectedSessionId || !perms.edit) return;

    setSending(true);
    try {
      const agentName = user?.email?.split("@")[0] || "Support Agent";
      const { data, error } = await (supabase as any).from("live_chat_messages").insert({
        session_id: selectedSessionId,
        sender_type: "agent",
        sender_name: agentName,
        sender_id: user?.id || null,
        message: text,
        is_read: false,
      }).select().single();

      if (error) {
        console.error("Error sending message:", error);
        toast.error(isAr ? "فشل إرسال الرسالة" : "Failed to send message");
        return;
      }

      if (data) {
        setMessages((prev) => [...prev, data]);
      }
      setReplyText("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  // Toggle Chat Status (Active / Closed)
  const handleToggleStatus = async (newStatus: "active" | "closed") => {
    if (!selectedSessionId || !perms.edit) return;
    try {
      const { error } = await (supabase as any)
        .from("live_chat_sessions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", selectedSessionId);

      if (error) throw error;

      // Insert system message into chat
      const sysMsg =
        newStatus === "closed"
          ? isAr
            ? "تم إنهاء وإغلاق جلسة المحادثة بواسطة فريق الدعم."
            : "This chat session has been closed by the support agent."
          : isAr
          ? "تمت إعادة فتح جلسة المحادثة."
          : "This chat session has been reopened.";

      await (supabase as any).from("live_chat_messages").insert({
        session_id: selectedSessionId,
        sender_type: "system",
        sender_name: "System",
        message: sysMsg,
      });

      setSessions((prev) =>
        prev.map((s) => (s.id === selectedSessionId ? { ...s, status: newStatus } : s))
      );
      toast.success(
        newStatus === "closed"
          ? isAr ? "تم إغلاق المحادثة" : "Chat closed"
          : isAr ? "تم إعادة فتح المحادثة" : "Chat reopened"
      );
    } catch (err: any) {
      toast.error(err.message || "Status update failed");
    }
  };

  // Delete Chat
  const handleDeleteChat = async () => {
    if (!selectedSessionId || !perms.delete) return;
    if (!window.confirm(t.deleteConfirm)) return;

    try {
      const { error } = await (supabase as any)
        .from("live_chat_sessions")
        .delete()
        .eq("id", selectedSessionId);

      if (error) throw error;

      toast.success(isAr ? "تم حذف المحادثة" : "Chat deleted");
      const remaining = sessions.filter((s) => s.id !== selectedSessionId);
      setSessions(remaining);
      setSelectedSessionId(remaining.length > 0 ? remaining[0].id : null);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  // Save Admin Internal Notes
  const handleSaveNotes = async () => {
    if (!selectedSessionId || !perms.edit) return;
    setSavingNotes(true);
    try {
      const { error } = await (supabase as any)
        .from("live_chat_sessions")
        .update({ notes: adminNotes })
        .eq("id", selectedSessionId);

      if (error) throw error;
      setSessions((prev) =>
        prev.map((s) => (s.id === selectedSessionId ? { ...s, notes: adminNotes } : s))
      );
      toast.success(t.notesSaved);
    } catch (err: any) {
      toast.error(err.message || "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesName = s.visitor_name?.toLowerCase().includes(query);
        const matchesPhone = s.visitor_phone?.toLowerCase().includes(query);
        const matchesEmail = s.visitor_email?.toLowerCase().includes(query);
        const matchesMsg = s.last_message?.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesMsg) return false;
      }

      // Status
      if (statusFilter === "active" && s.status === "closed") return false;
      if (statusFilter === "closed" && s.status !== "closed") return false;

      // Category
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;

      return true;
    });
  }, [sessions, searchQuery, statusFilter, categoryFilter]);

  if (!perms.view) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">{t.title}</h2>
        <p className="text-muted-foreground">{t.noAccess}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-2xl p-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span>{t.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                {sessions.filter((s) => s.status === "active").length} {t.active}
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-9 px-3 gap-1.5 text-xs"
            title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-accent" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            <span className="hidden sm:inline">{soundEnabled ? "Audio On" : "Audio Muted"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loadingSessions}
            className="h-9 px-3 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingSessions ? "animate-spin" : ""}`} />
            <span>{t.refresh}</span>
          </Button>
        </div>
      </div>

      {/* Main 3-Pane Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-240px)] min-h-[620px]">
        {/* Left Pane: Sessions List (4 cols) */}
        <div className="lg:col-span-4 bg-card border rounded-2xl flex flex-col overflow-hidden shadow-xs">
          {/* Search and Filters */}
          <div className="p-3 border-b space-y-2.5 bg-muted/20">
            <div className="relative">
              <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="ps-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === "all"
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {t.allChats} ({sessions.length})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === "active"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {t.activeChats} ({sessions.filter((s) => s.status !== "closed").length})
              </button>
              <button
                onClick={() => setStatusFilter("closed")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === "closed"
                    ? "bg-muted-foreground text-background font-semibold"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {t.closedChats} ({sessions.filter((s) => s.status === "closed").length})
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px]">
              {["all", "support", "sales", "projects", "general"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded-md border whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? "border-accent bg-accent/10 text-accent font-semibold"
                      : "border-transparent bg-background/50 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {cat === "all"
                    ? t.allCategories
                    : cat === "support"
                    ? t.supportCat
                    : cat === "sales"
                    ? t.salesCat
                    : cat === "projects"
                    ? t.projectsCat
                    : t.generalCat}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {loadingSessions ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-accent" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <AlertCircle className="h-6 w-6 mx-auto text-muted-foreground/60" />
                <p>{t.noSessions}</p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isSelected = session.id === selectedSessionId;
                const isClosed = session.status === "closed";
                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-full text-start p-3.5 transition-all flex items-start gap-3 relative hover:bg-accent/5 ${
                      isSelected ? "bg-accent/10 border-s-4 border-accent" : ""
                    }`}
                  >
                    {/* Visitor Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-sm">
                        {session.visitor_name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      {!isClosed && (
                        <span className="absolute bottom-0 end-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {session.visitor_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(session.last_message_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                            session.category === "sales"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : session.category === "support"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              : session.category === "projects"
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {session.category === "support"
                            ? t.supportCat
                            : session.category === "sales"
                            ? t.salesCat
                            : session.category === "projects"
                            ? t.projectsCat
                            : t.generalCat}
                        </span>
                        {session.visitor_phone && (
                          <span dir="ltr" className="text-[10px] text-muted-foreground truncate">
                            {session.visitor_phone}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate mt-1 leading-tight">
                        {session.last_message || "(No messages yet)"}
                      </p>
                    </div>

                    {/* Unread Counter Badge */}
                    {session.unread_admin > 0 && (
                      <span className="shrink-0 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {session.unread_admin}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center Pane: Active Chat Conversation (5 cols) */}
        <div className="lg:col-span-5 bg-card border rounded-2xl flex flex-col overflow-hidden shadow-xs">
          {selectedSession ? (
            <>
              {/* Active Chat Header */}
              <div className="px-4 py-3 border-b flex items-center justify-between gap-3 bg-muted/20">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 font-bold text-sm">
                    {selectedSession.visitor_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                        {selectedSession.visitor_name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          selectedSession.status === "closed"
                            ? "bg-muted text-muted-foreground"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {selectedSession.status === "closed" ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        {selectedSession.status === "closed" ? t.closed : t.onlineBadge}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{selectedSession.visitor_email || "No email"}</span>
                      {selectedSession.visitor_phone && (
                        <>
                          <span>•</span>
                          <span dir="ltr">{selectedSession.visitor_phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedSession.status !== "closed" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus("closed")}
                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{t.closeChat}</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus("active")}
                      className="h-8 px-2.5 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{t.reopenChat}</span>
                    </Button>
                  )}

                  {perms.delete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDeleteChat}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title={t.deleteChat}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages Thread Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
                {loadingMessages ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-accent" />
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p>No messages in this chat session yet.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAgent = msg.sender_type === "agent";
                    const isSystem = msg.sender_type === "system";

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center my-2">
                          <span className="text-[11px] px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium inline-flex items-center gap-1.5 shadow-2xs">
                            <Clock className="h-3 w-3 opacity-60" />
                            <span>{msg.message}</span>
                            <span className="opacity-60 text-[10px]">({formatMessageDateTime(msg.created_at, lang as any)})</span>
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${isAgent ? "justify-end" : "justify-start"}`}
                      >
                        {!isAgent && (
                          <div className="h-7 w-7 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
                            {selectedSession.visitor_name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className={`max-w-[78%] space-y-1 ${isAgent ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                            <span className="font-semibold text-foreground">
                              {isAgent ? `${msg.sender_name} (${t.agentBadge})` : selectedSession.visitor_name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5 opacity-60" />
                              <span>{formatMessageDateTime(msg.created_at, lang as any)}</span>
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-xs ${
                              isAgent
                                ? "bg-accent text-accent-foreground rounded-ee-sm font-medium"
                                : "bg-card border text-foreground rounded-es-sm"
                            }`}
                          >
                            <div>{msg.message}</div>
                            <div
                              className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 ${
                                isAgent ? "text-accent-foreground/75" : "text-muted-foreground/70"
                              }`}
                            >
                              <span>{formatMessageDateTime(msg.created_at, lang as any)}</span>
                            </div>
                          </div>
                        </div>

                        {isAgent && (
                          <div className="h-7 w-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                            <Headset className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Canned Replies Carousel */}
              <div className="p-2 border-t bg-muted/10 overflow-x-auto flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 ps-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span>{t.canned}:</span>
                </span>
                {CANNED_RESPONSES.map((item, idx) => {
                  const txt = isAr ? item.ar : item.en;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendReply(txt)}
                      disabled={!perms.edit || sending}
                      className="text-[11px] px-2.5 py-1 rounded-full border bg-card hover:bg-accent/10 hover:border-accent text-muted-foreground hover:text-accent transition-colors whitespace-nowrap shrink-0 shadow-2xs"
                    >
                      {txt.slice(0, 32)}...
                    </button>
                  );
                })}
              </div>

              {/* Message Reply Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReply();
                }}
                className="p-3 border-t bg-card flex items-center gap-2"
              >
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t.typeReply}
                  disabled={!perms.edit || sending}
                  className="flex-1 h-10 text-xs"
                />
                <Button
                  type="submit"
                  disabled={!replyText.trim() || !perms.edit || sending}
                  className="h-10 px-4 gap-1.5 text-xs font-semibold shadow-xs"
                >
                  <Send className="h-4 w-4" />
                  <span>{t.send}</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm font-medium">{t.selectPrompt}</p>
            </div>
          )}
        </div>

        {/* Right Pane: Visitor Profile Card & Internal Notes (3 cols) */}
        <div className="lg:col-span-3 bg-card border rounded-2xl flex flex-col overflow-hidden shadow-xs">
          {selectedSession ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Profile Card Header */}
              <div className="text-center pb-3 border-b space-y-2">
                <div className="h-14 w-14 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto text-lg font-bold">
                  {selectedSession.visitor_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{selectedSession.visitor_name}</h3>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedSession.lang === "ar" ? "اللغة: العربية" : "Language: English"}
                  </span>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {selectedSession.visitor_phone && (
                    <>
                      <a
                        href={`https://wa.me/${selectedSession.visitor_phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/25 transition-colors text-xs font-semibold flex items-center gap-1"
                        title={t.whatsapp}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <path d="M17.6 6.32A7.85 7.85 0 0012 4a7.94 7.94 0 00-6.78 12L4 20l4.13-1.08A7.93 7.93 0 0012 19.9a7.94 7.94 0 005.6-13.58zM12 18.5a6.55 6.55 0 01-3.34-.92l-.24-.14-2.45.64.65-2.39-.16-.25A6.57 6.57 0 1118.57 12 6.6 6.6 0 0112 18.5zm3.6-4.92c-.2-.1-1.16-.57-1.34-.64s-.31-.1-.44.1-.5.63-.62.76-.23.15-.43.05a5.36 5.36 0 01-1.58-1 6 6 0 01-1.1-1.36c-.11-.2 0-.3.09-.4s.2-.23.3-.34a1.4 1.4 0 00.2-.34.37.37 0 000-.35c0-.1-.44-1.07-.6-1.46s-.32-.34-.44-.34h-.38a.74.74 0 00-.53.25 2.22 2.22 0 00-.7 1.65 3.85 3.85 0 00.81 2.05 8.85 8.85 0 003.39 3 11.4 11.4 0 001.13.42 2.71 2.71 0 001.25.08 2.05 2.05 0 001.34-.95 1.65 1.65 0 00.12-.95c-.05-.08-.18-.13-.38-.23z" />
                        </svg>
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={`tel:${selectedSession.visitor_phone}`}
                        className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold flex items-center gap-1"
                        title={t.call}
                      >
                        <Phone className="h-4 w-4 text-accent" />
                        <span>{t.call}</span>
                      </a>
                    </>
                  )}

                  {selectedSession.visitor_email && (
                    <a
                      href={`mailto:${selectedSession.visitor_email}`}
                      className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold flex items-center gap-1"
                      title="Email"
                    >
                      <Mail className="h-4 w-4 text-accent" />
                    </a>
                  )}
                </div>
              </div>

              {/* Information Meta Fields */}
              <div className="space-y-2.5 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t.visitorInfo}
                </div>

                <div className="p-2.5 rounded-xl bg-muted/30 border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.category}:</span>
                    <span className="font-semibold text-foreground">
                      {selectedSession.category === "support"
                        ? t.supportCat
                        : selectedSession.category === "sales"
                        ? t.salesCat
                        : selectedSession.category === "projects"
                        ? t.projectsCat
                        : t.generalCat}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.phone}:</span>
                    <span dir="ltr" className="font-semibold text-foreground">
                      {selectedSession.visitor_phone || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.email}:</span>
                    <span className="font-semibold text-foreground truncate max-w-[150px]">
                      {selectedSession.visitor_email || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.startedAt}:</span>
                    <span className="text-muted-foreground">
                      {new Date(selectedSession.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Internal Staff Notes */}
              <div className="space-y-2 pt-2 border-t text-xs">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-accent" />
                  <span>{t.notes}</span>
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={!perms.edit}
                  placeholder="Add internal notes about this client/inquiry..."
                  rows={4}
                  className="w-full p-2.5 rounded-xl border bg-background text-foreground text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
                <Button
                  onClick={handleSaveNotes}
                  disabled={!perms.edit || savingNotes}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs font-semibold"
                >
                  {savingNotes ? (
                    <RefreshCw className="h-3 w-3 animate-spin me-1" />
                  ) : (
                    <Check className="h-3 w-3 me-1" />
                  )}
                  <span>{t.saveNotes}</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground text-xs">
              <UserIcon className="h-8 w-8 mb-2 opacity-40" />
              <span>{t.visitorInfo}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
