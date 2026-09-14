/**
 * Sends training alerts over WhatsApp through the Twilio connector gateway.
 * Fails soft — a missing connection or number never blocks a registration.
 */
export type WhatsappResult = { sent: boolean; reason: string | null };

function normalizePhone(raw: string) {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  return digits ? `+${digits}` : null;
}

export async function deliverWhatsapp(to: string, body: string): Promise<WhatsappResult> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];
  const fromRaw = process.env["TRAINING_WHATSAPP_FROM"] ?? process.env["TWILIO_WHATSAPP_FROM"];

  if (!lovableKey || !twilioKey) return { sent: false, reason: "whatsapp_not_connected" };
  if (!fromRaw) return { sent: false, reason: "missing_whatsapp_number" };

  const phone = normalizePhone(to);
  if (!phone) return { sent: false, reason: "invalid_phone" };

  const from = fromRaw.startsWith("whatsapp:") ? fromRaw : `whatsapp:${normalizePhone(fromRaw) ?? fromRaw}`;

  try {
    const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": twilioKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: `whatsapp:${phone}`, From: from, Body: body }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`WhatsApp send failed [${res.status}]: ${text}`);
      return { sent: false, reason: `send_failed_${res.status}` };
    }
    return { sent: true, reason: null };
  } catch (e: any) {
    return { sent: false, reason: e?.message ?? "whatsapp_exception" };
  }
}

/** Short bilingual WhatsApp body for each stage of the training workflow. */
export function renderTrainingWhatsapp(
  i: { fullName: string; titleEn: string; titleAr: string; startDate: string | null; location: string; certificateNo?: string | null },
  kind: "received" | "approved" | "completed",
) {
  const title = i.titleEn || i.titleAr;
  const when = i.startDate ? ` — ${i.startDate}` : "";
  const where = i.location ? ` @ ${i.location}` : "";
  if (kind === "completed") {
    return [
      `Congratulations ${i.fullName}! You completed ${title}.`,
      i.certificateNo ? `Certificate no: ${i.certificateNo}` : "",
      "",
      `تهانينا ${i.fullName}! لقد أتممت ${i.titleAr || title}.`,
      i.certificateNo ? `رقم الشهادة: ${i.certificateNo}` : "",
    ].filter(Boolean).join("\n");
  }
  const head = kind === "approved" ? "Your registration is approved" : "Your registration is confirmed";
  const headAr = kind === "approved" ? "تم اعتماد تسجيلك" : "تم تأكيد تسجيلك";
  return [
    `${head} for ${title}${when}${where}.`,
    "Integrated Technics",
    "",
    `${headAr} في ${i.titleAr || title}${when}${where}.`,
  ].join("\n");
}
