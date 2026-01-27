import React, { useState, Suspense, lazy, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Country } from '@/hooks/useFamilyData';
import { useVisitDetails } from '@/hooks/useVisitDetails';
import { MapPin, ChevronDown, TrendingUp, Globe, Calendar, Clock, Repeat, Zap, Target, Route, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getYear, getMonth, parseISO } from 'date-fns';

// Lazy load the chart component
const ContinentProgressRings = lazy(() => import('./ContinentProgressRings'));

interface AnalyticsInsightCardProps {
  countries: Country[];
}

const CONTINENT_TOTALS: Record<string, number> = {
  'Africa': 54,
  'Asia': 48,
  'Europe': 44,
  'North America': 23,
  'South America': 12,
  'Oceania': 14,
  'Antarctica': 1,
};

const AnalyticsInsightCard = ({ countries }: AnalyticsInsightCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true); // Expanded by default
  const { visitDetails } = useVisitDetails();

  const visitedByContinent = countries
    .filter(c => c.visitedBy.length > 0)
    .reduce((acc, country) => {
      acc[country.continent] = (acc[country.continent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Find the most explored continent
  const continentData = Object.entries(CONTINENT_TOTALS)
    .filter(([name]) => name !== 'Antarctica')
    .map(([name, total]) => ({
      name,
      visited: visitedByContinent[name] || 0,
      total,
      percentage: Math.round(((visitedByContinent[name] || 0) / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const topContinent = continentData[0];
  const totalVisited = countries.filter(c => c.visitedBy.length > 0).length;
  const totalWorldPercentage = Math.round((totalVisited / 195) * 100);

  // 10 Interesting Analytics Insights
  const analyticsInsights = useMemo(() => {
    const visitedCountries = countries.filter(c => c.visitedBy.length > 0);
    const validVisits = visitDetails.filter(v => v.visit_date || v.approximate_year);
    
    // --- GROUPED TRIP LOGIC ---
    // Group visits by trip_group_id to treat multi-country trips as ONE trip
    // Visits without trip_group_id are standalone trips
    const tripGroups = new Map<string, typeof validVisits>();
    const standaloneVisits: typeof validVisits = [];
    
    validVisits.forEach(visit => {
      if (visit.trip_group_id) {
        const existing = tripGroups.get(visit.trip_group_id) || [];
        existing.push(visit);
        tripGroups.set(visit.trip_group_id, existing);
      } else {
        standaloneVisits.push(visit);
      }
    });
    
    // Calculate duration for each trip group (sum of all country segments)
    const groupedTripDurations: { groupId: string | null; totalDays: number; countries: string[]; tripName: string | null }[] = [];
    
    tripGroups.forEach((visits, groupId) => {
      const totalDays = visits.reduce((sum, v) => sum + (v.number_of_days || 0), 0);
      const countryNames = visits.map(v => {
        const country = visitedCountries.find(c => c.id === v.country_id);
        return country?.name || 'Unknown';
      });
      const tripName = visits[0]?.trip_name || null;
      if (totalDays > 0) {
        groupedTripDurations.push({ groupId, totalDays, countries: countryNames, tripName });
      }
    });
    
    // Add standalone visits as individual "trips"
    standaloneVisits.forEach(visit => {
      if (visit.number_of_days && visit.number_of_days > 0) {
        const country = visitedCountries.find(c => c.id === visit.country_id);
        groupedTripDurations.push({
          groupId: null,
          totalDays: visit.number_of_days,
          countries: [country?.name || 'Unknown'],
          tripName: visit.trip_name,
        });
      }
    });
    
    // Total trip count = unique trip groups + standalone visits
    const totalTripCount = tripGroups.size + standaloneVisits.length;
    
    // --- END GROUPED TRIP LOGIC ---
    
    // 1. Travel Frequency Over Time (counts visits, not trips - unchanged)
    const visitsByYear = validVisits.reduce((acc, visit) => {
      const year = visit.visit_date ? getYear(parseISO(visit.visit_date)) : (visit.approximate_year || 0);
      if (year > 0) acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    const mostActiveYear = Object.entries(visitsByYear).sort((a, b) => b[1] - a[1])[0];
    
    // 2. Average Trip Duration (NOW USES GROUPED DURATIONS)
    const avgDuration = groupedTripDurations.length > 0
      ? Math.round(groupedTripDurations.reduce((sum, t) => sum + t.totalDays, 0) / groupedTripDurations.length)
      : 0;
    
    // 3. Most Visited Country (unchanged - country-level stat)
    const countryVisitCounts = validVisits.reduce((acc, visit) => {
      const country = visitedCountries.find(c => c.id === visit.country_id);
      if (country) acc[country.name] = (acc[country.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostVisited = Object.entries(countryVisitCounts).sort((a, b) => b[1] - a[1])[0];
    
    // 4. Longest Single Trip (NOW USES GROUPED DURATIONS)
    const sortedTrips = [...groupedTripDurations].sort((a, b) => b.totalDays - a.totalDays);
    const longestGroupedTrip = sortedTrips[0] || null;
    
    // 5. Travel Seasonality
    const visitsByMonth = validVisits.reduce((acc, visit) => {
      if (visit.visit_date) {
        const month = getMonth(parseISO(visit.visit_date));
        acc[month] = (acc[month] || 0) + 1;
      } else if (visit.approximate_month) {
        acc[visit.approximate_month - 1] = (acc[visit.approximate_month - 1] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);
    const favoriteMonth = Object.entries(visitsByMonth).sort((a, b) => b[1] - a[1])[0];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // 6. Countries Visited Multiple Times
    const repeatVisits = Object.entries(countryVisitCounts).filter(([_, count]) => count > 1);
    
    // 6b. First-time vs Revisits Percentage
    const firstTimeCountries = Object.entries(countryVisitCounts).filter(([_, count]) => count === 1).length;
    const revisitCountries = repeatVisits.length;
    const totalUniqueCountries = Object.keys(countryVisitCounts).length;
    const firstTimePercentage = totalUniqueCountries > 0 ? Math.round((firstTimeCountries / totalUniqueCountries) * 100) : 0;
    const revisitPercentage = totalUniqueCountries > 0 ? Math.round((revisitCountries / totalUniqueCountries) * 100) : 0;
    
    // 6c. Top Countries by Days Spent
    const countryDaysMap = validVisits.reduce((acc, visit) => {
      const country = visitedCountries.find(c => c.id === visit.country_id);
      if (country && visit.number_of_days) {
        acc[country.name] = (acc[country.name] || 0) + (visit.number_of_days || 0);
      }
      return acc;
    }, {} as Record<string, number>);
    const topCountriesByDays = Object.entries(countryDaysMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, days]) => ({ name, days }));
    
    // 6d. New Countries Added YTD
    const currentYear = new Date().getFullYear();
    const firstVisitByCountry = new Map<string, number>();
    validVisits.forEach(visit => {
      const country = visitedCountries.find(c => c.id === visit.country_id);
      if (country) {
        const year = visit.visit_date ? getYear(parseISO(visit.visit_date)) : (visit.approximate_year || 0);
        if (year > 0) {
          const existing = firstVisitByCountry.get(country.name);
          if (!existing || year < existing) {
            firstVisitByCountry.set(country.name, year);
          }
        }
      }
    });
    const newCountriesYTD = Array.from(firstVisitByCountry.entries())
      .filter(([_, year]) => year === currentYear).length;
    
    // 7. Travel Velocity (countries per year)
    const years = Object.keys(visitsByYear).map(Number).sort();
    const firstYear = years[0];
    const lastYear = years[years.length - 1];
    const yearsActive = lastYear && firstYear ? lastYear - firstYear + 1 : 1;
    const velocity = yearsActive > 0 ? (totalVisited / yearsActive).toFixed(1) : '0';
    
    // 8. Trip Diversity (NOW USES GROUPED TRIP COUNT)
    // Count unique trips: trip groups + standalone visits with trip names
    const uniqueTripsCount = totalTripCount;
    
    // 9. Geographic Spread (continents visited)
    const continentsVisited = new Set(visitedCountries.map(c => c.continent)).size;
    
    // 10. Travel Streak (consecutive years)
    let maxStreak = 0;
    let currentStreak = 0;
    if (years.length > 0) {
      for (let i = 0; i < years.length; i++) {
        if (i === 0 || years[i] === years[i - 1] + 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
    }

    return {
      mostActiveYear: mostActiveYear ? { year: mostActiveYear[0], count: mostActiveYear[1] } : null,
      avgDuration,
      mostVisited: mostVisited ? { country: mostVisited[0], count: mostVisited[1] } : null,
      // Longest trip now uses grouped duration (multi-country trips count as one)
      longestTrip: longestGroupedTrip ? {
        country: longestGroupedTrip.countries.length > 1 
          ? `${longestGroupedTrip.countries.length} countries` 
          : longestGroupedTrip.countries[0],
        days: longestGroupedTrip.totalDays,
        tripName: longestGroupedTrip.tripName,
      } : null,
      favoriteMonth: favoriteMonth ? { month: monthNames[parseInt(favoriteMonth[0])], count: favoriteMonth[1] } : null,
      repeatVisits: repeatVisits.length,
      firstTimePercentage,
      revisitPercentage,
      topCountriesByDays: topCountriesByDays.length > 0 ? topCountriesByDays : null,
      newCountriesYTD: newCountriesYTD > 0 ? newCountriesYTD : null,
      velocity,
      // Trip count now uses grouped logic (multi-country = 1 trip)
      uniqueTrips: uniqueTripsCount,
      continentsVisited,
      maxStreak
    };
  }, [countries, visitDetails]);

  // Key insight message
  const getInsightMessage = () => {
    if (totalVisited === 0) return "Start your journey! Add your first country to see insights.";
    if (topContinent.percentage >= 50) {
      return `You've explored over half of ${topContinent.name}! Consider branching out to ${continentData[continentData.length - 1].name}.`;
    }
    if (totalVisited >= 10) {
      return `Great progress! ${topContinent.name} is your most explored continent at ${topContinent.percentage}%.`;
    }
    return `${topContinent.name} is your focus area. Keep exploring!`;
  };

  return (
    <Card className="bg-card border-border">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              Continent Progress
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                {isExpanded ? 'Collapse' : 'Expand'}
                <ChevronDown className={cn("ml-1 h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Key insight - always visible */}
          <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {getInsightMessage()}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {totalVisited} countries ({totalWorldPercentage}% of world)
                  </span>
                  {topContinent && (
                    <span>
                      Top: {topContinent.name} ({topContinent.percentage}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mini progress bars - always visible */}
          <div className="grid grid-cols-3 gap-3">
            {continentData.slice(0, 6).map((continent) => (
              <div key={continent.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate">{continent.name}</span>
                  <span className="font-medium text-foreground">{continent.percentage}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${continent.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Expanded content - detailed view */}
          <CollapsibleContent className="mt-4">
            <Suspense fallback={
              <div className="h-40 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <div className="pt-4 border-t border-border space-y-6">
                {/* Continent Progress Rings */}
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-foreground">Continent Progress</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {continentData.map((continent) => (
                      <div key={continent.name} className="flex flex-col items-center">
                        <div className="relative w-16 h-16">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              className="text-muted/30"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="hsl(var(--primary))"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${(continent.percentage / 100) * 175.9} 175.9`}
                              strokeLinecap="round"
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-foreground">
                              {continent.percentage}%
                            </span>
                          </div>
                        </div>
                        <h4 className="mt-2 font-medium text-foreground text-center text-xs">
                          {continent.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {continent.visited}/{continent.total}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 10 Analytics Insights */}
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-foreground">Travel Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analyticsInsights.mostActiveYear && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Most Active Year</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.mostActiveYear.year}: {analyticsInsights.mostActiveYear.count} visits
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {analyticsInsights.avgDuration > 0 && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-secondary/10">
                            <Clock className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Average Trip Duration</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.avgDuration} days per trip
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {analyticsInsights.mostVisited && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-accent/10">
                            <Repeat className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Most Visited Country</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.mostVisited.country} ({analyticsInsights.mostVisited.count} times)
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {analyticsInsights.longestTrip && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-purple-500/10">
                            <Route className="h-4 w-4 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Longest Trip</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.longestTrip.tripName 
                                ? `${analyticsInsights.longestTrip.tripName}: ` 
                                : ''}{analyticsInsights.longestTrip.country} ({analyticsInsights.longestTrip.days} days)
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {analyticsInsights.favoriteMonth && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-orange-500/10">
                            <Calendar className="h-4 w-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Favorite Travel Month</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.favoriteMonth.month} ({analyticsInsights.favoriteMonth.count} visits)
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {analyticsInsights.repeatVisits > 0 && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-cyan-500/10">
                            <Repeat className="h-4 w-4 text-cyan-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Return Visits</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.repeatVisits} countries visited multiple times
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {analyticsInsights.velocity !== '0' && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-emerald-500/10">
                            <Zap className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Travel Velocity</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.velocity} countries per year
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {analyticsInsights.uniqueTrips > 0 && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-pink-500/10">
                            <Plane className="h-4 w-4 text-pink-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Trip Diversity</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.uniqueTrips} unique trips recorded
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {analyticsInsights.continentsVisited > 0 && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-indigo-500/10">
                            <Globe className="h-4 w-4 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Continental Coverage</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.continentsVisited} of 7 continents explored
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {analyticsInsights.maxStreak > 0 && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-amber-500/10">
                            <Target className="h-4 w-4 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Travel Streak</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.maxStreak} consecutive years of travel
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* First-time vs Revisits */}
                    {analyticsInsights.firstTimePercentage !== undefined && analyticsInsights.revisitPercentage !== undefined && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-blue-500/10">
                            <Repeat className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Visit Pattern</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.firstTimePercentage}% first-time, {analyticsInsights.revisitPercentage}% revisits
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Top Countries by Days */}
                    {analyticsInsights.topCountriesByDays && analyticsInsights.topCountriesByDays.length > 0 && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-teal-500/10">
                            <Clock className="h-4 w-4 text-teal-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Top by Days Spent</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.topCountriesByDays[0]?.name}: {analyticsInsights.topCountriesByDays[0]?.days} days
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* New Countries YTD */}
                    {analyticsInsights.newCountriesYTD !== null && analyticsInsights.newCountriesYTD > 0 && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-green-500/10">
                            <Zap className="h-4 w-4 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">New Countries This Year</p>
                            <p className="text-xs text-muted-foreground">
                              {analyticsInsights.newCountriesYTD} new countries added
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </Suspense>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};

export default AnalyticsInsightCard;
