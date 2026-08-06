import { createServerFn } from "@tanstack/react-start";
import type { CareerStatus } from "@/lib/career-workflow";

export type TrackedApplication = {
  ref: string;
  status: CareerStatus;
  created_at: string;
  updated_at: string;
  full_name: string;
  email_masked: string;
  job_title_en: string;
  job_title_ar: string;
  job_location_en: string;
  events: { id: string; to_status: CareerStatus; from_status: CareerStatus | null; note: string; created_at: string }[];
};

const REF_RE = /^[A-Za-z0-9-]{4,40}$/;

function maskEmail(email: string) {
  const [user = "", domain = ""] = String(email).split("@");
  const head = user.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export const trackApplication = createServerFn({ method: "POST" })
  .inputValidator((input: { ref: string; email?: string }) => {
    const ref = String(input?.ref ?? "").trim().toUpperCase();
    const email = String(input?.email ?? "").trim().toLowerCase();
    if (!REF_RE.test(ref)) throw new Error("Invalid reference number");
    if (email && !email.includes("@")) throw new Error("Invalid email");
    return { ref, email: email || undefined };
  })
  .handler(async ({ data }): Promise<TrackedApplication> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app, error } = await supabaseAdmin
      .from("career_applications")
      .select("id,ref,status,created_at,updated_at,full_name,email,career_jobs(title_en,title_ar,location_en)")
      .ilike("ref", data.ref)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!app) throw new Error("No application found with that reference number");
    if (data.email && String((app as any).email).trim().toLowerCase() !== data.email) {
      throw new Error("Email does not match this application");
    }
    const { data: events } = await supabaseAdmin
      .from("career_application_events")
      .select("id,to_status,from_status,note,created_at")
      .eq("application_id", (app as any).id)
      .order("created_at", { ascending: true });
    const job = (app as any).career_jobs ?? {};
    return {
      ref: (app as any).ref,
      status: (app as any).status,
      created_at: (app as any).created_at,
      updated_at: (app as any).updated_at,
      full_name: (app as any).full_name,
      email_masked: maskEmail((app as any).email),
      job_title_en: job.title_en ?? "",
      job_title_ar: job.title_ar ?? "",
      job_location_en: job.location_en ?? "",
      events: ((events as any[]) ?? []) as TrackedApplication["events"],
    };
  });

/** Sends the bilingual receipt email for a submitted application. */
export const sendApplicationConfirmation = createServerFn({ method: "POST" })
  .inputValidator((input: { ref: string; origin: string }) => {
    const ref = String(input?.ref ?? "").trim().toUpperCase();
    if (!REF_RE.test(ref)) throw new Error("Invalid reference number");
    return { ref, origin: String(input?.origin ?? "").slice(0, 200) };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { renderConfirmationEmail, deliverEmail } = await import("@/lib/career-email.server");
    const { data: app } = await supabaseAdmin
      .from("career_applications")
      .select("ref,status,full_name,email,career_jobs(title_en,title_ar)")
      .ilike("ref", data.ref)
      .maybeSingle();
    if (!app) return { sent: false, reason: "not_found" as const };
    const job = (app as any).career_jobs ?? {};
    const trackUrl = `${data.origin.replace(/\/$/, "")}/track-application?ref=${encodeURIComponent((app as any).ref)}`;
    const mail = renderConfirmationEmail({
      ref: (app as any).ref,
      fullName: (app as any).full_name,
      email: (app as any).email,
      jobTitleEn: job.title_en ?? "",
      jobTitleAr: job.title_ar ?? "",
      status: (app as any).status,
      trackUrl,
    });
    return deliverEmail((app as any).email, mail.subject, mail.html, mail.text);
  });

/** Sends the SMS / WhatsApp receipt (reference number + tracking link). */
export const sendApplicationSms = createServerFn({ method: "POST" })
  .inputValidator((input: { ref: string; origin: string }) => {
    const ref = String(input?.ref ?? "").trim().toUpperCase();
    if (!REF_RE.test(ref)) throw new Error("Invalid reference number");
    return { ref, origin: String(input?.origin ?? "").slice(0, 200) };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { renderApplicationSms, deliverSms } = await import("@/lib/career-sms.server");
    const { data: app } = await supabaseAdmin
      .from("career_applications")
      .select("ref,status,full_name,phone,career_jobs(title_en,title_ar)")
      .ilike("ref", data.ref)
      .maybeSingle();
    if (!app) return { sent: false, channel: null, reason: "not_found" as const };
    const phone = (app as any).phone as string;
    if (!phone) return { sent: false, channel: null, reason: "no_phone" as const };
    const job = (app as any).career_jobs ?? {};
    const trackUrl = `${data.origin.replace(/\/$/, "")}/track-application?ref=${encodeURIComponent((app as any).ref)}`;
    const body = renderApplicationSms({
      ref: (app as any).ref,
      fullName: (app as any).full_name,
      phone,
      jobTitleEn: job.title_en ?? "",
      jobTitleAr: job.title_ar ?? "",
      status: (app as any).status,
      trackUrl,
    });
    return deliverSms(phone, body);
  });
