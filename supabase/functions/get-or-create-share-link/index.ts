import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Generate a cryptographically secure 32-char hex token
function generateSecureToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Step 1: Authenticate the user from the request JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with anon key to validate the user's JWT
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ ok: false, error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

    // Step 2: Parse the request body for share options
    let body: {
      include_countries?: boolean;
      include_stats?: boolean;
      include_states?: boolean;
      include_timeline?: boolean;
    } = {};

    try {
      body = await req.json();
    } catch {
      // Default to all true if no body provided
      body = {};
    }

    const includeCountries = body.include_countries !== false;
    const includeStats = body.include_stats !== false;
    const includeStates = body.include_states !== false;
    const includeTimeline = body.include_timeline !== false;
    // IMPORTANT: include_memories maps to include_timeline (used by get-public-dashboard)
    const includeMemories = includeTimeline;

    console.log("Share options:", {
      includeCountries,
      includeStats,
      includeStates,
      includeTimeline,
      includeMemories,
    });

    // Step 3: Use service role for DB writes to bypass RLS
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 4: Look for existing active share link for this user
    const { data: existingLink, error: fetchError } = await serviceClient
      .from("share_links")
      .select("*")
      .eq("owner_user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ ok: false, error: "Database error: " + fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let token: string;
    let created = false;

    if (existingLink) {
      // Update existing link with new settings, keep the same token
      token = existingLink.token;
      console.log("Updating existing share link with token:", token);

      const { error: updateError } = await serviceClient
        .from("share_links")
        .update({
          include_countries: includeCountries,
          include_stats: includeStats,
          include_memories: includeMemories,
        })
        .eq("id", existingLink.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ ok: false, error: "Failed to update share link: " + updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Successfully updated share link settings");
    } else {
      // Create a new share link
      token = generateSecureToken();
      created = true;
      console.log("Creating new share link with token:", token);

      const { error: insertError } = await serviceClient
        .from("share_links")
        .insert({
          token: token,
          owner_user_id: userId,
          is_active: true,
          include_countries: includeCountries,
          include_stats: includeStats,
          include_memories: includeMemories,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ ok: false, error: "Failed to create share link: " + insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Successfully created new share link");
    }

    // Step 5: Build the public URL
    let publicSiteUrl =
      Deno.env.get("PUBLIC_SITE_URL") ||
      req.headers.get("origin") ||
      "";

    // Construct the share URL
    const shareUrl = publicSiteUrl
      ? `${publicSiteUrl}/share/dashboard/${token}`
      : null;

    console.log("Generated share URL:", shareUrl || `(token only: ${token})`);

    return new Response(
      JSON.stringify({
        ok: true,
        token,
        url: shareUrl,
        created,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("get-or-create-share-link error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
