import { createServerFn } from "@tanstack/react-start";

type ChannelResult = { sent: boolean; reason: string | null };
export type TrainingNotifyResult = {
  learnerEmail: ChannelResult;
  learnerWhatsapp: ChannelResult;
  staffEmails: { to: string; sent: boolean; reason: string | null }[];
};

const UUID_RE = /^[0-9a-fA-F-]{16,40}$/;

function validate(input: { registrationId: string; kind?: string; note?: string }) {
  const registrationId = String(input?.registrationId ?? "").trim();
  if (!UUID_RE.test(registrationId)) throw new Error("Invalid registration id");
  const kind = String(input?.kind ?? "received");
  if (!["received", "approved", "rejected"].includes(kind)) throw new Error("Invalid kind");
  return { registrationId, kind: kind as "received" | "approved" | "rejected", note: String(input?.note ?? "").slice(0, 500) };
}

/**
 * Emails + WhatsApps the learner, and emails the trainer/managers.
 * Every channel fails soft so a delivery outage never blocks the registration.
 */
export const notifyTrainingRegistration = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<TrainingNotifyResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deliverEmail } = await import("@/lib/career-email.server");
    const { deliverSms } = await import("@/lib/career-sms.server");
    const tpl = await import("@/lib/training-email.server");

    const db = supabaseAdmin as any;
    const { data: reg } = await db
      .from("training_registrations")
      .select("*, trainings(title_en,title_ar,trainer,trainer_email,notify_emails,location,start_date,end_date)")
      .eq("id", data.registrationId)
      .maybeSingle();
    if (!reg) throw new Error("Registration not found");

    const t = reg.trainings ?? {};
    const base = {
      fullName: reg.full_name ?? "",
      titleEn: t.title_en ?? "",
      titleAr: t.title_ar ?? "",
      trainer: t.trainer ?? "",
      location: t.location ?? "",
      startDate: t.start_date ?? null,
      endDate: t.end_date ?? null,
    };

    const mail =
      data.kind === "approved"
        ? tpl.renderRegistrationApproved(base)
        : data.kind === "rejected"
          ? tpl.renderRegistrationRejected(base, data.note)
          : tpl.renderRegistrationReceived(base);

    const result: TrainingNotifyResult = {
      learnerEmail: { sent: false, reason: "no_email" },
      learnerWhatsapp: { sent: false, reason: "no_phone" },
      staffEmails: [],
    };

    if (reg.email) {
      try {
        const r = await deliverEmail(reg.email, mail.subject, mail.html, mail.text);
        result.learnerEmail = { sent: r.sent, reason: r.reason };
      } catch (e: any) {
        result.learnerEmail = { sent: false, reason: e?.message ?? "email_error" };
      }
    }

    if (reg.phone && data.kind !== "rejected") {
      try {
        const body = tpl.renderLearnerSms(base, data.kind === "approved" ? "approved" : "received");
        const r = await deliverSms(reg.phone, body);
        result.learnerWhatsapp = { sent: r.sent, reason: r.reason };
      } catch (e: any) {
        result.learnerWhatsapp = { sent: false, reason: e?.message ?? "sms_error" };
      }
    }

    if (data.kind === "received") {
      const recipients = [t.trainer_email ?? "", t.notify_emails ?? "", process.env["TRAINING_NOTIFY_EMAILS"] ?? ""]
        .join(",")
        .split(/[,;\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.includes("@"));
      const staff = tpl.renderStaffAlert({
        ...base,
        email: reg.email ?? "",
        phone: reg.phone ?? "",
        gender: reg.gender ?? "",
        city: reg.city ?? "",
        district: reg.district ?? "",
        educationField: reg.education_field ?? "",
      });
      for (const to of Array.from(new Set(recipients))) {
        try {
          const r = await deliverEmail(to, staff.subject, staff.html, staff.text);
          result.staffEmails.push({ to, sent: r.sent, reason: r.reason });
        } catch (e: any) {
          result.staffEmails.push({ to, sent: false, reason: e?.message ?? "email_error" });
        }
      }
    }

    return result;
  });
