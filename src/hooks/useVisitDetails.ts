import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface VisitDetail {
  id: string;
  country_id: string;
  visit_date: string | null;
  end_date: string | null;
  number_of_days: number | null;
  notes: string | null;
  trip_name: string | null;
  trip_group_id: string | null;
  approximate_year: number | null;
  approximate_month: number | null;
  is_approximate: boolean | null;
  // Memory capture fields
  highlight: string | null;
  why_it_mattered: string | null;
}

interface CityVisit {
  id: string;
  country_id: string;
  city_name: string;
  visit_date: string | null;
  notes: string | null;
}

interface TravelSettings {
  id: string;
  home_country: string;
  home_country_code: string;
}

interface CountryVisitSummary {
  countryId: string;
  totalDays: number;
  timesVisited: number;
  citiesCount: number;
  cities: string[];
}

export const useVisitDetails = () => {
  const [visitDetails, setVisitDetails] = useState<VisitDetail[]>([]);
  const [cityVisits, setCityVisits] = useState<CityVisit[]>([]);
  const [travelSettings, setTravelSettings] = useState<TravelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const isFetching = useRef(false);
  const isInitialLoad = useRef(true);

  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    
    if (isInitialLoad.current) {
      setLoading(true);
    }
    
    try {
      const [visitsResult, citiesResult, settingsResult] = await Promise.all([
        supabase.from("country_visit_details").select("*"),
        supabase.from("city_visits").select("*"),
        supabase.from("travel_settings").select("*").limit(1).maybeSingle(),
      ]);

      if (visitsResult.error) throw visitsResult.error;
      if (citiesResult.error) throw citiesResult.error;
      if (settingsResult.error) throw settingsResult.error;

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setVisitDetails(visitsResult.data || []);
        setCityVisits(citiesResult.data || []);
        setTravelSettings(settingsResult.data);
      }
    } catch (error) {
      logger.error("Error fetching visit details:", error);
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetching.current = false;
      isInitialLoad.current = false;
    }
  }, []);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Store debounce timer in ref to avoid stale closures
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    // Debounce realtime updates
    const debouncedFetch = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        // Only fetch if component is still mounted
        if (isMountedRef.current) {
          fetchData();
        }
      }, 300);
    };

    const channel = supabase
      .channel("visit_details_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "country_visit_details" }, debouncedFetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "city_visits" }, debouncedFetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "travel_settings" }, debouncedFetch)
      .subscribe();

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
    // fetchData is stable (no dependencies), so we don't need it in deps
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize getCountrySummary
  const getCountrySummary = useCallback((countryId: string): CountryVisitSummary => {
    const countryVisits = visitDetails.filter((v) => v.country_id === countryId);
    const countryCities = cityVisits.filter((c) => c.country_id === countryId);

    return {
      countryId,
      totalDays: countryVisits.reduce((sum, v) => sum + (v.number_of_days || 0), 0),
      timesVisited: countryVisits.length,
      citiesCount: countryCities.length,
      cities: countryCities.map((c) => c.city_name),
    };
  }, [visitDetails, cityVisits]);

  // Calculate total days abroad
  const getTotalDaysAbroad = useCallback((homeCountryName: string): number => {
    return visitDetails.reduce((sum, v) => sum + (v.number_of_days || 0), 0);
  }, [visitDetails]);

  /**
   * Get grouped trip statistics
   * Groups visits by trip_group_id to treat multi-country trips as ONE trip
   * Returns total trip count and per-trip durations
   */
  const getGroupedTripStats = useCallback(() => {
    const validVisits = visitDetails.filter(v => v.visit_date || v.approximate_year);
    
    // Group by trip_group_id
    const tripGroups = new Map<string, VisitDetail[]>();
    const standaloneVisits: VisitDetail[] = [];
    
    validVisits.forEach(visit => {
      if (visit.trip_group_id) {
        const existing = tripGroups.get(visit.trip_group_id) || [];
        existing.push(visit);
        tripGroups.set(visit.trip_group_id, existing);
      } else {
        standaloneVisits.push(visit);
      }
    });
    
    // Calculate duration for each trip group
    const tripDurations: { groupId: string | null; totalDays: number; countryIds: string[]; tripName: string | null }[] = [];
    
    tripGroups.forEach((visits, groupId) => {
      const totalDays = visits.reduce((sum, v) => sum + (v.number_of_days || 0), 0);
      const countryIds = [...new Set(visits.map(v => v.country_id))];
      const tripName = visits[0]?.trip_name || null;
      if (totalDays > 0) {
        tripDurations.push({ groupId, totalDays, countryIds, tripName });
      }
    });
    
    // Add standalone visits as individual "trips"
    standaloneVisits.forEach(visit => {
      if (visit.number_of_days && visit.number_of_days > 0) {
        tripDurations.push({
          groupId: null,
          totalDays: visit.number_of_days,
          countryIds: [visit.country_id],
          tripName: visit.trip_name,
        });
      }
    });
    
    return {
      // Total trip count = unique trip groups + standalone visits
      totalTripCount: tripGroups.size + standaloneVisits.length,
      tripDurations,
      // Longest trip by grouped duration
      longestTripDays: tripDurations.length > 0 
        ? Math.max(...tripDurations.map(t => t.totalDays))
        : 0,
      // Average trip duration (grouped)
      avgTripDuration: tripDurations.length > 0
        ? Math.round(tripDurations.reduce((sum, t) => sum + t.totalDays, 0) / tripDurations.length)
        : 0,
    };
  }, [visitDetails]);

  // Memoize getAllSummaries
  const getAllSummaries = useCallback((): Map<string, CountryVisitSummary> => {
    const countryIds = new Set<string>();
    visitDetails.forEach((v) => countryIds.add(v.country_id));
    cityVisits.forEach((c) => countryIds.add(c.country_id));

    const summaries = new Map<string, CountryVisitSummary>();
    countryIds.forEach((id) => {
      summaries.set(id, getCountrySummary(id));
    });

    return summaries;
  }, [visitDetails, cityVisits, getCountrySummary]);

  return {
    visitDetails,
    cityVisits,
    travelSettings,
    loading,
    refetch: fetchData,
    getCountrySummary,
    getTotalDaysAbroad,
    getAllSummaries,
    getGroupedTripStats,
  };
};
