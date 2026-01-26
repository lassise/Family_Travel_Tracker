/**
 * Trip Analytics Component
 * Displays trip-level metrics: duration, complexity score, pace score
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Route, Calendar, MapPin, Building2 } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { useTripCountries } from "@/hooks/useTripCountries";
import type { Trip } from "@/hooks/useTrips";

interface TripAnalyticsProps {
  trip: Trip;
  itineraryDays: Array<{ itinerary_items?: Array<{ location_name?: string | null }> }>;
  trainSegments: Array<unknown>;
  lodgingSuggestions: Array<unknown>;
}

export const TripAnalytics = ({ 
  trip, 
  itineraryDays, 
  trainSegments, 
  lodgingSuggestions 
}: TripAnalyticsProps) => {
  const { getCountriesForTrip } = useTripCountries();

  const analytics = useMemo(() => {
    // 1. Trip Duration (nights/days)
    let tripDuration: { nights: number; days: number } | null = null;
    if (trip.start_date && trip.end_date) {
      try {
        const start = parseISO(trip.start_date);
        const end = parseISO(trip.end_date);
        const days = differenceInDays(end, start);
        tripDuration = {
          nights: Math.max(0, days),
          days: days + 1, // Include both start and end day
        };
      } catch (error) {
        // Invalid dates, skip
      }
    }

    // 2. Trip Complexity Score
    const tripCountries = getCountriesForTrip(trip.id);
    const countriesCount = tripCountries.length;
    
    // Count unique cities from itinerary items
    const citiesSet = new Set<string>();
    itineraryDays.forEach(day => {
      day.itinerary_items?.forEach(item => {
        if (item.location_name) {
          citiesSet.add(item.location_name);
        }
      });
    });
    const citiesCount = citiesSet.size;
    
    // Flight segments - not directly linked to trips, default to 0
    // Could be enhanced later if trip_flights table exists
    const flightSegmentsCount = 0;
    
    // Stay moves - count lodging suggestions as proxy for accommodation changes
    const stayMovesCount = lodgingSuggestions.length;
    
    const complexityScore = countriesCount + citiesCount + flightSegmentsCount + stayMovesCount;
    const hasComplexityData = countriesCount > 0 || citiesCount > 0 || stayMovesCount > 0;

    // 3. Pace Score (activities per day)
    const totalActivities = itineraryDays.reduce((sum, day) => {
      return sum + (day.itinerary_items?.length || 0);
    }, 0);
    
    const totalDays = itineraryDays.length || (tripDuration?.days || 0);
    const activitiesPerDay = totalDays > 0 && totalActivities > 0 
      ? (totalActivities / totalDays).toFixed(1) 
      : null;

    return {
      tripDuration,
      complexityScore,
      hasComplexityData,
      complexityBreakdown: {
        countries: countriesCount,
        cities: citiesCount,
        flightSegments: flightSegmentsCount,
        stayMoves: stayMovesCount,
      },
      activitiesPerDay,
      totalActivities,
      totalDays,
    };
  }, [trip, itineraryDays, trainSegments, lodgingSuggestions, getCountriesForTrip]);

  // Don't render if no data available
  if (!analytics.tripDuration && !analytics.hasComplexityData && !analytics.activitiesPerDay) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Route className="h-5 w-5 text-primary" />
          Trip Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Trip Duration */}
          {analytics.tripDuration && (
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 rounded-full bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Trip Duration</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.tripDuration.nights} {analytics.tripDuration.nights === 1 ? 'night' : 'nights'} 
                  {' '}({analytics.tripDuration.days} {analytics.tripDuration.days === 1 ? 'day' : 'days'})
                </p>
              </div>
            </div>
          )}

          {/* Complexity Score */}
          {analytics.hasComplexityData && (
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 rounded-full bg-secondary/10">
                <Zap className="h-4 w-4 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Complexity Score</p>
                <p className="text-xs text-muted-foreground mb-1">
                  {analytics.complexityScore} points
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analytics.complexityBreakdown.countries > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      <MapPin className="h-2.5 w-2.5 mr-1" />
                      {analytics.complexityBreakdown.countries} {analytics.complexityBreakdown.countries === 1 ? 'country' : 'countries'}
                    </Badge>
                  )}
                  {analytics.complexityBreakdown.cities > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      <Building2 className="h-2.5 w-2.5 mr-1" />
                      {analytics.complexityBreakdown.cities} {analytics.complexityBreakdown.cities === 1 ? 'city' : 'cities'}
                    </Badge>
                  )}
                  {analytics.complexityBreakdown.stayMoves > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      <Calendar className="h-2.5 w-2.5 mr-1" />
                      {analytics.complexityBreakdown.stayMoves} {analytics.complexityBreakdown.stayMoves === 1 ? 'stay' : 'stays'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pace Score */}
          {analytics.activitiesPerDay && (
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 rounded-full bg-accent/10">
                <Zap className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Pace Score</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.activitiesPerDay} activities/day
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {analytics.totalActivities} total activities over {analytics.totalDays} {analytics.totalDays === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Show "Not enough data" for missing metrics */}
        {(!analytics.tripDuration || !analytics.hasComplexityData || !analytics.activitiesPerDay) && (
          <p className="text-xs text-muted-foreground mt-3 italic">
            Some metrics require trip dates, countries, or activities to calculate.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
