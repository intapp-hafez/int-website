// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.13";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: smtp, error: smtpErr } = await supabaseClient
      .from("smtp_settings")
      .select("*")
      .eq("id", "main")
      .maybeSingle();

    if (smtpErr || !smtp || !smtp.enabled) {
      throw new Error("SMTP is disabled or not configured in settings.");
    }

    const { to, subject, html, text } = await req.json();

    if (!to || !subject) {
      throw new Error("Recipient ('to') and 'subject' are required.");
    }

    const recipients = Array.isArray(to) ? to : to.split(",").map((s: string) => s.trim());
    const isSSL = Number(smtp.port) === 465 || smtp.encryption_type === "ssl" || Boolean(smtp.secure);

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port) || 465,
      secure: isSSL,
      auth: {
        user: smtp.username,
        pass: smtp.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const fromAddress = smtp.from_email || smtp.username;
    const fromName = smtp.from_name || "Integrated Technics";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: recipients.join(", "),
      subject,
      text: text || undefined,
      html: html || undefined,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId, recipients }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
