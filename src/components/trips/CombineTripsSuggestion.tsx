import { useMemo, useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { getYear, getMonth, parseISO } from "date-fns";
import type { Trip } from "@/hooks/useTrips";
import { CombineTripsDialog } from "./CombineTripsDialog";

interface CombineTripsSuggestionProps {
  trips: Trip[];
  onCombined: () => void;
}

export const CombineTripsSuggestion = ({ trips, onCombined }: CombineTripsSuggestionProps) => {
  const [dismissedGroups, setDismissedGroups] = useState<Set<string>>(new Set());

  // Load dismissed groups from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissedCombineSuggestions');
    if (stored) {
      try {
        setDismissedGroups(new Set(JSON.parse(stored)));
      } catch (error) {
        // Ignore parse errors
      }
    }
  }, []);

  // Find trips in the same month/year that could be combined
  const combinableGroups = useMemo(() => {
    // Filter to completed trips only
    const completedTrips = trips.filter(t => t.status === 'completed' && t.start_date);
    
    // Group by year-month
    const groups: Record<string, Trip[]> = {};
    
    completedTrips.forEach(trip => {
      if (!trip.start_date) return;
      
      try {
        const date = parseISO(trip.start_date);
        const year = getYear(date);
        const month = getMonth(date);
        const key = `${year}-${month}`;
        
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(trip);
      } catch (error) {
        // Skip invalid dates
        return;
      }
    });

    // Return groups with 2+ trips, filtered by dismissed groups
    return Object.entries(groups)
      .filter(([key, group]) => {
        // Check if this group was dismissed
        if (dismissedGroups.has(key)) return false;
        return group.length >= 2;
      })
      .map(([, group]) => group);
  }, [trips, dismissedGroups]);

  if (combinableGroups.length === 0) {
    return null;
  }

  // Show the first group that has combinable trips
  const firstGroup = combinableGroups[0];

  const handleDismiss = () => {
    // Use year-month as the key for dismissal
    if (firstGroup[0]?.start_date) {
      try {
        const date = parseISO(firstGroup[0].start_date);
        const year = getYear(date);
        const month = getMonth(date);
        const key = `${year}-${month}`;
        
        const newDismissed = new Set(dismissedGroups);
        newDismissed.add(key);
        setDismissedGroups(newDismissed);
        localStorage.setItem('dismissedCombineSuggestions', JSON.stringify(Array.from(newDismissed)));
      } catch (error) {
        // Ignore errors
      }
    }
  };

  return (
    <Alert className="mb-6 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Combine Similar Trips?</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p className="text-sm">
            We noticed {firstGroup.length} trips in the same month. Were these part of the same trip?
          </p>
          <div className="flex items-center gap-2">
            <CombineTripsDialog
              tripsToCombine={firstGroup}
              onCombined={() => {
                onCombined();
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
            >
              No, keep separate
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
