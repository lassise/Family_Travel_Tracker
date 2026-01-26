import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { scoreFlights, type ScoredFlight, type FlightResult } from "@/lib/flightScoring";
import type { FlightPreferences } from "@/hooks/useFlightPreferences";
import { toast } from "sonner";
import { categorizeFlightError } from "@/lib/flightErrors";
import { validateFlightResults } from "@/lib/flightResponseValidator";
import { logger } from "@/lib/logger";
import { retryWithBackoff } from "@/lib/retryWithBackoff";

export interface FlightLegSearch {
  legId: string;
  origin: string;
  destination: string;
  date: string;
}

export interface FlightLegResult {
  legId: string;
  flights: ScoredFlight[];
  isLoading: boolean;
  error: string | null;
}

interface PassengerBreakdown {
  adults: number;
  children: number;
  infantsInSeat: number;
  infantsOnLap: number;
}

interface CacheEntry {
  flights: ScoredFlight[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useFlightSearch = (
  preferences: FlightPreferences,
  passengerBreakdown: PassengerBreakdown,
  cabinClass: string,
  stopsFilter: string
) => {
  const [legResults, setLegResults] = useState<Record<string, FlightLegResult>>({});
  const [isSearching, setIsSearching] = useState(false);
  const cacheRef = useRef<Record<string, CacheEntry>>({});
  // AbortController to cancel in-flight requests and prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  // Track active requests to prevent duplicate concurrent searches
  const activeRequestsRef = useRef<Map<string, Promise<ScoredFlight[]>>>(new Map());

  // Store round-trip params for sequential search
  const [roundTripParams, setRoundTripParams] = useState<{
    origin: string;
    destination: string;
    departDate: string;
    returnDate: string;
  } | null>(null);

  const passengers =
    passengerBreakdown.adults +
    passengerBreakdown.children +
    passengerBreakdown.infantsInSeat +
    passengerBreakdown.infantsOnLap;

  // Generate cache key
  const getCacheKey = (origin: string, destination: string, date: string) =>
    `${origin}-${destination}-${date}-${cabinClass}-${passengers}-${stopsFilter}`;

  // Check cache
  const getFromCache = (key: string): ScoredFlight[] | null => {
    const entry = cacheRef.current[key];
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.flights;
    }
    return null;
  };

  // Set cache
  const setCache = (key: string, flights: ScoredFlight[]) => {
    cacheRef.current[key] = {
      flights,
      timestamp: Date.now(),
    };
  };

  // Search a single leg
  const searchLeg = useCallback(
    async (leg: FlightLegSearch): Promise<ScoredFlight[]> => {
      // Check if request was aborted before starting
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Request was cancelled');
      }

      const cacheKey = getCacheKey(leg.origin, leg.destination, leg.date);
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Check if same request is already in progress
      const activeRequest = activeRequestsRef.current.get(cacheKey);
      if (activeRequest) {
        // Return existing promise to prevent duplicate API calls
        return activeRequest;
      }

      const effectiveCabinClass = cabinClass === "any" ? null : cabinClass;

      // Create the search promise with retry logic
      const searchPromise = (async () => {
        try {
          // Wrap API call in retry logic with exponential backoff
          const { data, error } = await retryWithBackoff(
            async () => {
              const result = await supabase.functions.invoke("search-flights", {
                body: {
                  origin: leg.origin,
                  destination: leg.destination,
                  departureDate: leg.date,
                  returnDate: null,
                  passengers,
                  tripType: "oneway",
                  cabinClass: effectiveCabinClass,
                  alternateAirports: preferences.alternate_airports,
                  stopsFilter,
                },
              });

              // Check if request was aborted
              if (abortControllerRef.current?.signal.aborted) {
                throw new Error('Request was cancelled');
              }

              // Throw error to trigger retry if needed
              if (result.error) throw result.error;
              if (result.data?.error) throw new Error(result.data.error);

              return result.data;
            },
            {
              maxAttempts: 3,
              initialDelay: 1000, // 1 second
              maxDelay: 10000, // 10 seconds max
              shouldRetry: (error: any) => {
                // Don't retry if cancelled
                if (error?.message === 'Request was cancelled') {
                  return false;
                }
                // Retry on network/server errors
                const errorString = String(error?.message || error || '').toLowerCase();
                return (
                  errorString.includes('network') ||
                  errorString.includes('timeout') ||
                  errorString.includes('connection') ||
                  error?.status >= 500
                );
              },
            }
          );

          // Check if request was aborted after retries
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Request was cancelled');
          }

          // Validate and sanitize flight results
          const rawFlights: any[] = (data as any)?.flights || [];
          const { valid, invalid, warnings } = validateFlightResults(rawFlights);
          
          if (invalid.length > 0) {
            logger.warn(`Filtered out ${invalid.length} invalid flights from API response`);
          }
          
          if (warnings.length > 0) {
            logger.warn(`Found ${warnings.length} validation warnings in flight data`);
          }

          // Only score valid flights
          const scored = scoreFlights(valid, preferences, undefined, passengerBreakdown, cabinClass);

          setCache(cacheKey, scored);
          return scored;
        } finally {
          // Remove from active requests when done (success or failure)
          activeRequestsRef.current.delete(cacheKey);
        }
      })();

      // Store the promise to prevent duplicates
      activeRequestsRef.current.set(cacheKey, searchPromise);

      return searchPromise;
    },
    [preferences, passengerBreakdown, cabinClass, stopsFilter, passengers]
  );

  // Search one-way
  const searchOneWay = useCallback(
    async (origin: string, destination: string, date: string) => {
      // Cancel any existing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new AbortController for this search
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const legId = "outbound";

      setLegResults((prev) => ({
        ...prev,
        [legId]: { legId, flights: [], isLoading: true, error: null },
      }));

      setIsSearching(true);
      setRoundTripParams(null);

      try {
        const flights = await searchLeg({ legId, origin, destination, date });
        
        // Only update state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setLegResults((prev) => ({
            ...prev,
            [legId]: { legId, flights, isLoading: false, error: null },
          }));

          if (flights.length === 0) {
            toast.info("No flights found for this route");
          } else {
            toast.success(`Found ${flights.length} flight options`);
          }
        }
      } catch (err: any) {
        // Don't show error if request was cancelled
        if (err.message === 'Request was cancelled') {
          return;
        }
        
        // Categorize error and get user-friendly message
        const flightError = categorizeFlightError(err, `origin: ${origin}, destination: ${destination}`);
        
        // Only update state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setLegResults((prev) => ({
            ...prev,
            [legId]: { legId, flights: [], isLoading: false, error: flightError.userMessage || flightError.message },
          }));
          
          // Only show toast if there's a user message (cancelled requests have empty message)
          if (flightError.userMessage) {
            toast.error(flightError.userMessage);
          }
        }
      } finally {
        // Only clear loading if request wasn't aborted (new search will set it)
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    },
    [searchLeg]
  );

  // Search round-trip - Sequential: outbound first, return on-demand
  const searchRoundTrip = useCallback(
    async (origin: string, destination: string, departDate: string, returnDate: string) => {
      // Cancel any existing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new AbortController for this search
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const outboundId = "outbound";
      const returnId = "return";

      // Store params for later return search
      setRoundTripParams({ origin, destination, departDate, returnDate });

      // Initialize outbound as loading, return as pending (not searched yet)
      setLegResults({
        [outboundId]: { legId: outboundId, flights: [], isLoading: true, error: null },
        [returnId]: { legId: returnId, flights: [], isLoading: false, error: null },
      });

      setIsSearching(true);

      // Search outbound only
      try {
        const outboundFlights = await searchLeg({ 
          legId: outboundId, 
          origin, 
          destination, 
          date: departDate 
        });
        
        // Only update state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setLegResults((prev) => ({
            ...prev,
            [outboundId]: { legId: outboundId, flights: outboundFlights, isLoading: false, error: null },
          }));

          if (outboundFlights.length === 0) {
            toast.info("No outbound flights found");
          } else {
            toast.success(`Found ${outboundFlights.length} outbound options. Select one to see return flights.`);
          }
        }
      } catch (err: any) {
        // Don't show error if request was cancelled
        if (err.message === 'Request was cancelled') {
          return;
        }
        
        // Categorize error and get user-friendly message
        const flightError = categorizeFlightError(err, `outbound: ${origin} → ${destination}`);
        
        // Only update state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setLegResults((prev) => ({
            ...prev,
            [outboundId]: { legId: outboundId, flights: [], isLoading: false, error: flightError.userMessage || flightError.message },
          }));
          
          if (flightError.userMessage) {
            toast.error(flightError.userMessage);
          }
        }
      } finally {
        // Only clear loading if request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    },
    [searchLeg]
  );

  // Search return leg (called when outbound is selected)
  const searchReturnLeg = useCallback(
    async () => {
      if (!roundTripParams) return;

      // Cancel any existing return search (but not outbound)
      // Note: We don't cancel the main controller here to avoid cancelling outbound
      // Instead, we'll check abort status in searchLeg

      const { origin, destination, returnDate } = roundTripParams;
      const returnId = "return";

      setLegResults((prev) => ({
        ...prev,
        [returnId]: { legId: returnId, flights: [], isLoading: true, error: null },
      }));

      setIsSearching(true);

      try {
        const returnFlights = await searchLeg({ 
          legId: returnId, 
          origin: destination, 
          destination: origin, 
          date: returnDate 
        });
        
        // Only update state if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setLegResults((prev) => ({
            ...prev,
            [returnId]: { legId: returnId, flights: returnFlights, isLoading: false, error: null },
          }));

          if (returnFlights.length === 0) {
            toast.info("No return flights found");
          } else {
            toast.success(`Found ${returnFlights.length} return options`);
          }
        }
      } catch (err: any) {
        // Don't show error if request was cancelled
        if (err.message === 'Request was cancelled') {
          return;
        }
        
        // Categorize error and get user-friendly message
        const flightError = categorizeFlightError(err, `return: ${destination} → ${origin}`);
        
        // Only update state if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setLegResults((prev) => ({
            ...prev,
            [returnId]: { legId: returnId, flights: [], isLoading: false, error: flightError.userMessage || flightError.message },
          }));
          
          if (flightError.userMessage) {
            toast.error(flightError.userMessage);
          }
        }
      } finally {
        // Only clear loading if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setIsSearching(false);
        }
      }
    },
    [searchLeg, roundTripParams]
  );

  // Search multi-city (parallel with concurrency limit)
  const searchMultiCity = useCallback(
    async (segments: Array<{ origin: string; destination: string; date: string }>) => {
      // Cancel any existing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new AbortController for this search
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Initialize all legs as loading
      const initialResults: Record<string, FlightLegResult> = {};
      segments.forEach((seg, idx) => {
        const legId = `segment-${idx + 1}`;
        initialResults[legId] = { legId, flights: [], isLoading: true, error: null };
      });
      setLegResults(initialResults);

      setIsSearching(true);
      setRoundTripParams(null);

      // Use Promise.allSettled for parallel search with safe error handling
      // Limit concurrency to 3 to avoid edge function timeouts
      const MAX_CONCURRENCY = 3;
      const results: Array<{ legId: string; result: PromiseSettledResult<ScoredFlight[]> }> = [];

      for (let i = 0; i < segments.length; i += MAX_CONCURRENCY) {
        const batch = segments.slice(i, i + MAX_CONCURRENCY);
        const batchResults = await Promise.allSettled(
          batch.map((seg, batchIdx) => {
            const legId = `segment-${i + batchIdx + 1}`;
            return searchLeg({ legId, origin: seg.origin, destination: seg.destination, date: seg.date });
          })
        );

        batchResults.forEach((result, batchIdx) => {
          const legId = `segment-${i + batchIdx + 1}`;
          results.push({ legId, result });
        });
      }

      // Update results
      const updatedResults: Record<string, FlightLegResult> = {};
      let totalFlights = 0;

      results.forEach(({ legId, result }) => {
        if (result.status === "fulfilled") {
          updatedResults[legId] = { legId, flights: result.value, isLoading: false, error: null };
          totalFlights += result.value.length;
        } else {
          // Don't show error if request was cancelled
          if (result.reason?.message === 'Request was cancelled') {
            updatedResults[legId] = {
              legId,
              flights: [],
              isLoading: false,
              error: null,
            };
          } else {
            // Categorize error for this leg
            const flightError = categorizeFlightError(result.reason, `segment ${legId}`);
            updatedResults[legId] = {
              legId,
              flights: [],
              isLoading: false,
              error: flightError.userMessage || flightError.message || "Failed to search this leg",
            };
          }
        }
      });

      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted) {
        setLegResults(updatedResults);
        setIsSearching(false);

        if (totalFlights > 0) {
          toast.success(`Found flights for ${results.filter((r) => r.result.status === "fulfilled").length} segments`);
        } else {
          toast.info("No flights found for the selected routes");
        }
      }
    },
    [searchLeg]
  );

  // Retry a specific leg
  const retryLeg = useCallback(
    async (legId: string, origin: string, destination: string, date: string) => {
      setLegResults((prev) => ({
        ...prev,
        [legId]: { legId, flights: [], isLoading: true, error: null },
      }));

      try {
        const flights = await searchLeg({ legId, origin, destination, date });
        setLegResults((prev) => ({
          ...prev,
          [legId]: { legId, flights, isLoading: false, error: null },
        }));
        toast.success(`Found ${flights.length} options for this leg`);
      } catch (err: any) {
        // Don't show error if request was cancelled
        if (err.message === 'Request was cancelled') {
          return;
        }
        
        // Categorize error and get user-friendly message
        const flightError = categorizeFlightError(err, `retry ${legId}: ${origin} → ${destination}`);
        
        setLegResults((prev) => ({
          ...prev,
          [legId]: { legId, flights: [], isLoading: false, error: flightError.userMessage || flightError.message },
        }));
        
        if (flightError.userMessage) {
          toast.error(flightError.userMessage);
        }
      }
    },
    [searchLeg]
  );

  // Clear all results
  const clearResults = useCallback(() => {
    // Cancel any pending searches when clearing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Clear active requests
    activeRequestsRef.current.clear();
    setLegResults({});
    setRoundTripParams(null);
    setIsSearching(false);
  }, []);

  // Check if return search is pending (for sequential round-trip)
  const isReturnPending = roundTripParams !== null && 
    legResults["return"]?.flights.length === 0 && 
    !legResults["return"]?.isLoading && 
    !legResults["return"]?.error;

  // Cleanup: Cancel any pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    legResults,
    isSearching,
    searchOneWay,
    searchRoundTrip,
    searchReturnLeg,
    searchMultiCity,
    retryLeg,
    clearResults,
    isReturnPending,
    roundTripParams,
  };
};
