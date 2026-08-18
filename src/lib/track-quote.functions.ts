import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX8_RE = /^[0-9a-f]{8}$/i;

export type TrackedQuote = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  product_name: string;
  product_slug: string;
  items: any;
  lang: string;
  priority: string;
  notes: { id: string; body: string; created_at: string }[];
};

export const trackQuote = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; email?: string }) => {
    let raw = String(input?.id ?? "").trim();
    if (raw.startsWith("#")) raw = raw.slice(1).trim();
    const id = raw.toLowerCase();
    const email = String(input?.email ?? "").trim().toLowerCase();

    // Allow 8-character hex code or full 36-char UUID
    if (!HEX8_RE.test(id) && !UUID_RE.test(id)) {
      throw new Error("Invalid quote number. Please enter your 8-character quote reference.");
    }
    if (email && !email.includes("@")) throw new Error("Invalid email");
    return { id, email: email || undefined };
  })
  .handler(async ({ data }): Promise<TrackedQuote> => {
    let query = supabase
      .from("leads")
      .select("id,status,created_at,updated_at,full_name,email,phone,company,message,product_name,product_slug,items,lang,priority");

    if (HEX8_RE.test(data.id)) {
      // 8-character prefix match using UUID range query
      query = query
        .gte("id", `${data.id}-0000-0000-0000-000000000000`)
        .lte("id", `${data.id}-ffff-ffff-ffff-ffffffffffff`)
        .order("created_at", { ascending: false })
        .limit(1);
    } else {
      query = query.eq("id", data.id).limit(1);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const lead = rows?.[0];
    if (!lead) throw new Error("No quote found with that number");

    if (data.email && String(lead.email).trim().toLowerCase() !== data.email) {
      throw new Error("Email does not match this quote");
    }

    const { data: notes } = await supabase
      .from("lead_notes" as any)
      .select("id,body,created_at")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: true });

    return { ...(lead as any), notes: (notes as any) ?? [] };
  });