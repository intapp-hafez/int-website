/**
 * Sends mail through the mail account configured in Admin → SMTP.
 * Delegates to the `send-email` Supabase function, which reads `smtp_settings`
 * and relays through nodemailer. Never throws — always reports a reason.
 *
 * This project runs "server functions" in the browser (see src/lib/start-shim.ts),
 * so private server env vars are unavailable here. The publishable project key is
 * enough to call the function — the privileged SMTP work happens inside the
 * function on Supabase's side. Real server runtimes fall back to the
 * service-role key.
 */
export async function deliverSiteEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<{ sent: boolean; reason: string | null }> {
  const proc = typeof process !== "undefined" ? process.env : undefined;
  const url = import.meta.env?.VITE_SUPABASE_URL ?? proc?.["SUPABASE_URL"];
  const key =
    import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ??
    proc?.["SUPABASE_PUBLISHABLE_KEY"] ??
    proc?.["SUPABASE_SERVICE_ROLE_KEY"];
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
