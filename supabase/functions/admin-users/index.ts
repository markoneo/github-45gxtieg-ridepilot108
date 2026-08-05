import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-Admin-Token",
};

const ADMIN_EMAIL = "admin@admin";
const ADMIN_PASSWORD = "ride_pilot_1";
const ADMIN_TOKEN = btoa(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`);

function verifyAdmin(req: Request): boolean {
  return req.headers.get("X-Admin-Token") === ADMIN_TOKEN;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    if (action === "login") {
      const { email, password } = body;
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return new Response(
          JSON.stringify({ success: true, token: ADMIN_TOKEN }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!verifyAdmin(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (action) {
      case "list_users": {
        const allUsers: { id: string; email?: string; created_at: string }[] = [];
        let page = 1;
        const perPage = 1000;
        while (true) {
          const { data: authData, error: authError } =
            await supabaseAdmin.auth.admin.listUsers({ page, perPage });
          if (authError) throw authError;
          allUsers.push(...authData.users);
          if (authData.users.length < perPage) break;
          page++;
        }

        const { data: publicUsers } = await supabaseAdmin
          .from("users")
          .select("id, account_status");

        const statusMap = new Map(
          (publicUsers || []).map((u: { id: string; account_status: string }) => [
            u.id,
            u.account_status,
          ])
        );

        const users = allUsers.map((user) => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          account_status: statusMap.get(user.id) || "active",
        }));

        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_status": {
        const { userId, status } = body;
        if (!userId || !["active", "suspended"].includes(status)) {
          return new Response(
            JSON.stringify({ error: "Invalid parameters" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data: authUser } =
          await supabaseAdmin.auth.admin.getUserById(userId);

        const { error } = await supabaseAdmin.from("users").upsert(
          {
            id: userId,
            email: authUser?.user?.email || "",
            account_status: status,
          },
          { onConflict: "id" }
        );

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
