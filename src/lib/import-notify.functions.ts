import { createServerFn } from "@tanstack/react-start";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails a bulk-CSV import summary (succeeded / failed counts) to an admin. */
export const sendImportSummaryEmail = createServerFn({ method: "POST" })
  .inputValidator((input: { to: string; updated: number; skipped: number; total: number; reasons?: string[] }) => {
    const to = String(input?.to ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(to)) throw new Error("Invalid email address");
    return {
      to,
      updated: Number(input?.updated ?? 0),
      skipped: Number(input?.skipped ?? 0),
      total: Number(input?.total ?? 0),
      reasons: (Array.isArray(input?.reasons) ? input!.reasons : []).slice(0, 20).map((r) => String(r).slice(0, 120)),
    };
  })
  .handler(async ({ data }) => {
    const { deliverEmail } = await import("@/lib/career-email.server");
    const subject = `Bulk CSV import finished — ${data.updated} succeeded, ${data.skipped} failed`;
    const reasonsHtml = data.reasons.length
      ? `<ul>${data.reasons.map((r) => `<li>${r}</li>`).join("")}</ul>`
      : "";
    const html = `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:560px">
        <h2 style="margin:0 0 12px">Bulk CSV import finished</h2>
        <p style="margin:0 0 8px">Rows processed: <strong>${data.total}</strong></p>
        <p style="margin:0 0 4px;color:#059669">Succeeded: <strong>${data.updated}</strong></p>
        <p style="margin:0 0 12px;color:#d97706">Failed / skipped: <strong>${data.skipped}</strong></p>
        ${reasonsHtml}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
        <p style="margin:0;color:#6b7280;font-size:12px">اكتمل استيراد ملف CSV: ${data.updated} ناجح، ${data.skipped} متخطى.</p>
      </div>`;
    const text = `Bulk CSV import finished\nProcessed: ${data.total}\nSucceeded: ${data.updated}\nFailed/skipped: ${data.skipped}\n${data.reasons.join("\n")}`;
    return deliverEmail(data.to, subject, html, text);
  });
