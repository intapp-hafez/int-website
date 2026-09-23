/**
 * Sends mail through the mail account configured in Admin → SMTP by calling the
 * `send-email` Supabase function with the signed-in user's session. The function
 * checks the caller's role before sending. Never throws — always reports a reason.
 */
import { supabase } from "@/integrations/supabase/client";

async function callSendEmail(payload: Record<string, unknown>): Promise<{ sent: boolean; reason: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", { body: payload });
    if (error || (data && data.success === false)) {
      const reason = error?.message ?? data?.error ?? "smtp_error";
      console.error("send-email failed:", reason);
      return { sent: false, reason: String(reason).slice(0, 200) };
    }
    return { sent: true, reason: null };
  } catch (e: any) {
    console.error("send-email exception", e);
    return { sent: false, reason: e?.message ?? "smtp_exception" };
  }
}

export async function deliverSiteEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<{ sent: boolean; reason: string | null }> {
  if (!to || !to.includes("@")) return { sent: false, reason: "invalid_recipient" };
  return callSendEmail({ to, subject, html, text });
}

/** Anonymous-safe: the server builds the confirmation for a just-created registration. */
export async function deliverTrainingReceivedEmail(registrationId: string) {
  return callSendEmail({ template: "training_registration_received", registration_id: registrationId });
}
