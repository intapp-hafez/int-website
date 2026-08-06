import { STATUS_LABEL, type CareerStatus } from "@/lib/career-workflow";

export type SmsInput = {
  ref: string;
  fullName: string;
  phone: string;
  jobTitleEn: string;
  jobTitleAr: string;
  trackUrl: string;
  status: CareerStatus;
};

export type NotifyResult = { sent: boolean; channel: "sms" | "whatsapp" | null; reason: string | null };

/** Bilingual short message with reference number + tracking link. */
export function renderApplicationSms(i: SmsInput) {
  const status = STATUS_LABEL[i.status] ?? STATUS_LABEL.new;
  const job = i.jobTitleEn ? ` for ${i.jobTitleEn}` : "";
  const jobAr = i.jobTitleAr ? ` على وظيفة ${i.jobTitleAr}` : "";
  return [
    `Application received${job}. Ref: ${i.ref} (${status.en}).`,
    `Track: ${i.trackUrl}`,
    "",
    `تم استلام طلبك${jobAr}. رقم المرجع: ${i.ref} (${status.ar}).`,
    `تتبع الطلب: ${i.trackUrl}`,
  ].join("\n");
}

/** E.164 normalisation — digits only, keeps a single leading "+". */
export function normalizePhone(raw: string) {
  const trimmed = String(raw ?? "").trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `+${digits}`;
}

/**
 * Sends an SMS or WhatsApp message through the Twilio connector gateway.
 * Skips gracefully (never throws) when the connector or numbers aren't configured.
 */
export async function deliverSms(to: string, body: string): Promise<NotifyResult> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];
  const channel = (process.env["CAREERS_NOTIFY_CHANNEL"] ?? "sms").toLowerCase() === "whatsapp"
    ? "whatsapp" as const
    : "sms" as const;
  const from = channel === "whatsapp"
    ? process.env["TWILIO_WHATSAPP_FROM"]
    : process.env["TWILIO_FROM_NUMBER"];

  if (!lovableKey || !twilioKey) return { sent: false, channel, reason: "twilio_not_connected" };
  if (!from) return { sent: false, channel, reason: "missing_from_number" };

  const phone = normalizePhone(to);
  if (!phone) return { sent: false, channel, reason: "invalid_phone" };

  const prefix = channel === "whatsapp" ? "whatsapp:" : "";
  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: `${prefix}${phone}`,
      From: from.startsWith("whatsapp:") || channel === "sms" ? from : `whatsapp:${from}`,
      Body: body,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Twilio send failed [${res.status}]: ${text}`);
    return { sent: false, channel, reason: `send_failed_${res.status}` };
  }
  return { sent: true, channel, reason: null };
}
