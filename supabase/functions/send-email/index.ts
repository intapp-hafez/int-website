// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.13";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });
}

/** Server-built message for anonymous callers — no caller-supplied recipient or content. */
async function buildAnonymousTemplate(db: any, body: any) {
  if (body?.template !== "training_registration_received") return null;
  const id = String(body?.registration_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data: reg } = await db
    .from("training_registrations")
    .select("email, full_name, created_at, trainings(title_en, title_ar)")
    .eq("id", id)
    .maybeSingle();
  if (!reg?.email || !EMAIL_RE.test(reg.email)) return null;
  // Only for fresh registrations, so the confirmation can't be replayed later.
  if (Date.now() - new Date(reg.created_at).getTime() > 30 * 60 * 1000) return null;
  const t = reg.trainings ?? {};
  const subject = `Registration received — ${t.title_en ?? "Training"}`;
  const text = `Hello ${reg.full_name},\n\nWe received your registration for "${t.title_en ?? ""}". Our team will confirm your seat shortly.\n\nتم استلام تسجيلك في "${t.title_ar ?? ""}". سيقوم فريقنا بتأكيد مقعدك قريبًا.`;
  const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px"><p>Hello ${esc(reg.full_name)},</p><p>We received your registration for <strong>${esc(t.title_en)}</strong>. Our team will confirm your seat shortly.</p><p dir="rtl">تم استلام تسجيلك في <strong>${esc(t.title_ar)}</strong>. سيقوم فريقنا بتأكيد مقعدك قريبًا.</p></div>`;
  return { recipients: [reg.email], subject, html, text };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const body = await req.json().catch(() => ({}));

    // Identify caller
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    let userId: string | null = null;
    if (token) {
      const { data } = await db.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    let message: { recipients: string[]; subject: string; html?: string; text?: string } | null = null;

    if (!userId) {
      message = await buildAnonymousTemplate(db, body);
      if (!message) return json({ success: false, error: "Unauthorized" }, 401);
    } else {
      const { to, subject, html, text } = body ?? {};
      const recipients = (Array.isArray(to) ? to : String(to ?? "").split(","))
        .map((s: string) => String(s).trim().toLowerCase())
        .filter(Boolean);
      if (!recipients.length || !subject || recipients.length > 20 || !recipients.every((r) => EMAIL_RE.test(r))) {
        return json({ success: false, error: "Valid recipients and subject are required." }, 400);
      }
      const { data: roles } = await db.from("user_roles").select("role").eq("user_id", userId);
      const isStaff = (roles ?? []).some((r: any) => !["user", "client_user"].includes(r.role));
      if (!isStaff) {
        // Signed-in clients may only notify the configured support mailboxes.
        const [{ data: cats }, { data: inv }] = await Promise.all([
          db.from("support_categories").select("responsible_emails"),
          db.from("support_invoice_recipients").select("email").eq("active", true),
        ]);
        const allowed = new Set<string>();
        (cats ?? []).forEach((c: any) =>
          String(c.responsible_emails ?? "").split(/[,;\s]+/).forEach((e) => e && allowed.add(e.trim().toLowerCase())),
        );
        (inv ?? []).forEach((r: any) => r.email && allowed.add(String(r.email).trim().toLowerCase()));
        if (!recipients.every((r) => allowed.has(r))) return json({ success: false, error: "Forbidden recipient" }, 403);
      }
      message = { recipients, subject: String(subject).slice(0, 300), html: html || undefined, text: text || undefined };
    }

    const { data: smtp, error: smtpErr } = await db.from("smtp_settings").select("*").eq("id", "main").maybeSingle();
    if (smtpErr || !smtp || !smtp.enabled) return json({ success: false, error: "Email is not configured." }, 400);

    const isSSL = Number(smtp.port) === 465 || smtp.encryption_type === "ssl" || Boolean(smtp.secure);
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port) || 465,
      secure: isSSL,
      auth: { user: smtp.username, pass: smtp.password },
    });

    const fromAddress = smtp.from_email || smtp.username;
    const fromName = String(smtp.from_name || "Integrated Technics").replace(/["<>]/g, "");
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: message.recipients.join(", "),
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("send-email error", error);
    return json({ success: false, error: "Email could not be sent." }, 500);
  }
});
