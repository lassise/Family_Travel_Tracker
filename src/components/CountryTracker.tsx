import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, Trash2, Calendar, MapPin, Clock, ChevronDown, Plus, Search, X, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AddCountryModal from "./countries/AddCountryModal";
import CountryVisitDetailsDialog from "./CountryVisitDetailsDialog";
import { Country } from "@/hooks/useFamilyData";
import { useVisitDetails } from "@/hooks/useVisitDetails";
import { getAllCountries, getRegionCode } from "@/lib/countriesData";
import { cn } from "@/lib/utils";
import CountryFlag from "./common/CountryFlag";
import CountryFilters from "./travel/CountryFilters";
import DeleteConfirmDialog from "./common/DeleteConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CombineMultiCountryTripsDialog } from "./countries/CombineMultiCountryTripsDialog";

interface CountryTrackerProps {
  countries: Country[];
  familyMembers: Array<{ id: string; name: string }>;
  onUpdate: () => void;
}

const CountryTracker = ({ countries, familyMembers, onUpdate }: CountryTrackerProps) => {
  const { toast } = useToast();
  const { visitDetails, getCountrySummary, refetch: refetchVisitDetails } = useVisitDetails();
  const allCountriesData = getAllCountries();
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'visits' | 'days' | 'recent' | 'continent'>('name');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; countryId: string; countryName: string }>({
    open: false,
    countryId: '',
    countryName: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [newCountryVisitDialog, setNewCountryVisitDialog] = useState<{
    open: boolean;
    countryId: string;
    countryName: string;
    countryCode: string;
  } | null>(null);

  // Get unique continents and years from countries
  const { continents, years } = useMemo(() => {
    const continentSet = new Set<string>();
    const yearSet = new Set<number>();
    
    countries.forEach(c => continentSet.add(c.continent));
    
    visitDetails.forEach(v => {
      if (v.visit_date) {
        yearSet.add(new Date(v.visit_date).getFullYear());
      } else if (v.approximate_year) {
        yearSet.add(v.approximate_year);
      }
    });
    
    return {
      continents: Array.from(continentSet).sort(),
      years: Array.from(yearSet).sort((a, b) => b - a)
    };
  }, [countries, visitDetails]);

  // Filter and sort countries based on selected filters, search query, and sort option
  const filteredCountries = useMemo(() => {
    let result = countries;
    
    // Apply search filter first (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(c => {
        const countryName = c.name.toLowerCase();
        const continent = c.continent.toLowerCase();
        // Also search in cities if available
        const summary = getCountrySummary(c.id);
        const citiesMatch = summary.cities.some(city => city.toLowerCase().includes(query));
        return countryName.includes(query) || continent.includes(query) || citiesMatch;
      });
    }
    
    if (selectedContinent !== 'all') {
      result = result.filter(c => c.continent === selectedContinent);
    }
    
    if (selectedYear !== 'all') {
      const year = parseInt(selectedYear);
      const countryIdsForYear = new Set(
        visitDetails
          .filter(v => {
            if (v.visit_date) {
              return new Date(v.visit_date).getFullYear() === year;
            }
            return v.approximate_year === year;
          })
          .map(v => v.country_id)
      );
      result = result.filter(c => countryIdsForYear.has(c.id));
    }
    
    // Helper function to get most recent visit date for a country
    const getMostRecentDate = (countryId: string): number => {
      const countryVisits = visitDetails
        .filter(v => v.country_id === countryId)
        .map(v => {
          if (v.visit_date) return new Date(v.visit_date).getTime();
          if (v.approximate_year) {
            // Use approximate year (set to mid-year for sorting)
            return new Date(v.approximate_year, 6, 1).getTime();
          }
          return 0;
        });
      // Return most recent date, or 0 if no visits
      return countryVisits.length > 0 ? Math.max(...countryVisits) : 0;
    };
    
    // Apply sorting
    const sortedResult = [...result].sort((a, b) => {
      const summaryA = getCountrySummary(a.id);
      const summaryB = getCountrySummary(b.id);
      
      switch (sortBy) {
        case 'name':
          // Sort alphabetically by name
          return a.name.localeCompare(b.name);
        
        case 'visits':
          // Sort by number of visits (descending)
          return summaryB.timesVisited - summaryA.timesVisited;
        
        case 'days':
          // Sort by total days (descending)
          return summaryB.totalDays - summaryA.totalDays;
        
        case 'recent':
          // Sort by most recent visit date (descending)
          const dateA = getMostRecentDate(a.id);
          const dateB = getMostRecentDate(b.id);
          // If dates are equal, fall back to name for consistent sorting
          return dateB !== dateA ? dateB - dateA : a.name.localeCompare(b.name);
        
        case 'continent':
          // Sort by continent first, then by name within continent
          const continentCompare = a.continent.localeCompare(b.continent);
          return continentCompare !== 0 ? continentCompare : a.name.localeCompare(b.name);
        
        default:
          return 0;
      }
    });
    
    return sortedResult;
  }, [countries, searchQuery, selectedContinent, selectedYear, sortBy, visitDetails, getCountrySummary]);

  const clearFilters = () => {
    setSelectedContinent('all');
    setSelectedYear('all');
    setSearchQuery('');
    setSortBy('name'); // Reset to default sort
  };

  const toggleCountry = (countryId: string) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(countryId)) {
        newSet.delete(countryId);
      } else {
        newSet.add(countryId);
      }
      return newSet;
    });
  };

  const getCountryCode = (countryName: string): string => {
    // Scotland should always use its own flag, not the GB Union Jack
    if (countryName?.toLowerCase().includes("scotland")) {
      return "GB-SCT";
    }
    const found = allCountriesData.find((c) => c.name === countryName);
    return found?.code || "";
  };

  const handleUpdate = () => {
    onUpdate();
    refetchVisitDetails();
  };

  const handleToggleVisit = async (countryId: string, memberId: string, isVisited: boolean) => {
    if (isVisited) {
      const { error } = await supabase
        .from("country_visits")
        .delete()
        .eq("country_id", countryId)
        .eq("family_member_id", memberId);

      if (error) {
        toast({ title: "Error updating visit", variant: "destructive" });
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "You must be logged in", variant: "destructive" });
        return;
      }
      const { error } = await supabase
        .from("country_visits")
        .insert([{ country_id: countryId, family_member_id: memberId, user_id: user.id }]);

      if (error) {
        toast({ title: "Error updating visit", variant: "destructive" });
      }
    }
  };

  const handleDeleteClick = (countryId: string, countryName: string) => {
    setDeleteDialog({ open: true, countryId, countryName });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("countries")
        .delete()
        .eq("id", deleteDialog.countryId);

      if (error) {
        toast({ title: "Error deleting country", variant: "destructive" });
      } else {
        toast({ title: `${deleteDialog.countryName} deleted successfully` });
        onUpdate();
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, countryId: '', countryName: '' });
    }
  };

  return (
    <section id="countries-explored" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Countries We've Explored
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-4">
            Our family's travel journey across the world
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button onClick={() => setAddCountryModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Country
            </Button>
            <CombineMultiCountryTripsDialog onCombined={handleUpdate} />
          </div>
          <AddCountryModal
            open={addCountryModalOpen}
            onOpenChange={setAddCountryModalOpen}
            familyMembers={familyMembers}
            onSuccess={handleUpdate}
            onOpenVisitDetails={(countryId, countryName, countryCode) => {
              setNewCountryVisitDialog({
                open: true,
                countryId,
                countryName,
                countryCode,
              });
            }}
          />
        </div>

        {/* Search and Filters */}
        {countries.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search countries by name, continent, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort and Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                  <SelectTrigger className="w-[180px] h-8 text-sm">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="visits">Most Visited</SelectItem>
                    <SelectItem value="days">Most Days</SelectItem>
                    <SelectItem value="recent">Recently Visited</SelectItem>
                    <SelectItem value="continent">Continent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filters */}
              <div className="flex-1">
                <CountryFilters
                  continents={continents}
                  years={years}
                  selectedContinent={selectedContinent}
                  selectedYear={selectedYear}
                  onContinentChange={setSelectedContinent}
                  onYearChange={setSelectedYear}
                  onClear={clearFilters}
                />
              </div>
            </div>
            
            {/* Results count */}
            {(selectedContinent !== 'all' || selectedYear !== 'all' || searchQuery.trim()) && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredCountries.length} of {countries.length} countries
                {searchQuery.trim() && ` matching "${searchQuery}"`}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {filteredCountries.map((country) => {
            const summary = getCountrySummary(country.id);

            // Parse country name in case it has ISO2 prefix (legacy data: "AT Austria")
            const parsed = (country.name || "").match(/^([A-Z]{2})\s+(.+)$/);
            const codeFromName = parsed?.[1] || "";
            const displayName = parsed?.[2] || country.name;

            // Derive ISO2 code: prioritize region mapping by name (for UK nations like Scotland, Wales, etc.)
            // This matches the logic used in TravelTimeline to ensure consistent flag display
            const rawFlag = (country.flag || "").trim();
            const storedFlag = rawFlag.toUpperCase();
            const isStoredFlagACode = /^[A-Z]{2}(-[A-Z]{3})?$/.test(storedFlag);

            // Scotland safeguard: if the stored emoji itself is the Scotland flag, always use GB-SCT
            const isScotlandEmoji = rawFlag.includes("🏴");

            // Scotland (and other UK nations) can end up stored as "GB" in the DB.
            // Prefer region mapping by name to ensure the correct regional flag.
            const regionCode = getRegionCode(displayName) || getRegionCode(country.name);
            const codeFromStoredFlag = isStoredFlagACode ? storedFlag : '';

            // Priority: regionCode (from name) > storedFlag > other lookups
            // This ensures Scotland shows Saltire, Wales shows dragon flag, etc.
            const countryCode = (
              (isScotlandEmoji ? "GB-SCT" : "") ||
              regionCode ||
              codeFromStoredFlag ||
              codeFromName || 
              getCountryCode(displayName) || 
              getCountryCode(country.name) || 
              ""
            ).toUpperCase();

            const isExpanded = expandedCountries.has(country.id);

            return (
              <Collapsible
                key={country.id}
                open={isExpanded}
                onOpenChange={() => toggleCountry(country.id)}
              >
                <div className="border rounded-lg bg-card overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <CountryFlag countryCode={countryCode} countryName={displayName} size="xl" />
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {displayName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {country.continent}
                            </Badge>
                            {summary.timesVisited > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {summary.timesVisited}x
                              </Badge>
                            )}
                            {summary.totalDays > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                {summary.totalDays}d
                              </Badge>
                            )}
                            {summary.citiesCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                {summary.citiesCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <ChevronDown 
                          className={cn(
                            "w-5 h-5 text-muted-foreground transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )} 
                        />
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t p-4 space-y-4 bg-muted/20">
                      {summary.cities.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Cities visited ({summary.cities.length}):
                          </p>
                          <div className="max-h-32 overflow-y-auto pr-1">
                            <div className="flex flex-wrap gap-1">
                              {summary.cities.sort().map((city) => (
                                <Badge key={city} variant="outline" className="text-xs bg-background">
                                  {city}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Visited by:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {familyMembers.map((member) => {
                            const isVisited = country.visitedBy.includes(member.name);
                            return (
                              <div key={member.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`${country.id}-${member.id}`}
                                  checked={isVisited}
                                  onCheckedChange={() => handleToggleVisit(country.id, member.id, isVisited)}
                                />
                                <label
                                  htmlFor={`${country.id}-${member.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {member.name}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 flex-wrap">
                        <CountryVisitDetailsDialog
                          countryId={country.id}
                          countryName={country.name}
                          countryCode={countryCode}
                          onUpdate={handleUpdate}
                          buttonLabel="View / Add Trips"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(country.id, displayName);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        <DeleteConfirmDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
          onConfirm={handleDeleteConfirm}
          title="Delete Country"
          description={`Are you sure you want to delete this country? This action cannot be undone.`}
          itemName={deleteDialog.countryName}
          loading={isDeleting}
        />

        {newCountryVisitDialog && (
          <CountryVisitDetailsDialog
            countryId={newCountryVisitDialog.countryId}
            countryName={newCountryVisitDialog.countryName}
            countryCode={newCountryVisitDialog.countryCode}
            onUpdate={handleUpdate}
            buttonLabel="View / Add Trips"
            open={newCountryVisitDialog.open}
            onOpenChange={(open) =>
              setNewCountryVisitDialog(prev =>
                prev ? { ...prev, open } : prev
              )
            }
            hideTrigger
          />
        )}
      </div>
    </section>
  );
};

export default CountryTracker;