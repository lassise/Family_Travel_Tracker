import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook to get family member IDs that have previously visited a country
 * Used to auto-populate member checkboxes when creating a trip
 */
export const useQuickAddMembers = () => {
  const { user } = useAuth();

  /**
   * Get member IDs that have visited a country via quick-add (country_visits)
   * @param countryCode - ISO2 country code
   * @returns Array of family member IDs who have visited the country
   */
  const getMembersForCountry = useCallback(async (countryCode: string): Promise<string[]> => {
    if (!user || !countryCode) return [];

    try {
      // First, find the country by name or flag (stored as ISO code)
      const { data: countries } = await supabase
        .from("countries")
        .select("id")
        .eq("user_id", user.id)
        .eq("flag", countryCode.toUpperCase());

      if (!countries || countries.length === 0) return [];

      const countryIds = countries.map(c => c.id);

      // Get unique family member IDs from country_visits
      const { data: visits, error } = await supabase
        .from("country_visits")
        .select("family_member_id")
        .eq("user_id", user.id)
        .in("country_id", countryIds)
        .not("family_member_id", "is", null);

      if (error) throw error;

      // Return unique member IDs
      const memberIds = new Set<string>();
      visits?.forEach(v => {
        if (v.family_member_id) {
          memberIds.add(v.family_member_id);
        }
      });

      return Array.from(memberIds);
    } catch (error) {
      console.error("Error getting members for country:", error);
      return [];
    }
  }, [user]);

  /**
   * Get member IDs that have visited a country by country name
   * @param countryName - Country name (e.g., "Nigeria")
   * @returns Array of family member IDs who have visited the country
   */
  const getMembersForCountryByName = useCallback(async (countryName: string): Promise<string[]> => {
    if (!user || !countryName) return [];

    try {
      // Find the country by name
      const { data: countries } = await supabase
        .from("countries")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", countryName);

      if (!countries || countries.length === 0) return [];

      const countryIds = countries.map(c => c.id);

      // Get unique family member IDs from country_visits
      const { data: visits, error } = await supabase
        .from("country_visits")
        .select("family_member_id")
        .eq("user_id", user.id)
        .in("country_id", countryIds)
        .not("family_member_id", "is", null);

      if (error) throw error;

      // Return unique member IDs
      const memberIds = new Set<string>();
      visits?.forEach(v => {
        if (v.family_member_id) {
          memberIds.add(v.family_member_id);
        }
      });

      return Array.from(memberIds);
    } catch (error) {
      console.error("Error getting members for country by name:", error);
      return [];
    }
  }, [user]);

  return {
    getMembersForCountry,
    getMembersForCountryByName,
  };
};
