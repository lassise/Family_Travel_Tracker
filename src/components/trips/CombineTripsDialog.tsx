import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Merge, Calendar, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Trip } from "@/hooks/useTrips";
import { getRegionCode, getAllCountries } from "@/lib/countriesData";

interface CombineTripsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trips: Trip[];
  onSuccess: () => void;
}

export const CombineTripsDialog = ({
  open,
  onOpenChange,
  trips,
  onSuccess,
}: CombineTripsDialogProps) => {
  const [selectedTripIds, setSelectedTripIds] = useState<Set<string>>(new Set());
  const [combinedTitle, setCombinedTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const allCountries = useMemo(() => getAllCountries(), []);

  // Get country info from destination string
  const getCountryFromDestination = (destination: string | null) => {
    if (!destination) return null;
    
    // Try to extract country from destination (e.g., "Paris, France" -> France)
    const parts = destination.split(",").map((p) => p.trim());
    const lastPart = parts[parts.length - 1];
    
    // Check if it's a country code first
    const regionCode = getRegionCode(destination);
    if (regionCode) {
      const country = allCountries.find((c) => c.code === regionCode);
      if (country) return country;
    }
    
    // Try to match by name
    const country = allCountries.find(
      (c) =>
        c.name.toLowerCase() === lastPart.toLowerCase() ||
        destination.toLowerCase().includes(c.name.toLowerCase())
    );
    
    return country || null;
  };

  const selectedTrips = useMemo(() => {
    return trips.filter((t) => selectedTripIds.has(t.id));
  }, [trips, selectedTripIds]);

  // Extract unique countries from selected trips
  const extractedCountries = useMemo(() => {
    const countryMap = new Map<string, { code: string; name: string; flag: string }>();
    
    for (const trip of selectedTrips) {
      const country = getCountryFromDestination(trip.destination);
      if (country && !countryMap.has(country.code)) {
        countryMap.set(country.code, {
          code: country.code,
          name: country.name,
          flag: country.flag,
        });
      }
    }
    
    return Array.from(countryMap.values());
  }, [selectedTrips, allCountries]);

  // Calculate date range
  const dateRange = useMemo(() => {
    const dates = selectedTrips
      .filter((t) => t.start_date || t.end_date)
      .flatMap((t) => [t.start_date, t.end_date])
      .filter(Boolean) as string[];
    
    if (dates.length === 0) return null;
    
    const sorted = dates.sort();
    return {
      start: sorted[0],
      end: sorted[sorted.length - 1],
    };
  }, [selectedTrips]);

  const handleToggleTrip = (tripId: string) => {
    const newSet = new Set(selectedTripIds);
    if (newSet.has(tripId)) {
      newSet.delete(tripId);
    } else {
      newSet.add(tripId);
    }
    setSelectedTripIds(newSet);
  };

  const handleCombine = async () => {
    if (selectedTripIds.size < 2) {
      toast.error("Please select at least 2 trips to combine");
      return;
    }

    if (!combinedTitle.trim()) {
      toast.error("Please enter a title for the combined trip");
      return;
    }

    setIsProcessing(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the new combined trip
      const { data: newTrip, error: tripError } = await supabase
        .from("trips")
        .insert({
          title: combinedTitle,
          destination: extractedCountries.length > 0 
            ? extractedCountries.map(c => c.name).join(" → ")
            : selectedTrips[0]?.destination,
          start_date: dateRange?.start,
          end_date: dateRange?.end,
          status: "planning",
          trip_type: "multi-country",
          user_id: user.id,
        })
        .select()
        .single();

      if (tripError || !newTrip) {
        throw new Error(tripError?.message || "Failed to create combined trip");
      }

      // Insert trip_countries for each unique country
      if (extractedCountries.length > 0) {
        const countryRecords = extractedCountries.map((country, index) => ({
          trip_id: newTrip.id,
          country_code: country.code,
          country_name: country.name,
          order_index: index,
        }));

        const { error: countriesError } = await supabase
          .from("trip_countries")
          .insert(countryRecords);

        if (countriesError) {
          console.error("Error inserting trip countries:", countriesError);
        }
      }

      // Move itinerary data from original trips to the new combined trip
      for (const originalTrip of selectedTrips) {
        // Move itinerary_days
        const { data: days } = await supabase
          .from("itinerary_days")
          .select("id")
          .eq("trip_id", originalTrip.id);

        if (days && days.length > 0) {
          await supabase
            .from("itinerary_days")
            .update({ trip_id: newTrip.id })
            .eq("trip_id", originalTrip.id);
        }

        // Move train segments
        await supabase
          .from("trip_train_segments")
          .update({ trip_id: newTrip.id })
          .eq("trip_id", originalTrip.id);

        // Move lodging suggestions
        await supabase
          .from("trip_lodging_suggestions")
          .update({ trip_id: newTrip.id })
          .eq("trip_id", originalTrip.id);

        // Archive the original trip (don't delete to preserve history)
        await supabase
          .from("trips")
          .update({ archived: true })
          .eq("id", originalTrip.id);
      }

      toast.success(`Combined ${selectedTripIds.size} trips into "${combinedTitle}"`);
      onSuccess();
      onOpenChange(false);
      
      // Reset state
      setSelectedTripIds(new Set());
      setCombinedTitle("");
    } catch (error: any) {
      console.error("Error combining trips:", error);
      toast.error(error.message || "Failed to combine trips");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter out archived trips
  const availableTrips = trips.filter(t => !t.archived);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Combine Trips
          </DialogTitle>
          <DialogDescription>
            Select 2 or more trips to combine into a single multi-country trip.
            Original trips will be archived.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select trips to combine</Label>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              {availableTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm">No trips available to combine</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableTrips.map((trip) => {
                    const country = getCountryFromDestination(trip.destination);
                    const isSelected = selectedTripIds.has(trip.id);
                    
                    return (
                      <label
                        key={trip.id}
                        className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10" : "hover:bg-accent"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleTrip(trip.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {trip.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {country && <span>{country.flag}</span>}
                            {trip.destination && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {trip.destination}
                              </span>
                            )}
                          </div>
                          {trip.start_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(trip.start_date)}
                              {trip.end_date && ` - ${formatDate(trip.end_date)}`}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedTripIds.size >= 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="combined-title">Combined trip title</Label>
                <Input
                  id="combined-title"
                  placeholder="e.g., Mediterranean Cruise 2025"
                  value={combinedTitle}
                  onChange={(e) => setCombinedTitle(e.target.value)}
                />
              </div>

              {extractedCountries.length > 0 && (
                <div className="space-y-2">
                  <Label>Countries in combined trip</Label>
                  <div className="flex flex-wrap gap-1">
                    {extractedCountries.map((country) => (
                      <Badge key={country.code} variant="secondary">
                        {country.flag} {country.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {dateRange && (
                <div className="space-y-2">
                  <Label>Date range</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCombine}
            disabled={selectedTripIds.size < 2 || !combinedTitle.trim() || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Combining...
              </>
            ) : (
              <>
                <Merge className="h-4 w-4 mr-2" />
                Combine {selectedTripIds.size} Trips
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
