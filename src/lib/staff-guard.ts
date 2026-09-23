import { supabase } from "@/integrations/supabase/client";

/** Throws unless the current session belongs to a staff member (any non-client role). */
export async function requireStaff(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const uid = data?.user?.id;
  if (!uid) throw new Error("Unauthorized");
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
  const ok = (roles ?? []).some((r: any) => !["user", "client_user"].includes(String(r.role)));
  if (!ok) throw new Error("Forbidden");
  return uid;
}

export const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
