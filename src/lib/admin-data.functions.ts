import { createServerFn } from "@tanstack/react-start";

// NOTE: Demo admin panel — these server functions intentionally bypass RLS
// using the service-role client so the seeded data is visible without
// requiring a real authenticated Supabase admin session.

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("id,created_at,full_name,email,phone,company,status,message,items,product_name,lang")
    .eq("source", "cart_checkout")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
});

export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("leads").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row as any;
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("leads").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listClientQuotes = createServerFn({ method: "GET" })
  .inputValidator((d: { email: string }) => d)
  .handler(async ({ data }) => {
    const email = String(data.email ?? "").trim().toLowerCase();
    if (!email) return [] as any[];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("leads")
      .select("id,created_at,updated_at,full_name,email,company,status,product_name,product_slug,items,source,priority,lang")
      .ilike("email", email)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as any[];
  });

export const listApplications = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("career_applications")
    .select("id, ref, full_name, email, phone, status, created_at, job_id, years_experience, city, country, career_jobs(title_en)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
});

export const listApplicationsFull = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("career_applications")
    .select("*, career_jobs(title_en,title_ar,location_en)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
});

export const getApplication = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: app, error: e1 }, { data: events, error: e2 }] = await Promise.all([
      supabaseAdmin.from("career_applications")
        .select("*, career_jobs(title_en,title_ar,location_en)")
        .eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("career_application_events")
        .select("*").eq("application_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return { app: app as any, events: (events ?? []) as any[] };
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; from: string | null; to: string; note?: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("career_applications").update({ status: data.to as any }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("career_application_events").insert({
      application_id: data.id,
      from_status: (data.from ?? null) as any,
      to_status: data.to as any,
      note: data.note ?? "",
    });
    return { ok: true };
  });

export const updateApplicationNotes = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; notes: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("career_applications").update({ internal_notes: data.notes }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateApplicationEvent = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; note: string; created_at: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("career_application_events")
      .update({ note: data.note, created_at: data.created_at }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });