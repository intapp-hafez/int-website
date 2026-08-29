/** Bilingual (EN + AR) email + WhatsApp templates for training registrations. */

export type TrainingEmailInput = {
  fullName: string;
  titleEn: string;
  titleAr: string;
  trainer: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
};

function esc(s: string) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

function when(i: TrainingEmailInput) {
  if (!i.startDate) return "";
  return i.endDate && i.endDate !== i.startDate ? `${i.startDate} → ${i.endDate}` : i.startDate;
}

function shell(headEn: string, headAr: string, bodyEn: string, bodyAr: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#111">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
    <table role="presentation" width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <tr><td style="background:#0f172a;color:#fff;padding:20px 24px;font-size:18px;font-weight:600">${esc(headEn)} &middot; ${esc(headAr)}</td></tr>
      <tr><td style="padding:24px" dir="ltr">${bodyEn}</td></tr>
      <tr><td style="border-top:1px solid #e5e7eb"></td></tr>
      <tr><td style="padding:24px" dir="rtl" align="right">${bodyAr}</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function facts(i: TrainingEmailInput, ar: boolean) {
  const rows: [string, string][] = [];
  const w = when(i);
  if (w) rows.push([ar ? "التاريخ" : "Date", w]);
  if (i.trainer) rows.push([ar ? "المدرب" : "Trainer", i.trainer]);
  if (i.location) rows.push([ar ? "المكان" : "Location", i.location]);
  if (!rows.length) return "";
  return `<table role="presentation" style="margin:0 0 12px;font-size:14px">${rows
    .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#64748b">${esc(k)}</td><td style="padding:2px 0"><strong>${esc(v)}</strong></td></tr>`)
    .join("")}</table>`;
}

/** Sent to the learner immediately after they submit the form. */
export function renderRegistrationReceived(i: TrainingEmailInput) {
  const subject = `Registration received — ${i.titleEn || i.titleAr} | تم استلام تسجيلك`;
  const html = shell(
    "Registration received",
    "تم استلام تسجيلك",
    `<p style="margin:0 0 8px">Hi ${esc(i.fullName)},</p>
     <p style="margin:0 0 12px;line-height:1.6">Thanks for registering for <strong>${esc(i.titleEn || i.titleAr)}</strong>. Your registration is <strong>pending admin approval</strong> — we'll email you once it is confirmed.</p>
     ${facts(i, false)}`,
    `<p style="margin:0 0 8px">مرحباً ${esc(i.fullName)}،</p>
     <p style="margin:0 0 12px;line-height:1.8">شكراً لتسجيلك في <strong>${esc(i.titleAr || i.titleEn)}</strong>. تسجيلك <strong>قيد مراجعة الإدارة</strong> وسنخبرك فور اعتماده.</p>
     ${facts(i, true)}`,
  );
  const text = `Registration received for ${i.titleEn || i.titleAr}. Pending approval.\n\nتم استلام تسجيلك في ${i.titleAr || i.titleEn}. قيد المراجعة.`;
  return { subject, html, text };
}

/** Sent to the learner when an admin approves the registration. */
export function renderRegistrationApproved(i: TrainingEmailInput) {
  const subject = `Registration confirmed — ${i.titleEn || i.titleAr} | تم تأكيد تسجيلك`;
  const html = shell(
    "Registration confirmed",
    "تم تأكيد تسجيلك",
    `<p style="margin:0 0 8px">Hi ${esc(i.fullName)},</p>
     <p style="margin:0 0 12px;line-height:1.6">Your seat in <strong>${esc(i.titleEn || i.titleAr)}</strong> is confirmed. We look forward to seeing you.</p>
     ${facts(i, false)}`,
    `<p style="margin:0 0 8px">مرحباً ${esc(i.fullName)}،</p>
     <p style="margin:0 0 12px;line-height:1.8">تم تأكيد مقعدك في <strong>${esc(i.titleAr || i.titleEn)}</strong>. في انتظارك.</p>
     ${facts(i, true)}`,
  );
  return { subject, html, text: `Registration confirmed — ${i.titleEn || i.titleAr}\nتم تأكيد تسجيلك — ${i.titleAr || i.titleEn}` };
}

/** Sent to the learner when a registration is declined. */
export function renderRegistrationRejected(i: TrainingEmailInput, note: string) {
  const subject = `Registration update — ${i.titleEn || i.titleAr} | تحديث بشأن تسجيلك`;
  const reasonEn = note ? `<p style="margin:0 0 12px">Note: ${esc(note)}</p>` : "";
  const reasonAr = note ? `<p style="margin:0 0 12px">ملاحظة: ${esc(note)}</p>` : "";
  const html = shell(
    "Registration update",
    "تحديث بشأن تسجيلك",
    `<p style="margin:0 0 8px">Hi ${esc(i.fullName)},</p>
     <p style="margin:0 0 12px;line-height:1.6">Unfortunately we couldn't confirm your seat in <strong>${esc(i.titleEn || i.titleAr)}</strong> this time.</p>${reasonEn}`,
    `<p style="margin:0 0 8px">مرحباً ${esc(i.fullName)}،</p>
     <p style="margin:0 0 12px;line-height:1.8">للأسف لم نتمكن من تأكيد مقعدك في <strong>${esc(i.titleAr || i.titleEn)}</strong> هذه المرة.</p>${reasonAr}`,
  );
  return { subject, html, text: `Registration not confirmed — ${i.titleEn || i.titleAr}` };
}

export type StaffInput = TrainingEmailInput & {
  email: string;
  phone: string;
  gender: string;
  city: string;
  district: string;
  educationField: string;
};

/** Sent to the trainer / managers when a new registration lands. */
export function renderStaffAlert(i: StaffInput) {
  const subject = `New training registration — ${i.titleEn || i.titleAr}`;
  const rows: [string, string][] = [
    ["Program", i.titleEn || i.titleAr],
    ["Learner", i.fullName],
    ["Email", i.email],
    ["Phone", i.phone],
    ["Gender", i.gender],
    ["Education", i.educationField],
    ["City / District", [i.city, i.district].filter(Boolean).join(" / ")],
    ["Date", when(i)],
    ["Trainer", i.trainer],
    ["Location", i.location],
  ];
  const html = `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#111">
  <table role="presentation" width="100%"><tr><td align="center" style="padding:24px">
    <table role="presentation" width="100%" style="max-width:600px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
      <tr><td style="background:#0f172a;color:#fff;padding:20px 24px;font-size:18px;font-weight:600">New training registration</td></tr>
      <tr><td style="padding:24px" dir="ltr"><table role="presentation" style="font-size:14px">${rows
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><td style="padding:3px 12px 3px 0;color:#64748b">${esc(k)}</td><td style="padding:3px 0"><strong>${esc(v)}</strong></td></tr>`)
        .join("")}</table>
      <p style="margin:16px 0 0;color:#64748b;font-size:13px">Approve or decline this registration from Admin → Training → Registrations.</p></td></tr>
    </table></td></tr></table></body></html>`;
  const text = rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
  return { subject, html, text };
}

/** Short WhatsApp/SMS body for the learner. */
export function renderLearnerSms(i: TrainingEmailInput, kind: "received" | "approved") {
  const w = when(i);
  if (kind === "approved") {
    return [
      `Your registration for ${i.titleEn || i.titleAr} is CONFIRMED.${w ? ` Date: ${w}.` : ""}${i.location ? ` Location: ${i.location}.` : ""}`,
      "",
      `تم تأكيد تسجيلك في ${i.titleAr || i.titleEn}.${w ? ` التاريخ: ${w}.` : ""}`,
    ].join("\n");
  }
  return [
    `Registration received for ${i.titleEn || i.titleAr}. Pending approval — we'll confirm shortly.`,
    "",
    `تم استلام تسجيلك في ${i.titleAr || i.titleEn}. قيد المراجعة وسنؤكده قريباً.`,
  ].join("\n");
}
