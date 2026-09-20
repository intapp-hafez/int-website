import { createServerFn } from "@tanstack/react-start";

export type LearnerRegistration = {
  id: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  completed_at: string | null;
  certificate_no: string | null;
  admin_note: string | null;
  training: {
    title_en: string;
    title_ar: string;
    trainer: string;
    location: string;
    start_date: string | null;
    end_date: string | null;
    kind: string;
  } | null;
};

/**
 * Looks up a learner's registrations by the email they signed up with.
 * Returns only that learner's own rows and no other personal data.
 */
export const lookupLearnerTrainings = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => {
    const email = String(input?.email ?? "").trim().toLowerCase();
    if (!email.includes("@") || email.length < 5) throw new Error("Please enter the email you registered with.");
    return { email };
  })
  .handler(async ({ data }): Promise<LearnerRegistration[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("training_registrations")
      .select(
        "id,status,created_at,approved_at,completed_at,certificate_no,admin_note,email,trainings(title_en,title_ar,trainer,location,start_date,end_date,kind)",
      )
      .ilike("email", data.email)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return ((rows ?? []) as any[]).map((r) => ({
      id: r.id,
      status: r.status,
      created_at: r.created_at,
      approved_at: r.approved_at ?? null,
      completed_at: r.completed_at ?? null,
      certificate_no: r.certificate_no ?? null,
      admin_note: r.admin_note ?? null,
      training: r.trainings ?? null,
    }));
  });
