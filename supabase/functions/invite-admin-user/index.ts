import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify caller authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role, permissions")
      .eq("user_id", user.id)
      .maybeSingle();

    const isAuthorized = roleData && (
      roleData.role === "admin" ||
      roleData.role === "manager" ||
      roleData.permissions?.users?.add === true
    );

    if (roleError || !isAuthorized) {
      throw new Error("You do not have permission to invite new staff members");
    }

    const { email, password, name, role } = await req.json();

    if (!email || !password || !name || !role) {
      throw new Error("Missing required fields (email, password, name, role)");
    }

    // 1. Create User in Auth
    const { data: newAuthUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      email_confirm: true,
      user_metadata: { name: name.trim(), role: role.trim() }
    });

    if (createUserError) {
      throw new Error(createUserError.message || "Failed to create user account");
    }
    const newUserId = newAuthUser.user.id;

    // 2. Insert into user_roles (upsert by user_id)
    const { error: insertRoleError } = await supabaseClient
      .from("user_roles")
      .upsert({
        user_id: newUserId,
        role: role.trim()
      }, { onConflict: "user_id" });

    if (insertRoleError) {
      console.error("Role assign error:", insertRoleError);
      await supabaseClient.auth.admin.deleteUser(newUserId);
      throw new Error("Failed to assign role to new user. Creation aborted.");
    }

    return new Response(
      JSON.stringify({ success: true, user: newAuthUser.user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Invite error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
