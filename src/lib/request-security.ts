/** Request checks do not replace Supabase's signature and user validation. */
export function bearerToken(header: string | null): string | null {
  if (!header || !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(header) || header.length > 16384) return null;
  return header.slice(7);
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  return !origin || origin === new URL(request.url).origin;
}