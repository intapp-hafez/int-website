export type CareerStatus = "new" | "reviewed" | "shortlisted" | "interviewed" | "offered" | "accepted" | "rejected" | "withdrawn";

export const STATUS_PIPELINE: CareerStatus[] = ["new", "reviewed", "shortlisted", "interviewed", "offered", "accepted"];
export const STATUS_ALL: CareerStatus[] = [...STATUS_PIPELINE, "rejected", "withdrawn"];

export const STATUS_LABEL: Record<CareerStatus, { en: string; ar: string }> = {
  new:         { en: "New",         ar: "جديد" },
  reviewed:    { en: "Reviewed",    ar: "تمت المراجعة" },
  shortlisted: { en: "Shortlisted", ar: "قائمة قصيرة" },
  interviewed: { en: "Interviewed", ar: "تمت المقابلة" },
  offered:     { en: "Offered",     ar: "تم تقديم عرض" },
  accepted:    { en: "Accepted",    ar: "مقبول" },
  rejected:    { en: "Rejected",    ar: "مرفوض" },
  withdrawn:   { en: "Withdrawn",   ar: "منسحب" },
};

export const STATUS_COLOR: Record<CareerStatus, string> = {
  new:         "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
  reviewed:    "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  shortlisted: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  interviewed: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  offered:     "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  accepted:    "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30",
  rejected:    "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
  withdrawn:   "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30",
};

/** Allowed next statuses given the current status. */
export function nextStatuses(current: CareerStatus): CareerStatus[] {
  if (current === "accepted" || current === "rejected" || current === "withdrawn") return [];
  const idx = STATUS_PIPELINE.indexOf(current);
  const forward = idx >= 0 ? STATUS_PIPELINE.slice(idx + 1) : [];
  return [...forward, "rejected", "withdrawn"];
}

/** Human-friendly stage names (EN/AR + common variants) mapped to internal stage IDs. */
export const STATUS_ALIASES: Record<string, CareerStatus> = {
  // new
  new: "new", "new applicant": "new", applied: "new", application: "new", pending: "new", received: "new",
  "جديد": "new", "جديدة": "new", "تم الاستلام": "new", "قيد الانتظار": "new",
  // reviewed
  reviewed: "reviewed", review: "reviewed", "in review": "reviewed", "under review": "reviewed", screened: "reviewed", screening: "reviewed",
  "تمت المراجعة": "reviewed", "مراجعة": "reviewed", "قيد المراجعة": "reviewed",
  // shortlisted
  shortlisted: "shortlisted", shortlist: "shortlisted", "short list": "shortlisted", "short listed": "shortlisted", "short-list": "shortlisted", "short-listed": "shortlisted",
  "قائمة قصيرة": "shortlisted", "القائمة القصيرة": "shortlisted", "مرشح": "shortlisted",
  // interviewed
  interviewed: "interviewed", interview: "interviewed", "interview done": "interviewed", "interview completed": "interviewed",
  "تمت المقابلة": "interviewed", "مقابلة": "interviewed",
  // offered
  offered: "offered", offer: "offered", "offer sent": "offered", "offer extended": "offered",
  "تم تقديم عرض": "offered", "عرض": "offered", "تم إرسال العرض": "offered",
  // accepted
  accepted: "accepted", accept: "accepted", hired: "accepted", "offer accepted": "accepted", onboarded: "accepted",
  "مقبول": "accepted", "تم القبول": "accepted", "تم التوظيف": "accepted",
  // rejected
  rejected: "rejected", reject: "rejected", declined: "rejected", "not selected": "rejected", "not a fit": "rejected", disqualified: "rejected",
  "مرفوض": "rejected", "تم الرفض": "rejected", "غير مناسب": "rejected",
  // withdrawn
  withdrawn: "withdrawn", withdraw: "withdrawn", "withdrew": "withdrawn", cancelled: "withdrawn", canceled: "withdrawn",
  "منسحب": "withdrawn", "انسحب": "withdrawn", "ملغي": "withdrawn",
};

/** Normalizes a human-typed stage name (EN/AR) to an internal stage ID, or null. */
export function resolveStatus(input: string): CareerStatus | null {
  const raw = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.,;:!]+$/g, "")
    .replace(/[\u064B-\u0652\u0640]/g, "") // Arabic diacritics/tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
  if (!raw) return null;
  if (STATUS_ALL.includes(raw as CareerStatus)) return raw as CareerStatus;
  for (const [key, value] of Object.entries(STATUS_ALIASES)) {
    const k = key
      .toLowerCase()
      .replace(/[_\-]+/g, " ")
      .replace(/[\u064B-\u0652\u0640]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي");
    if (k === raw) return value;
  }
  return null;
}