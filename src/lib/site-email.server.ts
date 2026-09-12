/**
 * Sends mail through the mail account configured in Admin → SMTP.
 * Delegates to the `send-email` Supabase function, which reads `smtp_settings`
 * and relays through nodemailer. Never throws — always reports a reason.
 */
export async function deliverSiteEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<{ sent: boolean; reason: string | null }> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return { sent: false, reason: "supabase_not_configured" };
  if (!to || !to.includes("@")) return { sent: false, reason: "invalid_recipient" };

  try {
    const res = await fetch(`${url}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ to, subject, html, text }),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`send-email failed [${res.status}]: ${body}`);
      return { sent: false, reason: `smtp_error_${res.status}: ${body.slice(0, 200)}` };
    }
    return { sent: true, reason: null };
  } catch (e: any) {
    console.error("send-email exception", e);
    return { sent: false, reason: e?.message ?? "smtp_exception" };
  }
}
