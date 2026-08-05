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