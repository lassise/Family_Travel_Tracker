import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CountryOption } from "@/lib/countriesData";

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
    countries: CountryOption[]
  ): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const records = countries.map((country, index) => ({
        trip_id: tripId,
        country_code: country.code,
        country_name: country.name,
        order_index: index,
      }));

      const { error } = await supabase
        .from("trip_countries")
        .insert(records);

      if (error) throw error;

      await fetchTripCountries();
      return { error: null };
    } catch (error) {
      console.error("Error adding trip countries:", error);
      return { error: error as Error };
    }
  };

  const updateTripCountries = async (
    tripId: string,
    countries: CountryOption[]
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
        }));

        const { error } = await supabase
          .from("trip_countries")
          .insert(records);

        if (error) throw error;
      }

      await fetchTripCountries();
      return { error: null };
    } catch (error) {
      console.error("Error updating trip countries:", error);
      return { error: error as Error };
    }
  };

  const getCountriesForTrip = (tripId: string): TripCountry[] => {
    return tripCountries[tripId] || [];
  };

  return {
    tripCountries,
    loading,
    refetch: fetchTripCountries,
    addTripCountries,
    updateTripCountries,
    getCountriesForTrip,
  };
};
