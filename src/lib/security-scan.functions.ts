import { createServerFn } from "@tanstack/react-start";

// Live, read-only checks against the published site. The target is fixed
// (never user-supplied) so this cannot be abused to probe other hosts.
const SITE = "https://nexus-solution-craft.lovable.app";
const HOST = new URL(SITE).hostname;

export type LiveCheck = { rule: string; ok: boolean; evidence: string };

async function dnsTxt(name: string): Promise<string[]> {
  try {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`, {
      headers: { accept: "application/dns-json" },
    });
    const j = (await r.json()) as { Answer?: { data: string }[] };
    return (j.Answer ?? []).map((a) => a.data.replace(/"/g, ""));
  } catch {
    return [];
  }
}

export const runLiveSecurityChecks = createServerFn({ method: "POST" }).handler(async () => {
  const checks: LiveCheck[] = [];
  let res: Response | null = null;
  try {
    res = await fetch(SITE, { redirect: "manual" });
  } catch (e) {
    checks.push({ rule: "tls", ok: false, evidence: `Site unreachable over HTTPS: ${(e as Error).message}` });
  }
  if (res) {
    const h = res.headers;
    checks.push({ rule: "tls", ok: true, evidence: `HTTPS responded with status ${res.status}.` });
    const hsts = h.get("strict-transport-security");
    const missing = ["x-content-type-options", "referrer-policy", "x-frame-options"].filter((k) => !h.get(k));
    if (!hsts) missing.push("strict-transport-security");
    checks.push({
      rule: "headers",
      ok: missing.length === 0,
      evidence: missing.length ? `Missing headers: ${missing.join(", ")}` : "All baseline security headers present.",
    });
    const csp = h.get("content-security-policy");
    checks.push({
      rule: "csp",
      ok: Boolean(csp) && !/unsafe-eval/.test(csp ?? ""),
      evidence: !csp ? "No Content-Security-Policy header." : /unsafe-eval/.test(csp) ? "CSP allows 'unsafe-eval'." : "CSP present.",
    });
    const cors = h.get("access-control-allow-origin");
    checks.push({ rule: "cors", ok: cors !== "*", evidence: cors === "*" ? "Homepage allows any origin (CORS *)." : "No wildcard CORS on homepage." });
    const cookies = h.get("set-cookie") ?? "";
    const weak = cookies && !(/secure/i.test(cookies) && /samesite/i.test(cookies));
    checks.push({ rule: "cookies", ok: !weak, evidence: weak ? "Cookie set without Secure/SameSite." : "No insecure cookies on homepage." });
    const html = res.status < 300 ? await res.text() : "";
    const mixed = /(src|href)=["']http:\/\//i.test(html);
    checks.push({ rule: "mixed-content", ok: !mixed, evidence: mixed ? "Page loads resources over plain http://." : "No mixed content found." });
  }
  const spf = (await dnsTxt(HOST)).some((t) => t.startsWith("v=spf1"));
  const dmarc = (await dnsTxt(`_dmarc.${HOST}`)).some((t) => t.startsWith("v=DMARC1"));
  checks.push({
    rule: "dns",
    ok: spf && dmarc,
    evidence: `SPF ${spf ? "found" : "missing"}, DMARC ${dmarc ? "found" : "missing"} for ${HOST}.`,
  });
  const turnstile = Boolean(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
  checks.push({
    rule: "captcha-missing",
    ok: turnstile,
    evidence: turnstile ? "Turnstile bot check is configured." : "Turnstile keys not set — sign-in uses the test key.",
  });
  return { target: SITE, checks };
});
