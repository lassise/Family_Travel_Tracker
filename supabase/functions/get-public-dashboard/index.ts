import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get token from request
    const { token } = await req.json();
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenNormalized = token.trim().toLowerCase();

    // Create Supabase client with SERVICE ROLE to bypass RLS completely
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Looking up token:", tokenNormalized);

    // Query share_links - SERVICE ROLE bypasses RLS completely
    // Try with all possible column combinations to handle schema variations
    let shareLink: any = null;
    let queryError: any = null;

    // First try: Full query with new schema
    try {
      const { data, error } = await supabaseAdmin
        .from("share_links")
        .select("*")
        .eq("token", tokenNormalized)
        .maybeSingle();
      
      if (!error && data) {
        shareLink = data;
      } else if (error && !error.message.includes('column') && !error.message.includes('does not exist')) {
        queryError = error;
      }
    } catch (e: any) {
      queryError = e;
    }

    // If that failed, try with old schema columns
    if (!shareLink && !queryError) {
      try {
        const { data, error } = await supabaseAdmin
          .from("share_links")
          .select("id, token, user_id, share_type, item_id, included_fields, created_at, expires_at, view_count")
          .eq("token", tokenNormalized)
          .maybeSingle();
        
        if (!error && data) {
          shareLink = data;
        } else {
          queryError = error;
        }
      } catch (e: any) {
        queryError = e;
      }
    }

    console.log("Query result:", { shareLink: !!shareLink, error: queryError?.message });

    if (queryError) {
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: "Database query failed",
          details: queryError.message,
          code: queryError.code
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!shareLink) {
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: "Share link not found",
          token: tokenNormalized,
          hint: "Token may not exist in database"
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if link is active (new schema) or not expired (old schema)
    if (shareLink.is_active === false) {
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: "Share link is inactive"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: "Share link has expired"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the owner's data
    const ownerId = shareLink.owner_user_id || shareLink.user_id;
    
    if (!ownerId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Share link has no owner" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the actual travel data using SERVICE ROLE
    const { data: visited, error: visitedError } = await supabaseAdmin
      .from("visited_countries")
      .select("*")
      .eq("user_id", ownerId);

    if (visitedError) {
      console.error("Error fetching visited countries:", visitedError);
    }

    // Fetch visit details
    const { data: visitDetails } = await supabaseAdmin
      .from("country_visit_details")
      .select("id, country_id, visit_date, end_date, number_of_days, notes, approximate_year, approximate_month, is_approximate, trip_name, highlight, why_it_mattered")
      .eq("user_id", ownerId)
      .order("visit_date", { ascending: false, nullsFirst: false });

    // Fetch countries
    const { data: countries } = await supabaseAdmin
      .from("countries")
      .select("id, name, flag, continent")
      .eq("user_id", ownerId);

    // Fetch family members
    const { data: familyMembers } = await supabaseAdmin
      .from("family_members")
      .select("id, name, role, avatar, color")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: true });

    // Fetch state visits
    const { data: stateVisits } = await supabaseAdmin
      .from("state_visits")
      .select("id, state_code, state_name, country_code, country_id, family_member_id, created_at")
      .eq("user_id", ownerId);

    // Fetch photos
    const { data: photos } = await supabaseAdmin
      .from("travel_photos")
      .select("id, photo_url, caption, country_id, taken_at")
      .eq("user_id", ownerId)
      .order("taken_at", { ascending: false, nullsFirst: false })
      .limit(50);

    // Get owner profile
    const { data: ownerProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, avatar_url, home_country")
      .eq("id", ownerId)
      .single();

    // Build share settings from share link
    let shareSettings: any = {};
    if (shareLink.include_stats !== undefined) {
      // New schema with boolean columns
      shareSettings = {
        show_stats: shareLink.include_stats || false,
        show_map: true,
        show_countries: shareLink.include_countries || false,
        show_photos: shareLink.include_memories || false,
        show_timeline: shareLink.include_memories || false,
        show_family_members: true,
        show_achievements: true,
        show_wishlist: false,
      };
    } else if (shareLink.included_fields) {
      // Old schema with JSONB array
      const fields = Array.isArray(shareLink.included_fields) 
        ? shareLink.included_fields 
        : JSON.parse(shareLink.included_fields || '[]');
      shareSettings = {
        show_stats: fields.includes('stats'),
        show_map: true,
        show_countries: fields.includes('countries'),
        show_photos: fields.includes('memories'),
        show_timeline: fields.includes('memories'),
        show_family_members: true,
        show_achievements: true,
        show_wishlist: false,
      };
    } else {
      // Default to showing everything
      shareSettings = {
        show_stats: true,
        show_map: true,
        show_countries: true,
        show_photos: true,
        show_timeline: true,
        show_family_members: true,
        show_achievements: true,
        show_wishlist: false,
      };
    }

    // Calculate stats
    const visitedCountriesCount = visited?.length || 0;
    const visitedContinents = new Set((visited || []).map((v: any) => v.continent).filter(Boolean));
    const visitedContinentsCount = visitedContinents.size;
    const uniqueStateCodes = [...new Set((stateVisits || []).map((sv: any) => sv.state_code))];
    const visitedStatesCount = uniqueStateCodes.length;

    // Return the data
    return new Response(
      JSON.stringify({ 
        ok: true,
        data: {
          shareSettings,
          owner: {
            fullName: ownerProfile?.full_name || "Traveler",
            avatarUrl: ownerProfile?.avatar_url,
            homeCountry: ownerProfile?.home_country,
          },
          countries: countries || [],
          familyMembers: familyMembers || [],
          visitDetails: visitDetails || [],
          stateVisits: stateVisits || [],
          photos: photos || [],
          stats: {
            visitedCountriesCount,
            visitedContinentsCount,
            visitedStatesCount,
          },
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        ok: false,
        error: "Internal server error",
        message: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
