import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AccessNotifyResult = { sent: boolean; reason: string | null; expired: number };

function validate(input: { requestId: string; kind: "approved" | "denied"; expiresAt?: string | null }) {
  const requestId = String(input?.requestId ?? "").trim();
  if (requestId.length < 16) throw new Error("Invalid request id");
  const kind = input?.kind === "denied" ? "denied" : "approved";
  const expiresAt = input?.expiresAt ? String(input.expiresAt) : null;
  return { requestId, kind: kind as "approved" | "denied", expiresAt };
}

function esc(s: string) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

/**
 * Emails the requester about an access decision and clears grants that have expired.
 * Manager/admin only. Email failures never block the decision.
 */
export const notifyAccessDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<AccessNotifyResult> => {
    const { data: allowed } = await context.supabase.rpc("can_manage_access", { _user_id: context.userId } as any);
    if (!allowed) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deliverSiteEmail } = await import("@/lib/site-email.server");
    const db = supabaseAdmin as any;

    // Housekeeping: revoke anything past its expiry date.
    let expired = 0;
    try {
      const { data: n } = await db.rpc("expire_access_grants");
      expired = Number(n ?? 0);
    } catch {
      expired = 0;
    }

    const { data: req } = await db.from("access_requests").select("*").eq("id", data.requestId).maybeSingle();
    if (!req) return { sent: false, reason: "request_not_found", expired };
    if (!req.user_email || !String(req.user_email).includes("@")) {
      return { sent: false, reason: "no_email", expired };
    }

    const until = data.expiresAt ?? req.expires_at ?? null;
    const untilText = until ? new Date(until).toLocaleString("en-GB") : "no expiry date (permanent)";
    const approved = data.kind === "approved";

    const subject = approved
      ? `Access approved — ${req.page_key}`
      : `Access request declined — ${req.page_key}`;
    const lines = approved
      ? [
          `Hello ${req.user_name || ""},`,
          `Your request for access to "${req.page_key}" has been approved.`,
          `Permissions: ${(req.actions ?? []).join(", ")}`,
          `Valid until: ${untilText}`,
          `You can sign in and use the section right away.`,
        ]
      : [
          `Hello ${req.user_name || ""},`,
          `Your request for access to "${req.page_key}" was not approved.`,
          req.decision_note ? `Note: ${req.decision_note}` : "",
          `If you still need access, please reply to this email with more detail.`,
        ].filter(Boolean);

    const text = lines.join("\n\n");
    const html = `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#0f172a;line-height:1.7">
      <h2 style="margin:0 0 12px;font-size:19px">${esc(subject)}</h2>
      ${lines.map((l) => `<p style="margin:0 0 10px">${esc(l)}</p>`).join("")}
      <p style="margin:18px 0 0;color:#64748b;font-size:13px">Integrated Technics</p>
    </div>`;

    try {
      const r = await deliverSiteEmail(req.user_email, subject, html, text);
      return { sent: r.sent, reason: r.reason, expired };
    } catch (e: any) {
      return { sent: false, reason: e?.message ?? "email_error", expired };
    }
  });

/** Revokes every grant whose expiry has passed. Manager/admin only. */
export const sweepExpiredGrants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ expired: number }> => {
    const { data: allowed } = await context.supabase.rpc("can_manage_access", { _user_id: context.userId } as any);
    if (!allowed) return { expired: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any).rpc("expire_access_grants");
    return { expired: Number(data ?? 0) };
  });
