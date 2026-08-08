import { STATUS_LABEL, type CareerStatus } from "@/lib/career-workflow";

type Row = Record<string, any>;
type Ev = { application_id: string; from_status: string | null; to_status: string; note: string; created_at: string };

const label = (s: string) => {
  const l = STATUS_LABEL[s as CareerStatus];
  return l ? `${l.en} / ${l.ar}` : s;
};

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : "");

function groupEvents(events: Ev[]) {
  const map = new Map<string, Ev[]>();
  for (const e of events ?? []) {
    const list = map.get(e.application_id) ?? [];
    list.push(e);
    map.set(e.application_id, list);
  }
  return map;
}

function csvCell(v: any) {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export function buildApplicantCsv(apps: Row[], events: Ev[]) {
  const byApp = groupEvents(events);
  const headers = [
    "Ref / المرجع",
    "Full Name / الاسم",
    "Email / البريد",
    "Phone / الهاتف",
    "Job (EN)",
    "Job (AR) / الوظيفة",
    "Status / الحالة",
    "City / المدينة",
    "Country / الدولة",
    "Years Experience / سنوات الخبرة",
    "Source / المصدر",
    "Applied At / تاريخ التقديم",
    "Stage History / سجل المراحل",
    "Internal Notes / ملاحظات داخلية",
  ];
  const lines = [headers.map(csvCell).join(",")];
  for (const a of apps ?? []) {
    const history = (byApp.get(a.id) ?? [])
      .map(e => `${fmt(e.created_at)} — ${e.from_status ? label(e.from_status) + " → " : ""}${label(e.to_status)}${e.note ? ` (${e.note})` : ""}`)
      .join(" | ");
    lines.push([
      a.ref, a.full_name, a.email, a.phone,
      a.career_jobs?.title_en, a.career_jobs?.title_ar,
      label(a.status), a.city, a.country, a.years_experience,
      a.referral_source, fmt(a.created_at), history, a.internal_notes,
    ].map(csvCell).join(","));
  }
  return lines.join("\r\n");
}

const esc = (v: any) =>
  String(v ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

/** Opens a print-ready bilingual report; the browser print dialog saves it as PDF. */
export function openApplicantReportPdf(apps: Row[], events: Ev[]) {
  const byApp = groupEvents(events);
  const cards = (apps ?? []).map(a => {
    const history = (byApp.get(a.id) ?? [])
      .map(e => `<li><span class="ts">${esc(fmt(e.created_at))}</span> — ${esc(e.from_status ? label(e.from_status) + " → " : "")}<b>${esc(label(e.to_status))}</b>${e.note ? ` <i>${esc(e.note)}</i>` : ""}</li>`)
      .join("") || `<li class="muted">No stage history / لا يوجد سجل مراحل</li>`;
    return `
      <section class="card">
        <header>
          <h2>${esc(a.full_name)}</h2>
          <span class="ref">${esc(a.ref)}</span>
        </header>
        <table>
          <tr><th>Job / الوظيفة</th><td>${esc(a.career_jobs?.title_en ?? "")} <span dir="rtl">${esc(a.career_jobs?.title_ar ?? "")}</span></td></tr>
          <tr><th>Status / الحالة</th><td>${esc(label(a.status))}</td></tr>
          <tr><th>Email / البريد</th><td dir="ltr">${esc(a.email)}</td></tr>
          <tr><th>Phone / الهاتف</th><td dir="ltr">${esc(a.phone ?? "")}</td></tr>
          <tr><th>Location / الموقع</th><td>${esc([a.city, a.country].filter(Boolean).join(", "))}</td></tr>
          <tr><th>Experience / الخبرة</th><td dir="ltr">${esc(a.years_experience ?? "")}</td></tr>
          <tr><th>Applied / تاريخ التقديم</th><td dir="ltr">${esc(fmt(a.created_at))}</td></tr>
        </table>
        <h3>Stage history / سجل المراحل</h3>
        <ul class="history">${history}</ul>
        <h3>Internal notes / ملاحظات داخلية</h3>
        <p class="notes">${esc(a.internal_notes || "—")}</p>
      </section>`;
  }).join("");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
  <title>Applicant report / تقرير المتقدمين</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    *{box-sizing:border-box}
    body{font-family:Cairo,system-ui,Segoe UI,sans-serif;margin:32px;color:#111;font-size:12px}
    h1{font-size:20px;margin:0 0 4px}
    .sub{color:#666;margin-bottom:20px}
    .card{border:1px solid #ddd;border-radius:8px;padding:14px;margin-bottom:14px;page-break-inside:avoid}
    .card header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:8px}
    h2{font-size:14px;margin:0}
    h3{font-size:12px;margin:10px 0 4px;color:#444}
    .ref{font-family:ui-monospace,monospace;font-size:11px;color:#666}
    table{width:100%;border-collapse:collapse}
    th{text-align:start;width:180px;font-weight:600;color:#555;padding:2px 0;vertical-align:top}
    td{padding:2px 0}
    ul.history{margin:0;padding-inline-start:16px}
    ul.history li{margin-bottom:2px}
    .ts{font-family:ui-monospace,monospace;color:#666}
    .muted{color:#888}
    .notes{white-space:pre-wrap;background:#fafafa;border:1px solid #eee;border-radius:6px;padding:8px;margin:0}
    @media print{body{margin:12mm}}
  </style></head>
  <body>
    <h1>Applicant report — تقرير المتقدمين</h1>
    <div class="sub">${(apps ?? []).length} applicant(s) / متقدم — ${esc(new Date().toLocaleString())}</div>
    ${cards}
    <script>window.addEventListener("load",function(){setTimeout(function(){window.print()},400)})<\/script>
  </body></html>`;

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}