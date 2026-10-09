import { createServerFn } from "@tanstack/react-start";

// The Turnstile SECRET key lives only in the server secret store
// (TURNSTILE_SECRET_KEY). It is never returned to the browser.

export const getTurnstileConfig = createServerFn({ method: "GET" }).handler(async () => {
  const siteKey = process.env.TURNSTILE_SITE_KEY || null;
  const secretConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY);
  return { siteKey, secretConfigured };
});

export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string | null }) => ({
    token: typeof d?.token === "string" ? d.token.slice(0, 4096) : null,
  }))
  .handler(async ({ data }) => {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return { ok: true, enforced: false };
    if (!data.token) return { ok: false, enforced: true };
    const body = new URLSearchParams({ secret, response: data.token });
    try {
      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body,
      });
      const json = (await res.json()) as { success?: boolean };
      return { ok: Boolean(json.success), enforced: true };
    } catch {
      return { ok: false, enforced: true };
    }
  });
