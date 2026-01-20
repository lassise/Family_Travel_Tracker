import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mapboxToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ error: "Mapbox token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mapbox public token is safe to return without auth.
    // We still attempt a lightweight auth verification when a Bearer token is present,
    // but we will NOT block map rendering if verification fails.
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (authHeader) {
      const [scheme, jwt] = authHeader.split(/\s+/);
      if (scheme === "Bearer" && jwt) {
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

        if (serviceRoleKey && supabaseUrl) {
          try {
            const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
            const { error } = await supabaseAdmin.auth.getUser(jwt);
            if (error) console.warn("Auth verify failed (non-blocking):", error);
          } catch (e) {
            console.warn("Auth verify threw (non-blocking):", e);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ token: mapboxToken }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("get-mapbox-token error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
