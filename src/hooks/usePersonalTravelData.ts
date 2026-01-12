import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLinkedFamilyMember } from "@/hooks/useLinkedFamilyMember";

export interface PersonalCountry {
  id: string;
  name: string;
  flag: string;
  continent: string;
  visited: boolean;
}

export const usePersonalTravelData = () => {
  const { user } = useAuth();
  const { linkedMemberId, linkedMember, loading: linkedLoading } = useLinkedFamilyMember();
  const [countries, setCountries] = useState<PersonalCountry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || linkedLoading) {
      return;
    }

    if (!linkedMemberId) {
      // No linked member, so no personal travel data
      setCountries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all countries
      const { data: countriesData, error: countriesError } = await supabase
        .from("countries")
        .select("*")
        .order("name", { ascending: true });

      if (countriesError) throw countriesError;

      // Fetch visits for the linked family member only
      const { data: visitsData, error: visitsError } = await supabase
        .from("country_visits")
        .select("country_id")
        .eq("family_member_id", linkedMemberId);

      if (visitsError) throw visitsError;

      const visitedCountryIds = new Set(visitsData?.map(v => v.country_id) || []);

      const personalCountries: PersonalCountry[] = countriesData?.map(country => ({
        id: country.id,
        name: country.name,
        flag: country.flag,
        continent: country.continent,
        visited: visitedCountryIds.has(country.id),
      })) || [];

      setCountries(personalCountries);
    } catch (error) {
      console.error("Error fetching personal travel data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, linkedMemberId, linkedLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived statistics
  const visitedCountries = countries.filter(c => c.visited);
  const totalCountries = visitedCountries.length;
  const continentsVisited = new Set(visitedCountries.map(c => c.continent)).size;

  return {
    countries,
    visitedCountries,
    totalCountries,
    continentsVisited,
    linkedMember,
    linkedMemberId,
    loading: loading || linkedLoading,
    refetch: fetchData,
  };
};
