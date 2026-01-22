import { useMemo, memo, ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe2, Users, Plane, Calendar, Share2, MapPin } from "lucide-react";
import { Country, FamilyMember } from "@/hooks/useFamilyData";
import { useHomeCountry } from "@/hooks/useHomeCountry";
import { useStateVisits } from "@/hooks/useStateVisits";
import { useVisitDetails } from "@/hooks/useVisitDetails";
import CountryFlag from "@/components/common/CountryFlag";
import ContinentBreakdownDialog from "./ContinentBreakdownDialog";
import { getEffectiveFlagCode } from "@/lib/countriesData";
interface HeroSummaryCardProps {
  countries: Country[];
  familyMembers: FamilyMember[];
  totalContinents: number;
  homeCountry?: string | null;
  filterComponent?: ReactNode;
  earliestYear?: number | null;
  visitMemberMap?: Map<string, string[]>;
  selectedMemberId?: string | null;
}

const HeroSummaryCard = memo(({ 
  countries, 
  familyMembers, 
  totalContinents, 
  homeCountry, 
  filterComponent,
  earliestYear,
  visitMemberMap,
  selectedMemberId
}: HeroSummaryCardProps) => {
  const navigate = useNavigate();
  const [showContinentDialog, setShowContinentDialog] = useState(false);
  const [showCountriesDialog, setShowCountriesDialog] = useState(false);
  const [showStatesDialog, setShowStatesDialog] = useState(false);
  const [showSinceDialog, setShowSinceDialog] = useState(false);
  const resolvedHome = useHomeCountry(homeCountry);
  const { getStateVisitCount, stateVisits } = useStateVisits();
  const { visitDetails } = useVisitDetails();
  const [shareLoading, setShareLoading] = useState(false);
  
  // Exclude home country from visited countries count
  const visitedCountries = useMemo(() => 
    countries.filter(c => c.visitedBy.length > 0 && !resolvedHome.isHomeCountry(c.name)),
    [countries, resolvedHome]
  );

  // Get states visited for home country (filtered by selected member if applicable)
  const statesVisitedCount = useMemo(() => {
    if (!resolvedHome.iso2 || !resolvedHome.hasStateTracking) return 0;
    if (selectedMemberId) {
      // Filter by selected member
      const uniqueStates = new Set(
        stateVisits
          .filter(sv => sv.country_code === resolvedHome.iso2 && sv.family_member_id === selectedMemberId)
          .map(sv => sv.state_code)
      );
      return uniqueStates.size;
    }
    return getStateVisitCount(resolvedHome.iso2);
  }, [resolvedHome, getStateVisitCount, stateVisits, selectedMemberId]);

  // Handle stat card clicks
  const handleStatClick = (label: string) => {
    if (label === "Countries") {
      setShowCountriesDialog(true);
    } else if (label === "Continents") {
      setShowContinentDialog(true);
    } else if (label === "States") {
      setShowStatesDialog(true);
    } else if (label === "Since") {
      setShowSinceDialog(true);
    }
  };

  const isClickable = (label: string) => ["Countries", "Continents", "States", "Since"].includes(label);
  const stats = useMemo(() => {
    const baseStats: Array<{
      icon: typeof Globe2 | null;
      value: number | string;
      label: string;
      color: string;
      bgColor: string;
      flagCode?: string;
    }> = [
      {
        icon: Globe2,
        value: visitedCountries.length,
        label: "Countries",
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
    ];

    // Add states visited if home country supports it - use home country flag as icon
    if (resolvedHome.hasStateTracking && statesVisitedCount > 0) {
      baseStats.push({
        icon: null, // Will use flag instead
        value: statesVisitedCount,
        label: "States",
        color: "text-accent",
        bgColor: "bg-accent/10",
        flagCode: resolvedHome.iso2,
      });
    }

    baseStats.push({
      icon: Plane,
      value: totalContinents,
      label: "Continents",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    });

    if (earliestYear) {
      baseStats.push({
        icon: Calendar,
        value: `'${earliestYear.toString().slice(-2)}`,
        label: "Since",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
      });
    }

    return baseStats;
  }, [visitedCountries.length, totalContinents, earliestYear, resolvedHome.hasStateTracking, statesVisitedCount]);

  const progressPercent = useMemo(() => 
    Math.round((visitedCountries.length / 195) * 100),
    [visitedCountries.length]
  );

  const handleShareDashboard = async () => {
    setShareLoading(true);
    try {
      const url = `${window.location.origin}/travel-history?tab=overview`;
      if (navigator.share) {
        await navigator.share({
          title: "Our family travel dashboard",
          text: "See our travel stats and analytics on Family Travel Tracker.",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch {
      // ignore cancel/errors
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Your Travel Journey
            </h2>
            <p className="text-sm text-muted-foreground">
              {visitedCountries.length > 0 
                ? `Exploring the world, one country at a time`
                : `Start your adventure today`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {filterComponent}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={handleShareDashboard}
              disabled={shareLoading}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share dashboard
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={handleShareDashboard}
              disabled={shareLoading}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const clickable = isClickable(stat.label);
            return (
              <div
                key={index}
                onClick={() => handleStatClick(stat.label)}
                className={`flex flex-col items-center text-center p-3 rounded-xl bg-background/60 backdrop-blur-sm transition-all ${
                  clickable 
                    ? "cursor-pointer hover:bg-background/80 hover:scale-105 active:scale-95" 
                    : ""
                }`}
              >
                <div className={`p-2 rounded-full ${stat.bgColor} mb-2`}>
                  {stat.flagCode ? (
                    <CountryFlag countryCode={stat.flagCode} countryName="Home" size="sm" />
                  ) : Icon ? (
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  ) : null}
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>World exploration</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>

      <ContinentBreakdownDialog
        open={showContinentDialog}
        onOpenChange={setShowContinentDialog}
        countries={countries}
        homeCountryName={resolvedHome.name}
      />

      {/* Countries Dialog */}
      <Dialog open={showCountriesDialog} onOpenChange={setShowCountriesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              Visited Countries
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {visitedCountries.length} {visitedCountries.length === 1 ? 'country' : 'countries'} visited
            </p>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-2 gap-2">
              {visitedCountries
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((country) => {
                  const { code, isSubdivision } = getEffectiveFlagCode(country.name, country.flag);
                  return (
                    <div
                      key={country.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-2xl inline-flex items-center">
                        {isSubdivision || code ? (
                          <CountryFlag countryCode={code} countryName={country.name} size="lg" />
                        ) : (
                          country.flag
                        )}
                      </span>
                      <span className="text-sm font-medium">{country.name}</span>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* States Dialog */}
      {resolvedHome.hasStateTracking && (
        <Dialog open={showStatesDialog} onOpenChange={setShowStatesDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                Visited States
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {statesVisitedCount} of 50 states visited
              </p>
            </DialogHeader>
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-2 gap-2">
                {stateVisits
                  .filter(sv => {
                    // Filter by country code
                    if (sv.country_code !== resolvedHome.iso2) return false;
                    // Filter by selected member if applicable
                    if (selectedMemberId && sv.family_member_id !== selectedMemberId) return false;
                    return true;
                  })
                  .sort((a, b) => a.state_name.localeCompare(b.state_name))
                  // Get unique states (remove duplicates by state_code)
                  .filter((sv, index, self) => 
                    index === self.findIndex(s => s.state_code === sv.state_code)
                  )
                  .map((stateVisit) => (
                    <div
                      key={stateVisit.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium">{stateVisit.state_name}</span>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* Since Dialog */}
      {earliestYear && (
        <Dialog open={showSinceDialog} onOpenChange={setShowSinceDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Traveling Since {earliestYear}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {selectedMemberId 
                  ? `${familyMembers.find(m => m.id === selectedMemberId)?.name || 'Member'}'s visits from ${earliestYear}`
                  : `Visits from ${earliestYear}`
                }
              </p>
            </DialogHeader>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {(() => {
                  // Filter visits for the selected member from the earliest year
                  const filteredVisits = visitDetails
                    .filter(visit => {
                      if (!visit || !visit.id) return false;
                      
                      // CRITICAL: Filter by selected member FIRST - only show visits where this member was present
                      if (selectedMemberId && visitMemberMap) {
                        const memberIds = visitMemberMap.get(visit.id);
                        if (!memberIds || !memberIds.includes(selectedMemberId)) {
                          return false;
                        }
                      } else if (selectedMemberId) {
                        // If we have a selected member but no map data, don't show anything
                        return false;
                      }
                      
                      // Filter by earliest year (only after member filter passes)
                      let year: number | null = null;
                      if (visit.visit_date) {
                        const visitDate = new Date(visit.visit_date);
                        if (!isNaN(visitDate.getTime())) {
                          year = visitDate.getFullYear();
                        }
                      } else if (visit.approximate_year) {
                        year = visit.approximate_year;
                      }
                      
                      // Only show visits from the earliest year
                      return year === earliestYear;
                    })
                    .sort((a, b) => {
                      const dateA = a.visit_date ? new Date(a.visit_date).getTime() : 0;
                      const dateB = b.visit_date ? new Date(b.visit_date).getTime() : 0;
                      return dateA - dateB;
                    });
                  
                  if (filteredVisits.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No visits found for {selectedMemberId ? familyMembers.find(m => m.id === selectedMemberId)?.name || 'this member' : 'this year'}</p>
                      </div>
                    );
                  }
                  
                  return filteredVisits.map((visit) => {
                    if (!visit || !visit.country_id) return null;
                    
                    const country = countries.find(c => c.id === visit.country_id);
                    if (!country) return null;
                    
                    // Double-check: ensure this country is actually visited by the selected member
                    if (selectedMemberId) {
                      const member = familyMembers.find(m => m.id === selectedMemberId);
                      if (member && !country.visitedBy.includes(member.name)) {
                        return null;
                      }
                    }
                    
                    const { code, isSubdivision } = getEffectiveFlagCode(country.name, country.flag);
                    const visitDate = visit.visit_date 
                      ? new Date(visit.visit_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      : visit.approximate_year 
                        ? `${visit.approximate_year}${visit.approximate_month ? ` (${new Date(2000, visit.approximate_month - 1).toLocaleDateString('en-US', { month: 'long' })})` : ''}`
                        : 'Unknown date';
                    
                    return (
                      <div
                        key={visit.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <span className="text-2xl inline-flex items-center">
                          {isSubdivision || code ? (
                            <CountryFlag countryCode={code} countryName={country.name} size="lg" />
                          ) : (
                            country.flag
                          )}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium">{country.name}</div>
                          <div className="text-sm text-muted-foreground">{visitDate}</div>
                        </div>
                      </div>
                    );
                  }).filter(Boolean);
                })()}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
});

HeroSummaryCard.displayName = "HeroSummaryCard";

export default HeroSummaryCard;
