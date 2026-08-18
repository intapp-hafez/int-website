import { createServerFn } from "@tanstack/react-start";
import { createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Bilingual = z.object({ en: z.string().max(2000), ar: z.string().max(2000) });
const AboutValue = z.object({ title: Bilingual, desc: Bilingual });
const TeamMember = z.object({ key: z.string().min(1).max(64), name: Bilingual, role: Bilingual });

const AboutContentSchema = z.object({
  eyebrow: Bilingual,
  title: Bilingual,
  sub: Bilingual,
  overviewT: Bilingual,
  overviewD: Bilingual,
  visionT: Bilingual,
  visionD: Bilingual,
  missionT: Bilingual,
  missionD: Bilingual,
  valuesT: Bilingual,
  values: z.array(AboutValue).length(3),
  certificationsT: Bilingual,
  certificationsSub: Bilingual,
  certifications: z.array(z.string().min(1).max(120)).max(50),
  ownerEyebrow: Bilingual,
  ownerTitle: Bilingual,
  ownerName: Bilingual,
  ownerRole: Bilingual,
  ownerBio: Bilingual,
  teamTitle: Bilingual,
  teamSub: Bilingual,
  team: z.array(TeamMember).max(24),
});

const SaveSchema = z.object({
  data: AboutContentSchema,
  hero_image_url: z.string().url().nullable(),
  hero_focal_x: z.number().min(0).max(100),
  hero_focal_y: z.number().min(0).max(100),
  hero_zoom: z.number().min(1).max(3),
  hero_mirror_rtl: z.boolean(),
});

// Attaches the Supabase session bearer token to the outgoing server-fn request
// so requireSupabaseAuth can validate the caller.
const attachSupabaseBearer = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next(token ? { headers: { Authorization: `Bearer ${token}` } } : {});
});

export const saveAboutContent = createServerFn({ method: "POST" })
  .middleware([attachSupabaseBearer, requireSupabaseAuth])
  .inputValidator((input) => SaveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) {
      console.error("[about] role check failed", roleErr);
      throw new Error("Permission check failed");
    }
    if (!roleRow) {
      throw new Error("Admin role required to edit About content");
    }
    const { error } = await supabase
      .from("about_content")
      .upsert({
        id: "main",
        data: data.data as any,
        hero_image_url: data.hero_image_url,
        hero_focal_x: data.hero_focal_x,
        hero_focal_y: data.hero_focal_y,
        hero_zoom: data.hero_zoom,
        hero_mirror_rtl: data.hero_mirror_rtl,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      console.error("[about] save failed", error);
      throw new Error("Failed to save About content");
    }
    return { ok: true };
  });
