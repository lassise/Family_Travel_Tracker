/**
 * Flight duration calculation utilities
 * Handles total trip duration including layovers
 */

// Import parseDuration - it's not exported, so we'll define our own
const parseDuration = (duration: string | number | undefined | null): number => {
  if (duration === null || duration === undefined) return 0;
  if (typeof duration === 'number') {
    return Math.max(0, Math.round(duration));
  }
  if (typeof duration !== 'string' || duration.trim() === '') return 0;
  
  try {
    const hoursMatch = duration.match(/(\d+)H/);
    const minutesMatch = duration.match(/(\d+)M/);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0) {
      logger.warn('Invalid duration format:', duration);
      return 0;
    }
    
    return Math.max(0, hours * 60 + minutes);
  } catch (error) {
    logger.warn('Error parsing duration:', duration, error);
    return 0;
  }
};
import type { FlightResult, FlightItinerary } from "./flightScoring";
import { logger } from "./logger";

/**
 * Calculate total trip duration from first departure to final arrival
 * This includes all flight segments AND layover time
 */
export const calculateTotalTripDuration = (flight: FlightResult): number => {
  if (!flight.itineraries || flight.itineraries.length === 0) {
    return 0;
  }

  // Method 1: Use API's totalDuration if available (most accurate)
  if (flight.totalDuration && typeof flight.totalDuration === 'number') {
    return flight.totalDuration;
  }

  // Method 2: Calculate from first departure to last arrival
  const firstItinerary = flight.itineraries[0];
  const lastItinerary = flight.itineraries[flight.itineraries.length - 1];
  
  if (!firstItinerary || !lastItinerary) {
    return 0;
  }

  const firstSegment = firstItinerary.segments[0];
  const lastSegment = lastItinerary.segments[lastItinerary.segments.length - 1];

  if (!firstSegment?.departureTime || !lastSegment?.arrivalTime) {
    // Fallback to summing segment durations if times not available
    return sumSegmentDurations(flight);
  }

  try {
    const departure = new Date(firstSegment.departureTime);
    const arrival = new Date(lastSegment.arrivalTime);

    if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) {
      logger.warn('Invalid dates for duration calculation, falling back to segment sum');
      return sumSegmentDurations(flight);
    }

    const totalMs = arrival.getTime() - departure.getTime();
    const totalMinutes = Math.round(totalMs / (1000 * 60));

    // Validate: total should be positive and reasonable
    if (totalMinutes < 0) {
      logger.warn('Negative total duration calculated, using segment sum instead');
      return sumSegmentDurations(flight);
    }

    // Sanity check: total should be at least as long as sum of segments
    const segmentSum = sumSegmentDurations(flight);
    if (totalMinutes < segmentSum * 0.8) {
      // If calculated total is significantly less than segment sum, something's wrong
      logger.warn('Total duration seems incorrect, using segment sum');
      return segmentSum;
    }

    return totalMinutes;
  } catch (error) {
    logger.warn('Error calculating total duration from times, using segment sum:', error);
    return sumSegmentDurations(flight);
  }
};

/**
 * Sum all segment durations (does NOT include layover time)
 * Use this when you only want flight time, not total trip time
 */
export const sumSegmentDurations = (flight: FlightResult): number => {
  if (!flight.itineraries || flight.itineraries.length === 0) {
    return 0;
  }

  let total = 0;
  for (const itinerary of flight.itineraries) {
    if (!itinerary.segments || !Array.isArray(itinerary.segments)) {
      continue;
    }
    for (const segment of itinerary.segments) {
      total += parseDuration(segment.duration);
    }
  }

  return total;
};

/**
 * Calculate total layover time for a flight
 */
export const calculateTotalLayoverTime = (flight: FlightResult): number => {
  if (!flight.itineraries || flight.itineraries.length === 0) {
    return 0;
  }

  let totalLayover = 0;

  for (const itinerary of flight.itineraries) {
    if (!itinerary.segments || itinerary.segments.length < 2) {
      continue; // No layovers for single-segment flights
    }

    for (let i = 0; i < itinerary.segments.length - 1; i++) {
      const seg1 = itinerary.segments[i];
      const seg2 = itinerary.segments[i + 1];

      if (!seg1?.arrivalTime || !seg2?.departureTime) {
        continue;
      }

      try {
        const arrival = new Date(seg1.arrivalTime);
        const departure = new Date(seg2.departureTime);

        if (isNaN(arrival.getTime()) || isNaN(departure.getTime())) {
          continue;
        }

        const layoverMs = departure.getTime() - arrival.getTime();
        const layoverMins = Math.round(layoverMs / (1000 * 60));

        if (layoverMins > 0) {
          totalLayover += layoverMins;
        }
      } catch (error) {
        logger.warn('Error calculating layover time:', error);
      }
    }
  }

  return totalLayover;
};

/**
 * Format duration in minutes to human-readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 0 || isNaN(minutes)) {
    return 'N/A';
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};
