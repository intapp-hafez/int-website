// Edge firewall: enforces the Security Command Center's WAF mode, blocked IPs
// and per-IP request limit on every incoming request (see src/server.ts).

export type FirewallSettings = {
  waf_mode: "active" | "monitor" | "off";
  blocked_ips: string[];
  rate_limit_rpm: number;
};

const SETTINGS_TTL_MS = 30_000;
const WINDOW_MS = 60_000;

let cached: { at: number; value: FirewallSettings | null } | undefined;
const hits = new Map<string, number[]>();

export function clientIp(request: Request): string | null {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

/** Static files (scripts, images, fonts) don't count toward the visitor limit. */
export function isStaticAsset(pathname: string): boolean {
  return pathname.startsWith("/assets/") || /\.[a-z0-9]{2,5}$/i.test(pathname);
}

export function isBlocked(ip: string, blocked: string[]): boolean {
  return blocked.some((b) => {
    const entry = b.trim();
    if (!entry) return false;
    if (entry.endsWith("*")) return ip.startsWith(entry.slice(0, -1));
    return entry === ip;
  });
}

/** Returns true when this hit is within the limit. */
export function recordHit(ip: string, limit: number, now = Date.now(), store = hits): boolean {
  const list = (store.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  store.set(ip, list);
  if (store.size > 5000) {
    for (const [k, v] of store) if (!v.length || now - v[v.length - 1] >= WINDOW_MS) store.delete(k);
  }
  return list.length <= limit;
}

async function loadSettings(): Promise<FirewallSettings | null> {
  const now = Date.now();
  if (cached && now - cached.at < SETTINGS_TTL_MS) return cached.value;
  let value: FirewallSettings | null = null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("security_settings")
      .select("waf_mode, blocked_ips, rate_limit_rpm")
      .eq("id", "main")
      .maybeSingle();
    if (data) {
      const raw = Array.isArray(data.blocked_ips) ? (data.blocked_ips as any[]) : [];
      value = {
        waf_mode: (["active", "monitor", "off"].includes(data.waf_mode) ? data.waf_mode : "active") as FirewallSettings["waf_mode"],
        blocked_ips: raw.map((b) => (typeof b === "string" ? b : String(b?.ip ?? ""))).filter(Boolean),
        rate_limit_rpm: Math.max(10, Number(data.rate_limit_rpm) || 120),
      };
    }
  } catch (e) {
    console.error("[firewall] settings unavailable, allowing traffic", e);
  }
  cached = { at: now, value };
  return value;
}

function deny(status: number, message: string, extra: Record<string, string> = {}) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>${status}</title></head><body style="font-family:system-ui;text-align:center;padding:4rem"><h1>${status}</h1><p>${message}</p></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...extra } },
  );
}

/** Returns a Response to send instead of the page, or null to let the request through. */
export async function firewall(request: Request): Promise<Response | null> {
  const settings = await loadSettings();
  if (!settings || settings.waf_mode === "off") return null;
  const ip = clientIp(request);
  if (!ip) return null;
  const enforce = settings.waf_mode === "active";

  if (isBlocked(ip, settings.blocked_ips)) {
    console.warn(`[firewall] blocked IP ${ip}${enforce ? "" : " (monitor)"}`);
    if (enforce) return deny(403, "Access from your network has been blocked.");
  }

  const path = new URL(request.url).pathname;
  if (!isStaticAsset(path) && !recordHit(ip, settings.rate_limit_rpm)) {
    console.warn(`[firewall] rate limit hit by ${ip}${enforce ? "" : " (monitor)"}`);
    if (enforce) return deny(429, "Too many requests. Please wait a minute and try again.", { "retry-after": "60" });
  }
  return null;
}
