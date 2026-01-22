import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DebugInfo {
  token_normalized: string;
  token_found: boolean;
  token_source: string;
  owner_user_id: string | null;
  owner_found: boolean;
  blocked_by_rls: boolean;
  query_steps: string[];
  query_counts: {
    visitedCountries: number;
    visitedContinents: number;
    visitedStates: number;
    wishlistCountries: number;
    memories: number;
  };
  failures: string[];
}

interface ShareSettings {
  show_stats: boolean;
  show_map: boolean;
  show_countries: boolean;
  show_photos: boolean;
  show_timeline: boolean;
  show_family_members: boolean;
  show_achievements: boolean;
  show_wishlist: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const debug: DebugInfo = {
    token_normalized: "",
    token_found: false,
    token_source: "share_profiles.dashboard_share_token",
    owner_user_id: null,
    owner_found: false,
    blocked_by_rls: false,
    query_steps: [],
    query_counts: {
      visitedCountries: 0,
      visitedContinents: 0,
      visitedStates: 0,
      wishlistCountries: 0,
      memories: 0,
    },
    failures: [],
  };

  try {
    // Parse request body
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing or invalid token", debug }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize token
    debug.token_normalized = token.trim().toLowerCase();
    debug.query_steps.push("token_normalized");

    // Validate token format (32 hex characters)
    if (debug.token_normalized.length !== 32 || !/^[a-f0-9]+$/.test(debug.token_normalized)) {
      debug.failures.push("Token format invalid: must be 32 hex characters");
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid token format", debug }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with SERVICE ROLE to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    debug.query_steps.push("supabase_service_client_created");

    // Step 1: Look up share profile by dashboard_share_token
    const { data: shareProfile, error: shareError } = await supabase
      .from("share_profiles")
      .select("id, user_id, is_public, show_stats, show_map, show_countries, show_photos, show_timeline, show_family_members, show_achievements, show_wishlist, custom_headline")
      .eq("dashboard_share_token", debug.token_normalized)
      .eq("is_public", true)
      .maybeSingle();

    debug.query_steps.push("share_profile_lookup");

    if (shareError) {
      debug.failures.push(`share_profile query error: ${shareError.message}`);
      return new Response(
        JSON.stringify({ ok: false, error: "Database error looking up share profile", debug }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!shareProfile) {
      debug.failures.push("No share_profile found with this token and is_public=true");
      return new Response(
        JSON.stringify({ ok: false, error: "Dashboard not found or is private", debug }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    debug.token_found = true;
    debug.owner_user_id = shareProfile.user_id;
    debug.query_steps.push("owner_resolved");

    const ownerId = shareProfile.user_id;
    const shareSettings: ShareSettings = {
      show_stats: shareProfile.show_stats ?? true,
      show_map: shareProfile.show_map ?? true,
      show_countries: shareProfile.show_countries ?? true,
      show_photos: shareProfile.show_photos ?? false,
      show_timeline: shareProfile.show_timeline ?? false,
      show_family_members: shareProfile.show_family_members ?? false,
      show_achievements: shareProfile.show_achievements ?? false,
      show_wishlist: shareProfile.show_wishlist ?? false,
    };

    // Step 2: Fetch owner profile
    const { data: ownerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, home_country")
      .eq("id", ownerId)
      .maybeSingle();

    debug.query_steps.push("owner_profile_lookup");

    if (profileError) {
      debug.failures.push(`profile query error: ${profileError.message}`);
    }

    if (ownerProfile) {
      debug.owner_found = true;
    } else {
      debug.failures.push("Owner profile not found in profiles table");
    }

    // Step 3: Fetch countries (all countries created by owner)
    const { data: countriesData, error: countriesError } = await supabase
      .from("countries")
      .select("id, name, flag, continent")
      .eq("user_id", ownerId);

    debug.query_steps.push("countries_fetch");

    if (countriesError) {
      debug.failures.push(`countries query error: ${countriesError.message}`);
    }

    const countries = countriesData || [];

    // Step 4: Fetch country_visits (to determine which countries are visited)
    const { data: visitsData, error: visitsError } = await supabase
      .from("country_visits")
      .select("country_id, family_member_id")
      .eq("user_id", ownerId);

    debug.query_steps.push("country_visits_fetch");

    if (visitsError) {
      debug.failures.push(`country_visits query error: ${visitsError.message}`);
    }

    const visits = visitsData || [];

    // Step 5: Fetch country_visit_details (for timeline/earliest year)
    const { data: visitDetailsData, error: visitDetailsError } = await supabase
      .from("country_visit_details")
      .select("id, country_id, visit_date, approximate_year, approximate_month, is_approximate, trip_name, highlight")
      .eq("user_id", ownerId)
      .order("visit_date", { ascending: false, nullsFirst: false });

    debug.query_steps.push("visit_details_fetch");

    if (visitDetailsError) {
      debug.failures.push(`country_visit_details query error: ${visitDetailsError.message}`);
    }

    const visitDetails = visitDetailsData || [];

    // Step 6: Fetch visit_family_members (for per-member filtering)
    const { data: visitMembersData, error: visitMembersError } = await supabase
      .from("visit_family_members")
      .select("visit_id, family_member_id")
      .eq("user_id", ownerId);

    debug.query_steps.push("visit_family_members_fetch");

    if (visitMembersError) {
      debug.failures.push(`visit_family_members query error: ${visitMembersError.message}`);
    }

    const visitMembers = visitMembersData || [];

    // Step 7: Fetch family_members (conditionally based on show_family_members)
    let familyMembers: any[] = [];
    if (shareSettings.show_family_members) {
      const { data: membersData, error: membersError } = await supabase
        .from("family_members")
        .select("id, name, role, avatar, color")
        .eq("user_id", ownerId)
        .order("created_at", { ascending: true });

      debug.query_steps.push("family_members_fetch");

      if (membersError) {
        debug.failures.push(`family_members query error: ${membersError.message}`);
      }

      familyMembers = membersData || [];
    } else {
      debug.query_steps.push("family_members_skipped_per_settings");
    }

    // Step 8: Fetch state_visits
    const { data: stateVisitsData, error: stateVisitsError } = await supabase
      .from("state_visits")
      .select("id, country_id, country_code, state_code, state_name, family_member_id, created_at")
      .eq("user_id", ownerId);

    debug.query_steps.push("state_visits_fetch");

    if (stateVisitsError) {
      debug.failures.push(`state_visits query error: ${stateVisitsError.message}`);
    }

    const stateVisits = stateVisitsData || [];

    // Step 9: Fetch wishlist (if enabled)
    let wishlist: any[] = [];
    if (shareSettings.show_wishlist) {
      const { data: wishlistData, error: wishlistError } = await supabase
        .from("country_wishlist")
        .select("country_id")
        .eq("user_id", ownerId);

      debug.query_steps.push("wishlist_fetch");

      if (wishlistError) {
        debug.failures.push(`country_wishlist query error: ${wishlistError.message}`);
      }

      wishlist = wishlistData || [];
    } else {
      debug.query_steps.push("wishlist_skipped_per_settings");
    }

    // Step 10: Fetch photos/memories (if enabled)
    let photos: any[] = [];
    if (shareSettings.show_photos || shareSettings.show_timeline) {
      const { data: photosData, error: photosError } = await supabase
        .from("travel_photos")
        .select("id, photo_url, caption, country_id, taken_at, is_shareable")
        .eq("user_id", ownerId)
        .eq("is_shareable", true)
        .order("taken_at", { ascending: false, nullsFirst: false });

      debug.query_steps.push("photos_fetch");

      if (photosError) {
        debug.failures.push(`travel_photos query error: ${photosError.message}`);
      }

      photos = photosData || [];
    } else {
      debug.query_steps.push("photos_skipped_per_settings");
    }

    // =========== COMPUTE DERIVED DATA ===========

    // Build visited country IDs set (from both country_visits and visit_family_members)
    const visitedCountryIds = new Set<string>();

    // From country_visits
    visits.forEach((v: any) => {
      if (v.country_id) visitedCountryIds.add(v.country_id);
    });

    // From visit_family_members via visitDetails
    const visitIdToCountryId = new Map<string, string>();
    visitDetails.forEach((vd: any) => {
      if (vd.id && vd.country_id) visitIdToCountryId.set(vd.id, vd.country_id);
    });
    visitMembers.forEach((vm: any) => {
      const countryId = visitIdToCountryId.get(vm.visit_id);
      if (countryId) visitedCountryIds.add(countryId);
    });

    debug.query_steps.push("visited_countries_computed");

    // Build visitedBy map: country_id -> array of member names (or ["Visited"] if members hidden)
    const visitedByMap = new Map<string, Set<string>>();
    const memberIdToName = new Map<string, string>();
    familyMembers.forEach((m: any) => memberIdToName.set(m.id, m.name));

    const markVisited = (countryId: string, memberId?: string) => {
      if (!visitedByMap.has(countryId)) visitedByMap.set(countryId, new Set());
      if (shareSettings.show_family_members && memberId && memberIdToName.has(memberId)) {
        visitedByMap.get(countryId)!.add(memberIdToName.get(memberId)!);
      } else {
        visitedByMap.get(countryId)!.add("Visited");
      }
    };

    visits.forEach((v: any) => {
      if (v.country_id) markVisited(v.country_id, v.family_member_id);
    });

    visitMembers.forEach((vm: any) => {
      const countryId = visitIdToCountryId.get(vm.visit_id);
      if (countryId) markVisited(countryId, vm.family_member_id);
    });

    // Build countries with visitedBy arrays
    const countriesWithVisitedBy = countries.map((c: any) => ({
      ...c,
      visitedBy: Array.from(visitedByMap.get(c.id) || []),
    }));

    // Visited countries (those with visitedBy.length > 0)
    const visitedCountries = countriesWithVisitedBy.filter((c: any) => c.visitedBy.length > 0);

    // Visited continents
    const visitedContinents = new Set(visitedCountries.map((c: any) => c.continent));

    // Calculate per-member country counts (if showing family members)
    const memberCountryCounts = new Map<string, number>();
    if (shareSettings.show_family_members) {
      const memberCountrySet = new Map<string, Set<string>>();
      familyMembers.forEach((m: any) => memberCountrySet.set(m.id, new Set()));

      visits.forEach((v: any) => {
        if (v.family_member_id && v.country_id) {
          memberCountrySet.get(v.family_member_id)?.add(v.country_id);
        }
      });

      visitMembers.forEach((vm: any) => {
        const countryId = visitIdToCountryId.get(vm.visit_id);
        if (countryId && vm.family_member_id) {
          memberCountrySet.get(vm.family_member_id)?.add(countryId);
        }
      });

      memberCountrySet.forEach((set, memberId) => {
        memberCountryCounts.set(memberId, set.size);
      });
    }

    const familyMembersWithCounts = familyMembers.map((m: any) => ({
      ...m,
      countriesVisited: memberCountryCounts.get(m.id) || 0,
    }));

    // Earliest year
    let earliestYear: number | null = null;
    visitDetails.forEach((vd: any) => {
      let year: number | null = null;
      if (vd.visit_date) {
        const d = new Date(vd.visit_date);
        if (!isNaN(d.getTime())) year = d.getFullYear();
      } else if (vd.approximate_year) {
        year = vd.approximate_year;
      }
      if (year && (earliestYear === null || year < earliestYear)) {
        earliestYear = year;
      }
    });

    // Map codes for Mapbox
    // We need country codes (ISO2) for the map - but countries table has name/flag, not code
    // The map component will derive ISO2 from country name

    // Set debug counts
    debug.query_counts.visitedCountries = visitedCountries.length;
    debug.query_counts.visitedContinents = visitedContinents.size;
    debug.query_counts.visitedStates = stateVisits.length;
    debug.query_counts.wishlistCountries = wishlist.length;
    debug.query_counts.memories = photos.length;
    debug.query_steps.push("counts_computed");

    // Check for unexpected empty data
    if (debug.token_found && debug.owner_found && countries.length > 0 && visitedCountries.length === 0 && visits.length === 0) {
      debug.failures.push("Owner has countries but zero visits - possible data integrity issue or all countries are unvisited");
    }

    // Build response payload
    const payload = {
      ok: true,
      debug,
      data: {
        shareSettings,
        owner: {
          displayName: ownerProfile?.full_name || "Traveler",
          avatarUrl: ownerProfile?.avatar_url || null,
          homeCountry: ownerProfile?.home_country || null,
        },
        countries: countriesWithVisitedBy,
        familyMembers: familyMembersWithCounts,
        visitDetails,
        visitMembers,
        stateVisits,
        wishlist: wishlist.map((w: any) => w.country_id),
        photos,
        stats: {
          visitedCountriesCount: visitedCountries.length,
          visitedContinentsCount: visitedContinents.size,
          visitedStatesCount: stateVisits.length,
          wishlistCountriesCount: wishlist.length,
          memoriesCount: photos.length,
          earliestYear,
        },
      },
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    debug.failures.push(`Unexpected error: ${err.message}`);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error", debug }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
