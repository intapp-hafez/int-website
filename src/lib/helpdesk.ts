export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus =
  | "new"
  | "open"
  | "in_progress"
  | "waiting_client"
  | "resolved"
  | "closed"
  | "cancelled";

export type Ticket = {
  id: string;
  ticket_no: string | null;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  branch: string;
  device_serial: string;
  lang: string;
  client_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  sla_policy_id?: string | null;
  first_response_due_at?: string | null;
  resolve_due_at?: string | null;
  first_response_at?: string | null;
  invoice_no?: string | null;
  invoice_amount?: number | null;
  invoice_currency?: string;
  invoice_notes?: string;
  invoice_status?: string;
  invoice_issued_at?: string | null;
  invoice_paid_at?: string | null;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  author_id: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export type TicketEvent = {
  id: string;
  ticket_id: string;
  actor_id: string | null;
  event_type: string;
  from_value: string;
  to_value: string;
  note: string;
  created_at: string;
};

export const PRIORITIES: { value: TicketPriority; en: string; ar: string; tone: string }[] = [
  { value: "low", en: "Low", ar: "منخفض", tone: "bg-muted text-foreground" },
  { value: "medium", en: "Medium", ar: "متوسط", tone: "bg-blue-500/10 text-blue-700" },
  { value: "high", en: "High", ar: "مرتفع", tone: "bg-amber-100 text-amber-900" },
  { value: "urgent", en: "Urgent", ar: "عاجل", tone: "bg-destructive/10 text-destructive" },
];

export const STATUSES: { value: TicketStatus; en: string; ar: string; tone: string }[] = [
  { value: "new", en: "New", ar: "جديد", tone: "bg-sky-500/10 text-sky-700" },
  { value: "open", en: "Open", ar: "مفتوح", tone: "bg-emerald-500/10 text-emerald-700" },
  { value: "in_progress", en: "In progress", ar: "قيد المعالجة", tone: "bg-indigo-500/10 text-indigo-700" },
  { value: "waiting_client", en: "Waiting client", ar: "بانتظار العميل", tone: "bg-amber-100 text-amber-900" },
  { value: "resolved", en: "Resolved", ar: "تم الحل", tone: "bg-teal-500/10 text-teal-700" },
  { value: "closed", en: "Closed", ar: "مغلق", tone: "bg-muted text-foreground" },
  { value: "cancelled", en: "Cancelled", ar: "ملغى", tone: "bg-rose-500/10 text-rose-700" },
];

export const CATEGORIES: { value: string; en: string; ar: string }[] = [
  { value: "general", en: "General", ar: "عام" },
  { value: "networking", en: "Networking", ar: "الشبكات" },
  { value: "cctv", en: "CCTV", ar: "كاميرات المراقبة" },
  { value: "access_control", en: "Access control", ar: "التحكم بالدخول" },
  { value: "fire_alarm", en: "Fire alarm", ar: "إنذار الحريق" },
  { value: "structured_cabling", en: "Structured cabling", ar: "الكابلات المنظمة" },
  { value: "av", en: "AV systems", ar: "أنظمة AV" },
  { value: "data_center", en: "Data center", ar: "مركز البيانات" },
  { value: "billing", en: "Billing", ar: "الفوترة" },
  { value: "other", en: "Other", ar: "أخرى" },
];

export const labelFor = <T extends { value: string; en: string; ar: string }>(
  list: T[],
  v: string,
  lang: "en" | "ar",
) => list.find((x) => x.value === v)?.[lang] ?? v;

export const toneFor = <T extends { value: string; tone: string }>(list: T[], v: string) =>
  list.find((x) => x.value === v)?.tone ?? "bg-muted text-foreground";

export type SlaState = "none" | "ok" | "at_risk" | "breached" | "met";
export function slaState(due?: string | null, doneAt?: string | null): SlaState {
  if (!due) return "none";
  const dueMs = new Date(due).getTime();
  if (doneAt) return new Date(doneAt).getTime() <= dueMs ? "met" : "breached";
  const now = Date.now();
  if (now > dueMs) return "breached";
  // at risk if less than 20% of original window remains — we don't know start, approximate with 30 min
  if (dueMs - now < 30 * 60 * 1000) return "at_risk";
  return "ok";
}
export function slaBadgeTone(s: SlaState): string {
  switch (s) {
    case "breached": return "bg-destructive/10 text-destructive";
    case "at_risk": return "bg-amber-100 text-amber-900";
    case "met": return "bg-emerald-500/10 text-emerald-700";
    case "ok": return "bg-sky-500/10 text-sky-700";
    default: return "bg-muted text-foreground";
  }
}
export function slaLabel(s: SlaState): string {
  return ({ none: "No SLA", ok: "On track", at_risk: "At risk", breached: "Breached", met: "Met" } as const)[s];
}
export function formatRemaining(due?: string | null): string {
  if (!due) return "—";
  const diff = new Date(due).getTime() - Date.now();
  const past = diff < 0;
  const abs = Math.abs(diff);
  const m = Math.floor(abs / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const txt = d > 0 ? `${d}d ${h % 24}h` : h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  return past ? `Overdue by ${txt}` : `${txt} left`;
}