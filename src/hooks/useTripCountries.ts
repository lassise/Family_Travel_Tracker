import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TripCountry {
  id: string;
  trip_id: string;
  country_code: string;
  country_name: string;
  order_index: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export const useTripCountries = (tripId?: string) => {
  const [countries, setCountries] = useState<TripCountry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCountries = useCallback(async () => {
    if (!tripId) {
      setCountries([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trip_countries")
        .select("*")
        .eq("trip_id", tripId)
        .order("order_index");

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error("Error fetching trip countries:", error);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const addCountry = async (countryCode: string, countryName: string) => {
    if (!tripId) return { error: new Error("No trip ID") };

    const orderIndex = countries.length;
    const { data, error } = await supabase
      .from("trip_countries")
      .insert({
        trip_id: tripId,
        country_code: countryCode,
        country_name: countryName,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (!error && data) {
      setCountries((prev) => [...prev, data]);
    }

    return { data, error };
  };

  const removeCountry = async (countryId: string) => {
    const { error } = await supabase
      .from("trip_countries")
      .delete()
      .eq("id", countryId);

    if (!error) {
      setCountries((prev) => prev.filter((c) => c.id !== countryId));
    }

    return { error };
  };

  const setCountriesForTrip = async (
    newCountries: { code: string; name: string }[]
  ) => {
    if (!tripId) return { error: new Error("No trip ID") };

    // Delete existing countries
    await supabase.from("trip_countries").delete().eq("trip_id", tripId);

    // Insert new countries
    if (newCountries.length > 0) {
      const records = newCountries.map((c, index) => ({
        trip_id: tripId,
        country_code: c.code,
        country_name: c.name,
        order_index: index,
      }));

      const { data, error } = await supabase
        .from("trip_countries")
        .insert(records)
        .select();

      if (error) return { error };
      setCountries(data || []);
    } else {
      setCountries([]);
    }

    return { error: null };
  };

  return {
    countries,
    loading,
    refetch: fetchCountries,
    addCountry,
    removeCountry,
    setCountriesForTrip,
  };
};

// Fetch trip countries for multiple trips at once
export const fetchTripCountriesBatch = async (tripIds: string[]) => {
  if (tripIds.length === 0) return {};

  const { data, error } = await supabase
    .from("trip_countries")
    .select("*")
    .in("trip_id", tripIds)
    .order("order_index");

  if (error) {
    console.error("Error fetching trip countries batch:", error);
    return {};
  }

  // Group by trip_id
  const grouped: Record<string, TripCountry[]> = {};
  for (const country of data || []) {
    if (!grouped[country.trip_id]) {
      grouped[country.trip_id] = [];
    }
    grouped[country.trip_id].push(country);
  }

  return grouped;
};
