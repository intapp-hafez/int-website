import { supabase } from "@/integrations/supabase/client";

export type IdentitySecurityCheck = {
  rule: string;
  label: string;
  labelAr: string;
  ok: boolean | null;
  evidence: string;
};

export function rejectedCredential(error: { status?: number } | null): boolean | null {
  if (!error) return false;
  // Network failures and provider outages are not successful protection checks.
  return error.status === 401 || error.status === 403 ? true : null;
}

export async function runIdentitySecurityChecks(): Promise<IdentitySecurityCheck[]> {
  const results: IdentitySecurityCheck[] = [];
  const probes = [
    { token: "invalid-security-audit-token", label: "Malformed token rejection", labelAr: "رفض التوكن غير الصالح" },
    { token: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhdWRpdCIsImV4cCI6MX0.", label: "Unsigned token rejection", labelAr: "رفض التوكن غير الموقّع" },
    { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJleHAiOjF9.Zm9yZ2Vk", label: "Forged token rejection", labelAr: "رفض التوكن المزوّر" },
  ];
  for (const probe of probes) {
    const { error } = await supabase.auth.getUser(probe.token);
    const ok = rejectedCredential(error);
    results.push({ rule: "jwt-weak", label: probe.label, labelAr: probe.labelAr, ok,
      evidence: ok === true ? `Auth API rejected the credential (HTTP ${error?.status}).` : ok === false ? "Auth API accepted an invalid credential." : "Provider response did not establish rejection; check unavailable." });
  }
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    results.push({ rule: "session", label: "Current session validation", labelAr: "التحقق من الجلسة الحالية", ok: null, evidence: "No signed-in session available to revalidate." });
  } else {
    const { data, error } = await supabase.auth.getUser(sessionData.session.access_token);
    results.push({ rule: "session", label: "Current session validation", labelAr: "التحقق من الجلسة الحالية", ok: error ? (error.status === 401 || error.status === 403 ? false : null) : Boolean(data.user), evidence: error ? "Current session could not be verified by Auth." : "Current identity revalidated by Supabase Auth; no token included in this report." });
  }
  results.push({ rule: "session", label: "Session expiry & refresh rotation", labelAr: "انتهاء الجلسات وتدوير توكن التحديث", ok: null, evidence: "Hosted Auth settings have not been read. Idle timeout, refresh reuse protection, and revocation remain unverified." });
  results.push({ rule: "broken-access", label: "Application API authorization", labelAr: "صلاحيات واجهات التطبيق", ok: null, evidence: "This app uses a browser-side Start shim. Server middleware is not enforced by this configuration; a trusted server deployment and role/ownership tests are required." });
  return results;
}