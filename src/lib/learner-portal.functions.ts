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
  .inputValidator((input: { email: string; phone: string }) => {
    const email = String(input?.email ?? "").trim().toLowerCase().slice(0, 255);
    const phone = String(input?.phone ?? "").trim().slice(0, 40);
    if (!email.includes("@") || email.length < 5) throw new Error("Please enter the email you registered with.");
    if (phone.replace(/\D/g, "").length < 6) throw new Error("Please enter the phone number you registered with.");
    return { email, phone };
  })
  .handler(async ({ data }): Promise<LearnerRegistration[]> => {
    // Requires both email and phone to match; runs under public permissions (no admin key).
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: rows, error } = await (supabase as any).rpc("lookup_learner_trainings", {
      _email: data.email,
      _phone: data.phone,
    });
    if (error) throw new Error("Lookup is temporarily unavailable.");
    return (rows ?? []) as LearnerRegistration[];
  });
