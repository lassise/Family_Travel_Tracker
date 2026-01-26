import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import type { CountryOption } from "@/lib/countriesData";
import { differenceInDays, parseISO } from "date-fns";

export interface TripCountry {
  id: string;
  trip_id: string;
  country_code: string;
  country_name: string;
  order_index: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

// Extended interface for countries with optional dates
export interface CountryWithDates extends CountryOption {
  start_date?: string;
  end_date?: string;
}

export const useTripCountries = () => {
  const { user } = useAuth();
  const [tripCountries, setTripCountries] = useState<Record<string, TripCountry[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchTripCountries = useCallback(async () => {
    if (!user) {
      setTripCountries({});
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("trip_countries")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Group by trip_id
      const grouped: Record<string, TripCountry[]> = {};
      (data || []).forEach((tc) => {
        if (!grouped[tc.trip_id]) {
          grouped[tc.trip_id] = [];
        }
        grouped[tc.trip_id].push(tc);
      });

      setTripCountries(grouped);
    } catch (error) {
      console.error("Error fetching trip countries:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTripCountries();
  }, [fetchTripCountries]);

  const addTripCountries = async (
    tripId: string,
    countries: CountryWithDates[]
  ): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const records = countries.map((country, index) => ({
        trip_id: tripId,
        country_code: country.code,
        country_name: country.name,
        order_index: index,
        start_date: country.start_date || null,
        end_date: country.end_date || null,
      }));

      const { error } = await supabase
        .from("trip_countries")
        .insert(records);

      if (error) throw error;

      await fetchTripCountries();
      return { error: null };
    } catch (error) {
      logger.error("Error adding trip countries:", error);
      return { error: error as Error };
    }
  };

  const updateTripCountries = async (
    tripId: string,
    countries: CountryWithDates[]
  ): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      // Delete existing countries for this trip
      await supabase
        .from("trip_countries")
        .delete()
        .eq("trip_id", tripId);

      // Insert new countries
      if (countries.length > 0) {
        const records = countries.map((country, index) => ({
          trip_id: tripId,
          country_code: country.code,
          country_name: country.name,
          order_index: index,
          start_date: country.start_date || null,
          end_date: country.end_date || null,
        }));

        const { error } = await supabase
          .from("trip_countries")
          .insert(records);

        if (error) throw error;
      }

      await fetchTripCountries();
      return { error: null };
    } catch (error) {
      logger.error("Error updating trip countries:", error);
      return { error: error as Error };
    }
  };

  const getCountriesForTrip = (tripId: string): TripCountry[] => {
    return tripCountries[tripId] || [];
  };

  /**
   * Calculate trip date range from country dates
   * Returns min start_date and max end_date from all countries
   */
  const calculateTripDateRange = useCallback((countries: CountryWithDates[]): { start_date: string | null; end_date: string | null } => {
    const countriesWithDates = countries.filter(c => c.start_date && c.end_date);
    
    if (countriesWithDates.length === 0) {
      return { start_date: null, end_date: null };
    }

    const dates = countriesWithDates.map(c => ({
      start: c.start_date!,
      end: c.end_date!,
    }));

    const startDates = dates.map(d => d.start).sort();
    const endDates = dates.map(d => d.end).sort();

    return {
      start_date: startDates[0] || null,
      end_date: endDates[endDates.length - 1] || null,
    };
  }, []);

  /**
   * Find or create a country record in the countries table
   * If continent is not provided, it will be looked up from existing country record or left null
   */
  const findOrCreateCountry = useCallback(async (countryName: string, countryCode: string, continent?: string): Promise<string> => {
    if (!user) throw new Error("Not authenticated");

    // Check if country exists
    const { data: existingCountry, error: fetchError } = await supabase
      .from("countries")
      .select("id, continent")
      .eq("user_id", user.id)
      .eq("name", countryName)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error("Error fetching country:", fetchError);
      throw fetchError;
    }

    if (existingCountry) {
      return existingCountry.id;
    }

    // Try to get continent from countries-list library if not provided
    let finalContinent = continent;
    if (!finalContinent) {
      try {
        const { countries } = await import('countries-list');
        const countryData = countries[countryCode as keyof typeof countries];
        if (countryData) {
          const continentMap: Record<string, string> = {
            AF: 'Africa',
            AN: 'Antarctica',
            AS: 'Asia',
            EU: 'Europe',
            NA: 'North America',
            OC: 'Oceania',
            SA: 'South America',
          };
          finalContinent = continentMap[countryData.continent] || countryData.continent || '';
        }
      } catch (error) {
        logger.error("Error looking up continent:", error);
        // Continue without continent
      }
    }

    // Create the country
    const { data: newCountry, error: insertError } = await supabase
      .from("countries")
      .insert({
        name: countryName,
        flag: countryCode,
        continent: finalContinent || '',
        user_id: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      logger.error("Error creating country:", insertError);
      throw insertError;
    }

    return newCountry.id;
  }, [user]);

  /**
   * Calculate number of days between two dates
   */
  const calculateDays = useCallback((startDate: string, endDate: string): number => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const days = differenceInDays(end, start);
      return Math.max(1, days + 1); // At least 1 day, include both start and end
    } catch (error) {
      logger.error("Error calculating days:", error);
      return 1;
    }
  }, []);

  /**
   * Sync country_visit_details entries for a trip
   * Creates visit_details entries for each country in the trip
   * @param tripId - The trip ID
   * @param tripTitle - The trip title
   * @param countriesOverride - Optional: pass countries directly to avoid race condition with state
   */
  const syncCountryVisitDetails = useCallback(async (
    tripId: string, 
    tripTitle: string,
    countriesOverride?: TripCountry[]
  ): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      // Use provided countries or fetch from state (for updates after state has settled)
      let tripCountriesList: TripCountry[];
      if (countriesOverride) {
        tripCountriesList = countriesOverride;
      } else {
        // Fetch directly from database to avoid race condition with state updates
        const { data, error: fetchError } = await supabase
          .from("trip_countries")
          .select("*")
          .eq("trip_id", tripId)
          .order("order_index", { ascending: true });

        if (fetchError) {
          logger.error("Error fetching trip countries for sync:", fetchError);
          return { error: fetchError as Error };
        }

        tripCountriesList = data || [];
      }
      
      if (tripCountriesList.length === 0) {
        return { error: null }; // No countries to sync
      }

      // Process each country
      for (const tc of tripCountriesList) {
        if (!tc.start_date || !tc.end_date) {
          continue; // Skip countries without dates
        }

        try {
          // Find or create country record (continent will be looked up if needed)
          const countryId = await findOrCreateCountry(tc.country_name, tc.country_code);

          // Check if visit_details already exists for this trip
          const { data: existing, error: checkError } = await supabase
            .from("country_visit_details")
            .select("id")
            .eq("country_id", countryId)
            .eq("trip_group_id", tripId)
            .maybeSingle();

          if (checkError && checkError.code !== 'PGRST116') {
            logger.error("Error checking existing visit details:", checkError);
            continue; // Skip this country but continue with others
          }

          if (existing) {
            // Update existing entry
            const numberOfDays = calculateDays(tc.start_date, tc.end_date);
            const { error: updateError } = await supabase
              .from("country_visit_details")
              .update({
                visit_date: tc.start_date,
                end_date: tc.end_date,
                number_of_days: numberOfDays,
                trip_name: tripTitle,
              })
              .eq("id", existing.id);

            if (updateError) {
              logger.error("Error updating visit details:", updateError);
            }
          } else {
            // Create new entry
            const numberOfDays = calculateDays(tc.start_date, tc.end_date);
            const { error: insertError } = await supabase
              .from("country_visit_details")
              .insert({
                country_id: countryId,
                visit_date: tc.start_date,
                end_date: tc.end_date,
                number_of_days: numberOfDays,
                trip_name: tripTitle,
                trip_group_id: tripId,
                user_id: user.id,
              });

            if (insertError) {
              logger.error("Error creating visit details:", insertError);
            }
          }
        } catch (error) {
          logger.error(`Error syncing visit details for country ${tc.country_name}:`, error);
          // Continue with next country
        }
      }

      return { error: null };
    } catch (error) {
      logger.error("Error syncing country visit details:", error);
      return { error: error as Error };
    }
  }, [user, findOrCreateCountry, calculateDays]);

  return {
    tripCountries,
    loading,
    refetch: fetchTripCountries,
    addTripCountries,
    updateTripCountries,
    getCountriesForTrip,
    calculateTripDateRange,
    syncCountryVisitDetails,
  };
};
