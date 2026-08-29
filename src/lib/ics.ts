/** Minimal RFC 5545 calendar file builder for training sessions / events. */

export type IcsInput = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  organizer?: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD (inclusive); defaults to startDate */
  endDate?: string | null;
  url?: string;
};

function fold(line: string) {
  // ICS lines must not exceed 75 octets.
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(out.length === 0 ? rest.slice(0, 73) : ` ${rest.slice(0, 72)}`);
    rest = rest.slice(out.length === 1 ? 73 : 72);
  }
  out.push(out.length === 0 ? rest : ` ${rest}`);
  return out.join("\r\n");
}

function escapeText(s: string) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toDate(d: string) {
  return d.replace(/-/g, "");
}

/** All-day event ending the day AFTER the last day, per the DTEND exclusive rule. */
function nextDay(d: string) {
  const dt = new Date(`${d}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10).replace(/-/g, "");
}

export function buildIcs(i: IcsInput) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = i.endDate || i.startDate;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Integrated Technics//Training//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeText(i.uid)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${toDate(i.startDate)}`,
    `DTEND;VALUE=DATE:${nextDay(end)}`,
    `SUMMARY:${escapeText(i.title)}`,
    i.description ? `DESCRIPTION:${escapeText(i.description)}` : "",
    i.location ? `LOCATION:${escapeText(i.location)}` : "",
    i.organizer ? `ORGANIZER;CN=${escapeText(i.organizer)}:MAILTO:noreply@integratedtechnics.com` : "",
    i.url ? `URL:${escapeText(i.url)}` : "",
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(i.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.map(fold).join("\r\n");
}

export function downloadIcs(filename: string, ics: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
