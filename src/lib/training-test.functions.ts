import { createServerFn } from "@tanstack/react-start";

export type TestEmailResult = {
  learner: { to: string; sent: boolean; reason: string | null };
  staff: { to: string; sent: boolean; reason: string | null };
};

function validate(input: { learnerEmail: string; staffEmail: string; trainingId?: string }) {
  const learnerEmail = String(input?.learnerEmail ?? "").trim().toLowerCase();
  const staffEmail = String(input?.staffEmail ?? "").trim().toLowerCase();
  if (!learnerEmail.includes("@")) throw new Error("Enter a valid learner email");
  if (!staffEmail.includes("@")) throw new Error("Enter a valid trainer/manager email");
  return { learnerEmail, staffEmail, trainingId: String(input?.trainingId ?? "") };
}

/** Sends a sample registration confirmation to a learner address and the staff alert to a trainer address. */
export const sendTrainingTestEmails = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<TestEmailResult> => {
    const { deliverSiteEmail } = await import("@/lib/site-email.server");
    const tpl = await import("@/lib/training-email.server");

    let base = {
      fullName: "Test Learner",
      titleEn: "Sample Training Program",
      titleAr: "برنامج تدريبي تجريبي",
      trainer: "Integrated Technics",
      location: "Cairo, Egypt",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null as string | null,
    };

    if (data.trainingId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: t } = await (supabaseAdmin as any)
        .from("trainings")
        .select("title_en,title_ar,trainer,location,start_date,end_date")
        .eq("id", data.trainingId)
        .maybeSingle();
      if (t) {
        base = {
          fullName: "Test Learner",
          titleEn: t.title_en ?? base.titleEn,
          titleAr: t.title_ar ?? base.titleAr,
          trainer: t.trainer ?? "",
          location: t.location ?? "",
          startDate: t.start_date ?? null,
          endDate: t.end_date ?? null,
        } as typeof base;
      }
    }

    const learnerMail = tpl.renderRegistrationReceived(base);
    const staffMail = tpl.renderStaffAlert({
      ...base,
      email: data.learnerEmail,
      phone: "+20 100 000 0000",
      gender: "male",
      city: "Cairo",
      district: "Nasr City",
      educationField: "Information Technology",
    });

    const learner = await deliverSiteEmail(
      data.learnerEmail,
      `[TEST] ${learnerMail.subject}`,
      learnerMail.html,
      learnerMail.text,
    );
    const staff = await deliverSiteEmail(
      data.staffEmail,
      `[TEST] ${staffMail.subject}`,
      staffMail.html,
      staffMail.text,
    );

    return {
      learner: { to: data.learnerEmail, ...learner },
      staff: { to: data.staffEmail, ...staff },
    };
  });
