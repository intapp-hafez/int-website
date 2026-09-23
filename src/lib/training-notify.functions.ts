import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

type ChannelResult = { sent: boolean; reason: string | null };
export type TrainingNotifyResult = {
  learnerEmail: ChannelResult;
  learnerWhatsapp: ChannelResult;
  staffEmails: { to: string; sent: boolean; reason: string | null }[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validate(input: { registrationId: string; kind?: string; note?: string }) {
  const registrationId = String(input?.registrationId ?? "").trim();
  if (!UUID_RE.test(registrationId)) throw new Error("Invalid registration id");
  const kind = String(input?.kind ?? "received");
  if (!["received", "approved", "rejected", "completed"].includes(kind)) throw new Error("Invalid kind");
  return { registrationId, kind: kind as "received" | "approved" | "rejected" | "completed", note: String(input?.note ?? "").slice(0, 500) };
}

/**
 * Public "received" confirmations are built server-side by the email function for a
 * just-created registration. Every other notification requires a staff session and
 * reads the registration under the staff member's own database permissions.
 */
export const notifyTrainingRegistration = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<TrainingNotifyResult> => {
    const site = await import("@/lib/site-email.server");
    const result: TrainingNotifyResult = {
      learnerEmail: { sent: false, reason: "no_email" },
      learnerWhatsapp: { sent: false, reason: "no_phone" },
      staffEmails: [],
    };

    const { data: sess } = await supabase.auth.getSession();
    let isStaff = false;
    if (sess?.session) {
      try {
        const { requireStaff } = await import("@/lib/staff-guard");
        await requireStaff();
        isStaff = true;
      } catch {
        isStaff = false;
      }
    }

    if (!isStaff) {
      if (data.kind !== "received") throw new Error("Forbidden");
      result.learnerEmail = await site.deliverTrainingReceivedEmail(data.registrationId);
      return result;
    }

    const { deliverSms } = await import("@/lib/career-sms.server");
    const tpl = await import("@/lib/training-email.server");
    const { data: reg } = await (supabase as any)
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

    if (reg.email) result.learnerEmail = await site.deliverSiteEmail(reg.email, mail.subject, mail.html, mail.text);

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
      const recipients = [t.trainer_email ?? "", t.notify_emails ?? ""]
        .join(",")
        .split(/[,;\s]+/)
        .map((s: string) => s.trim().toLowerCase())
        .filter((s: string) => s.includes("@"));
      const staff = tpl.renderStaffAlert({
        ...base,
        email: reg.email ?? "",
        phone: reg.phone ?? "",
        gender: reg.gender ?? "",
        city: reg.city ?? "",
        district: reg.district ?? "",
        educationField: reg.education_field ?? "",
      });
      for (const to of Array.from(new Set<string>(recipients))) {
        const r = await site.deliverSiteEmail(to, staff.subject, staff.html, staff.text);
        result.staffEmails.push({ to, ...r });
      }
    }

    return result;
  });
