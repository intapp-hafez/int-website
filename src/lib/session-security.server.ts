import { createClient } from "@supabase/supabase-js";
import { bearerToken } from "./request-security";

/** Revalidate against Auth, not browser storage or a locally decoded JWT. */
export async function verifiedRequestUser(request: Request) {
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Authentication service is not configured");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}