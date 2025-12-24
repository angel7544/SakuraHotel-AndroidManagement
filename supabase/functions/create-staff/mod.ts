// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare Deno to avoid TypeScript errors in non-Deno environments
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


serve(async (req: Request) => { 
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!req.headers.get("content-type")?.includes("application/json")) {
    return new Response(
      JSON.stringify({ error: "Invalid content type" }),
      { status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { email, password, name, role, phone, hotel_id, image_url } = body;

    if (!email || !password || !name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Create User in Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: role === "Manager" ? "owner" : "staff", // Managers are owners
      },
      app_metadata: {
        roles: role === "Manager" ? ["owner"] : ["staff"],
      }
    });

    if (userError) {
      return new Response(JSON.stringify({ error: userError.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (!userData.user) {
        return new Response(JSON.stringify({ error: "Failed to create user" }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // 2. Insert into staff table
    const { error: dbError } = await supabase.from("staff").insert([
      {
        user_id: userData.user.id,
        name,
        role,
        email,
        phone,
        status: "Active",
        hotel_id: hotel_id || null,
        image_url: image_url || null,
      },
    ]);

    if (dbError) {
      // Cleanup: delete the user if DB insert fails? 
      // For now, let's just report the error. 
      // Ideally we should delete the auth user to keep consistency.
      await supabase.auth.admin.deleteUser(userData.user.id);
      return new Response(JSON.stringify({ error: "Database error: " + dbError.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ ok: true, user: userData.user }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message || "Internal Server Error" }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
