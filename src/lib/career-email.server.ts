import { STATUS_LABEL, type CareerStatus } from "@/lib/career-workflow";

export type ConfirmationInput = {
  ref: string;
  fullName: string;
  email: string;
  jobTitleEn: string;
  jobTitleAr: string;
  trackUrl: string;
  status: CareerStatus;
};

/** Bilingual (EN + AR) application-receipt email. */
export function renderConfirmationEmail(i: ConfirmationInput) {
  const subject = `Application received — ${i.ref} | تم استلام طلبك`;
  const status = STATUS_LABEL[i.status] ?? STATUS_LABEL.new;
  const html = `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#111">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
    <table role="presentation" width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <tr><td style="background:#0f172a;color:#fff;padding:20px 24px;font-size:18px;font-weight:600">Application received &middot; تم استلام طلبك</td></tr>
      <tr><td style="padding:24px" dir="ltr">
        <p style="margin:0 0 8px">Hi ${esc(i.fullName)},</p>
        <p style="margin:0 0 12px;line-height:1.6">Thank you for applying${i.jobTitleEn ? ` for <strong>${esc(i.jobTitleEn)}</strong>` : ""}. Your application has been received and is currently <strong>${esc(status.en)}</strong>.</p>
        <p style="margin:0 0 12px">Your reference number: <strong style="font-family:monospace;direction:ltr">${esc(i.ref)}</strong></p>
        <p style="margin:0 0 20px"><a href="${esc(i.trackUrl)}" style="background:#0f172a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">Track your application</a></p>
      </td></tr>
      <tr><td style="border-top:1px solid #e5e7eb"></td></tr>
      <tr><td style="padding:24px" dir="rtl" align="right">
        <p style="margin:0 0 8px">مرحباً ${esc(i.fullName)}،</p>
        <p style="margin:0 0 12px;line-height:1.8">شكراً لتقديمك${i.jobTitleAr ? ` على وظيفة <strong>${esc(i.jobTitleAr)}</strong>` : ""}. تم استلام طلبك وحالته الآن <strong>${esc(status.ar)}</strong>.</p>
        <p style="margin:0 0 12px">رقم المرجع الخاص بك: <strong style="font-family:monospace;direction:ltr;unicode-bidi:isolate">${esc(i.ref)}</strong></p>
        <p style="margin:0 0 4px"><a href="${esc(i.trackUrl)}" style="background:#0f172a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">تتبع حالة طلبك</a></p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
  const text = `Application received — reference ${i.ref}\nTrack: ${i.trackUrl}\n\nتم استلام طلبك — رقم المرجع ${i.ref}\nتتبع: ${i.trackUrl}`;
  return { subject, html, text };
}

function esc(s: string) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

/** Sends through Resend when configured; otherwise reports why it was skipped. */
export async function deliverEmail(to: string, subject: string, html: string, text: string) {
  const key = process.env["RESEND_API_KEY"];
  const from = process.env["CAREERS_FROM_EMAIL"] ?? "Careers <onboarding@resend.dev>";
  if (!key) return { sent: false, reason: "email_not_configured" as const };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend send failed [${res.status}]: ${body}`);
    return { sent: false, reason: "send_failed" as const };
  }
  return { sent: true, reason: null };
}
