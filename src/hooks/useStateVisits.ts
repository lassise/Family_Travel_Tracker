import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";

export interface StateVisit {
  id: string;
  country_id: string;
  country_code: string;
  state_code: string;
  state_name: string;
  family_member_id: string;
  created_at: string;
}

export const useStateVisits = (countryCode?: string) => {
  const { user } = useAuth();
  const [stateVisits, setStateVisits] = useState<StateVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStateVisits = useCallback(async () => {
    if (!user) {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setStateVisits([]);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from("state_visits")
        .select("*")
        .order("created_at", { ascending: true });

      if (countryCode) {
        query = query.eq("country_code", countryCode);
      }

      const { data, error } = await query;

      if (error) throw error;
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setStateVisits(data || []);
      }
    } catch (error) {
      logger.error("Error fetching state visits:", error);
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, countryCode]);

  const addStateVisit = useCallback(async (
    countryId: string,
    countryCode: string,
    stateCode: string,
    stateName: string,
    familyMemberId: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("state_visits")
        .insert({
          country_id: countryId,
          country_code: countryCode,
          state_code: stateCode,
          state_name: stateName,
          family_member_id: familyMemberId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error adding state visit:", error);
      return null;
    }
  }, [user]);

  const removeStateVisit = useCallback(async (stateCode: string, familyMemberId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("state_visits")
        .delete()
        .eq("state_code", stateCode)
        .eq("family_member_id", familyMemberId)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error removing state visit:", error);
      return false;
    }
  }, [user]);

  const toggleStateVisit = useCallback(async (
    countryId: string,
    countryCode: string,
    stateCode: string,
    stateName: string,
    familyMemberId: string
  ) => {
    const existing = stateVisits.find(
      sv => sv.state_code === stateCode && sv.family_member_id === familyMemberId
    );

    if (existing) {
      return await removeStateVisit(stateCode, familyMemberId);
    } else {
      return await addStateVisit(countryId, countryCode, stateCode, stateName, familyMemberId);
    }
  }, [stateVisits, addStateVisit, removeStateVisit]);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStateVisits();

    // Set up realtime subscription
    const channel = supabase
      .channel('state_visits_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'state_visits' },
        () => {
          // Only fetch if component is still mounted
          if (isMountedRef.current) {
            fetchStateVisits();
          }
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
    // Only depend on user and countryCode, not fetchStateVisits
    // fetchStateVisits is stable due to useCallback with these dependencies
  }, [user, countryCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get visited state codes for a specific country
  const getVisitedStateCodes = useCallback((cc: string) => {
    return stateVisits
      .filter(sv => sv.country_code === cc)
      .map(sv => sv.state_code);
  }, [stateVisits]);

  // Get state visit count for a country
  const getStateVisitCount = useCallback((cc: string) => {
    return new Set(stateVisits.filter(sv => sv.country_code === cc).map(sv => sv.state_code)).size;
  }, [stateVisits]);

  return {
    stateVisits,
    loading,
    refetch: fetchStateVisits,
    addStateVisit,
    removeStateVisit,
    toggleStateVisit,
    getVisitedStateCodes,
    getStateVisitCount,
  };
};
