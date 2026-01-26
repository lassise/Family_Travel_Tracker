/**
 * Validate flight API response structure
 */

import type { FlightResult } from "./flightScoring";
import { logger } from "./logger";

export interface ValidationIssue {
  field: string;
  issue: string;
  severity: 'error' | 'warning';
}

/**
 * Validate a single flight result
 */
export const validateFlightResult = (flight: any, index: number): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  // Required fields
  if (!flight.id) {
    issues.push({ field: 'id', issue: 'Missing flight ID', severity: 'error' });
  }

  if (flight.price === null || flight.price === undefined || isNaN(flight.price)) {
    issues.push({ field: 'price', issue: 'Invalid or missing price', severity: 'error' });
  } else if (flight.price < 0) {
    issues.push({ field: 'price', issue: 'Price cannot be negative', severity: 'error' });
  }

  if (!flight.itineraries || !Array.isArray(flight.itineraries) || flight.itineraries.length === 0) {
    issues.push({ field: 'itineraries', issue: 'Missing or empty itineraries', severity: 'error' });
  } else {
    // Validate each itinerary
    flight.itineraries.forEach((itinerary: any, itIndex: number) => {
      if (!itinerary.segments || !Array.isArray(itinerary.segments) || itinerary.segments.length === 0) {
        issues.push({
          field: `itineraries[${itIndex}].segments`,
          issue: 'Missing or empty segments',
          severity: 'error',
        });
      } else {
        // Validate each segment
        itinerary.segments.forEach((segment: any, segIndex: number) => {
          if (!segment.departureAirport) {
            issues.push({
              field: `itineraries[${itIndex}].segments[${segIndex}].departureAirport`,
              issue: 'Missing departure airport',
              severity: 'error',
            });
          }

          if (!segment.arrivalAirport) {
            issues.push({
              field: `itineraries[${itIndex}].segments[${segIndex}].arrivalAirport`,
              issue: 'Missing arrival airport',
              severity: 'error',
            });
          }

          if (!segment.departureTime) {
            issues.push({
              field: `itineraries[${itIndex}].segments[${segIndex}].departureTime`,
              issue: 'Missing departure time',
              severity: 'warning',
            });
          }

          if (!segment.arrivalTime) {
            issues.push({
              field: `itineraries[${itIndex}].segments[${segIndex}].arrivalTime`,
              issue: 'Missing arrival time',
              severity: 'warning',
            });
          }

          // Validate duration
          if (segment.duration === null || segment.duration === undefined) {
            issues.push({
              field: `itineraries[${itIndex}].segments[${segIndex}].duration`,
              issue: 'Missing duration',
              severity: 'warning',
            });
          }
        });
      }
    });
  }

  // Validate currency
  if (flight.currency && typeof flight.currency !== 'string') {
    issues.push({ field: 'currency', issue: 'Invalid currency type', severity: 'warning' });
  }

  return issues;
};

/**
 * Validate and sanitize flight results array
 */
export const validateFlightResults = (flights: any[]): {
  valid: FlightResult[];
  invalid: Array<{ flight: any; issues: ValidationIssue[] }>;
  warnings: ValidationIssue[];
} => {
  const valid: FlightResult[] = [];
  const invalid: Array<{ flight: any; issues: ValidationIssue[] }> = [];
  const warnings: ValidationIssue[] = [];

  if (!Array.isArray(flights)) {
    logger.error('Flight results is not an array:', flights);
    return { valid: [], invalid: [], warnings: [] };
  }

  flights.forEach((flight, index) => {
    const issues = validateFlightResult(flight, index);
    const errors = issues.filter(i => i.severity === 'error');
    const flightWarnings = issues.filter(i => i.severity === 'warning');

    if (errors.length > 0) {
      invalid.push({ flight, issues: errors });
      logger.warn(`Flight ${index} has validation errors:`, errors);
    } else {
      // Flight is valid, add to valid list
      valid.push(flight as FlightResult);
    }

    // Collect warnings
    if (flightWarnings.length > 0) {
      warnings.push(...flightWarnings);
      logger.warn(`Flight ${index} has validation warnings:`, flightWarnings);
    }
  });

  if (invalid.length > 0) {
    logger.warn(`Filtered out ${invalid.length} invalid flights out of ${flights.length} total`);
  }

  return { valid, invalid, warnings };
};

/**
 * Sanitize flight data to ensure safe access
 */
export const sanitizeFlight = (flight: any): Partial<FlightResult> => {
  return {
    id: flight.id || `unknown-${Date.now()}`,
    price: typeof flight.price === 'number' && !isNaN(flight.price) ? flight.price : 0,
    currency: flight.currency || 'USD',
    itineraries: Array.isArray(flight.itineraries) ? flight.itineraries : [],
    departureAirport: flight.departureAirport || '',
    isAlternateOrigin: flight.isAlternateOrigin || false,
    minSavingsRequired: flight.minSavingsRequired || 0,
    layovers: Array.isArray(flight.layovers) ? flight.layovers : [],
  };
};
