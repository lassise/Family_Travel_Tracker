import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Merge, AlertCircle, Calendar, MapPin, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useVisitDetails, type VisitDetail } from "@/hooks/useVisitDetails";
import { format, parseISO, differenceInDays } from "date-fns";
import { logger } from "@/lib/logger";

interface CombineMultiCountryTripsDialogProps {
  onCombined: () => void;
}

interface TripGroup {
  tripGroupId: string;
  tripName: string | null;
  visits: VisitDetail[];
  countries: string[];
  startDate: string | null;
  endDate: string | null;
  totalDays: number;
}

export const CombineMultiCountryTripsDialog = ({ onCombined }: CombineMultiCountryTripsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [combining, setCombining] = useState(false);
  const { visitDetails, refetch } = useVisitDetails();
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  // Group visits by trip_group_id
  const tripGroups = useMemo(() => {
    const groups = new Map<string, VisitDetail[]>();
    const standalone: VisitDetail[] = [];

    visitDetails.forEach(visit => {
      if (visit.trip_group_id) {
        const existing = groups.get(visit.trip_group_id) || [];
        existing.push(visit);
        groups.set(visit.trip_group_id, existing);
      } else {
        // Only include standalone visits that have a trip_name (likely part of a trip)
        if (visit.trip_name) {
          standalone.push(visit);
        }
      }
    });

    // Convert to TripGroup array
    const tripGroupArray: TripGroup[] = [];

    // Process grouped trips
    groups.forEach((visits, groupId) => {
      const countries = [...new Set(visits.map(v => v.country_id))];
      const tripName = visits[0]?.trip_name || null;
      
      // Calculate date range
      const dates = visits
        .filter(v => v.visit_date || v.end_date)
        .map(v => ({
          start: v.visit_date ? new Date(v.visit_date).getTime() : null,
          end: v.end_date ? new Date(v.end_date).getTime() : null,
        }))
        .filter(d => d.start !== null || d.end !== null);

      const startDates = dates.map(d => d.start).filter((d): d is number => d !== null);
      const endDates = dates.map(d => d.end).filter((d): d is number => d !== null);

      const startDate = startDates.length > 0 
        ? new Date(Math.min(...startDates)).toISOString().split('T')[0]
        : null;
      const endDate = endDates.length > 0
        ? new Date(Math.max(...endDates)).toISOString().split('T')[0]
        : null;

      const totalDays = visits.reduce((sum, v) => sum + (v.number_of_days || 0), 0);

      tripGroupArray.push({
        tripGroupId: groupId,
        tripName,
        visits,
        countries,
        startDate,
        endDate,
        totalDays,
      });
    });

    // Process standalone visits with trip names as potential groups
    if (standalone.length > 0) {
      const standaloneByName = new Map<string, VisitDetail[]>();
      standalone.forEach(visit => {
        const key = visit.trip_name || 'Unnamed Trip';
        const existing = standaloneByName.get(key) || [];
        existing.push(visit);
        standaloneByName.set(key, existing);
      });

      standaloneByName.forEach((visits, tripName) => {
        // Include standalone groups if they have multiple visits OR multiple countries
        // This allows combining single-country trips with the same name
        const countries = [...new Set(visits.map(v => v.country_id))];
        if (visits.length > 1 || countries.length > 1) {
          const dates = visits
            .filter(v => v.visit_date || v.end_date)
            .map(v => ({
              start: v.visit_date ? new Date(v.visit_date).getTime() : null,
              end: v.end_date ? new Date(v.end_date).getTime() : null,
            }))
            .filter(d => d.start !== null || d.end !== null);

          const startDates = dates.map(d => d.start).filter((d): d is number => d !== null);
          const endDates = dates.map(d => d.end).filter((d): d is number => d !== null);

          const startDate = startDates.length > 0 
            ? new Date(Math.min(...startDates)).toISOString().split('T')[0]
            : null;
          const endDate = endDates.length > 0
            ? new Date(Math.max(...endDates)).toISOString().split('T')[0]
            : null;

          const totalDays = visits.reduce((sum, v) => sum + (v.number_of_days || 0), 0);

          // Use a special key for standalone groups (based on trip name)
          // Include first visit ID for uniqueness to avoid collisions
          tripGroupArray.push({
            tripGroupId: `standalone-${tripName}-${visits[0].id}`,
            tripName,
            visits,
            countries,
            startDate,
            endDate,
            totalDays,
          });
        }
      });
    }

    // Sort by start date (most recent first)
    return tripGroupArray.sort((a, b) => {
      if (!a.startDate && !b.startDate) return 0;
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [visitDetails]);

  // Filter to only show groups with multiple countries or multiple visits
  const combinableGroups = useMemo(() => {
    return tripGroups.filter(group => 
      group.countries.length > 1 || group.visits.length > 1
    );
  }, [tripGroups]);

  useEffect(() => {
    if (open) {
      setSelectedGroups(new Set());
    }
  }, [open]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleCombine = async () => {
    if (selectedGroups.size < 2) {
      toast.error("Please select at least 2 trip groups to combine");
      return;
    }

    setCombining(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Generate new trip_group_id
      const newTripGroupId = crypto.randomUUID();

      // Collect all visits from selected groups
      const visitsToUpdate: VisitDetail[] = [];
      const selectedGroupData = combinableGroups.filter(g => selectedGroups.has(g.tripGroupId));
      
      // Determine combined trip name (use first non-empty name, or create one)
      const tripNames = selectedGroupData
        .map(g => g.tripName)
        .filter((name): name is string => !!name);
      const combinedTripName = tripNames[0] || "Combined Trip";

      // Collect all visit IDs from selected groups
      // Handle both real trip_group_id groups and standalone groups
      selectedGroupData.forEach(group => {
        group.visits.forEach(visit => {
          visitsToUpdate.push(visit);
        });
      });

      if (visitsToUpdate.length === 0) {
        toast.error("No visits found to combine");
        return;
      }

      // Update all visits with new trip_group_id and combined trip name
      // This works for both visits with existing trip_group_id and standalone visits
      const visitIds = visitsToUpdate.map(v => v.id);
      
      const { error: updateError } = await supabase
        .from("country_visit_details")
        .update({
          trip_group_id: newTripGroupId,
          trip_name: combinedTripName,
        })
        .in("id", visitIds);

      if (updateError) {
        logger.error("Error combining trips:", updateError);
        toast.error("Failed to combine trips. Please try again.");
        return;
      }

      await refetch();
      toast.success(`Successfully combined ${selectedGroups.size} trip groups into one`);
      setOpen(false);
      setSelectedGroups(new Set());
      onCombined();
    } catch (error) {
      logger.error("Error combining trips:", error);
      toast.error("Failed to combine trips. Please try again.");
    } finally {
      setCombining(false);
    }
  };

  // Calculate combined stats for selected groups
  const combinedStats = useMemo(() => {
    if (selectedGroups.size === 0) return null;

    const selected = combinableGroups.filter(g => selectedGroups.has(g.tripGroupId));
    const allCountries = new Set<string>();
    let totalDays = 0;
    let totalVisits = 0;
    const dateRanges: { start: number | null; end: number | null }[] = [];

    selected.forEach(group => {
      group.countries.forEach(c => allCountries.add(c));
      totalDays += group.totalDays;
      totalVisits += group.visits.length;
      
      if (group.startDate && group.endDate) {
        dateRanges.push({
          start: new Date(group.startDate).getTime(),
          end: new Date(group.endDate).getTime(),
        });
      }
    });

    const startDates = dateRanges.map(d => d.start).filter((d): d is number => d !== null);
    const endDates = dateRanges.map(d => d.end).filter((d): d is number => d !== null);

    const combinedStartDate = startDates.length > 0
      ? new Date(Math.min(...startDates)).toISOString().split('T')[0]
      : null;
    const combinedEndDate = endDates.length > 0
      ? new Date(Math.max(...endDates)).toISOString().split('T')[0]
      : null;

    const combinedDuration = combinedStartDate && combinedEndDate
      ? differenceInDays(parseISO(combinedEndDate), parseISO(combinedStartDate)) + 1
      : null;

    return {
      countries: allCountries.size,
      totalDays,
      totalVisits,
      combinedStartDate,
      combinedEndDate,
      combinedDuration,
    };
  }, [selectedGroups, combinableGroups]);

  if (combinableGroups.length < 2) {
    return null; // Don't show if there aren't enough groups to combine
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Merge className="h-4 w-4 mr-2" />
          Combine Trip Groups
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Combine Multi-Country Trip Groups</DialogTitle>
          <DialogDescription>
            Select multiple trip groups to combine into one long trip. This will update all visits to share the same trip group ID.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Select 2 or more trip groups to combine. All visits in selected groups will be linked together as one trip.
            </AlertDescription>
          </Alert>

          {/* Trip Groups List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {combinableGroups.map((group) => {
              const isSelected = selectedGroups.has(group.tripGroupId);
              const isStandalone = group.tripGroupId.startsWith('standalone-');

              return (
                <div
                  key={group.tripGroupId}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted/50"
                  }`}
                  onClick={() => toggleGroup(group.tripGroupId)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleGroup(group.tripGroupId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm">
                          {group.tripName || "Unnamed Trip"}
                        </h4>
                        {isStandalone && (
                          <Badge variant="outline" className="text-xs">
                            Standalone
                          </Badge>
                        )}
                        {group.countries.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            {group.countries.length} countries
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {group.startDate && group.endDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(group.startDate), "MMM d")} - {format(parseISO(group.endDate), "MMM d, yyyy")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {group.visits.length} visit{group.visits.length !== 1 ? 's' : ''}
                        </span>
                        {group.totalDays > 0 && (
                          <span>{group.totalDays} day{group.totalDays !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Combined Stats Preview */}
          {combinedStats && selectedGroups.size >= 2 && (
            <Alert className="bg-primary/5 border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Combined Trip Preview:</p>
                  <div className="text-sm space-y-1">
                    <p>• {combinedStats.countries} countries across {combinedStats.totalVisits} visits</p>
                    <p>• {combinedStats.totalDays} total days</p>
                    {combinedStats.combinedStartDate && combinedStats.combinedEndDate && (
                      <p>• {format(parseISO(combinedStats.combinedStartDate), "MMM d")} - {format(parseISO(combinedStats.combinedEndDate), "MMM d, yyyy")}</p>
                    )}
                    {combinedStats.combinedDuration && (
                      <p>• Combined duration: {combinedStats.combinedDuration} days</p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Warning if only one selected */}
          {selectedGroups.size === 1 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select at least 2 trip groups to combine.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={combining}>
            Cancel
          </Button>
          <Button 
            onClick={handleCombine} 
            disabled={combining || selectedGroups.size < 2}
          >
            {combining && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Combine {selectedGroups.size} Trip Group{selectedGroups.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
