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
import { useTripCountries, type CountryWithDates } from "@/hooks/useTripCountries";
import { useTrips, type Trip } from "@/hooks/useTrips";
import { CountryDatePicker } from "./CountryDatePicker";
import { Loader2, Merge, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { format, parseISO, getYear, getMonth } from "date-fns";
import { searchCountries, getAllCountries } from "@/lib/countriesData";
import type { CountryOption } from "@/lib/countriesData";

interface CombineTripsDialogProps {
  tripsToCombine: Trip[];
  onCombined: () => void;
}

const MAX_COUNTRIES = 15;

export const CombineTripsDialog = ({ tripsToCombine, onCombined }: CombineTripsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getCountriesForTrip, updateTripCountries, calculateTripDateRange, syncCountryVisitDetails, refetch } = useTripCountries();
  const { updateTrip, deleteTrip } = useTrips();

  // Collect all countries from all trips
  const [combinedCountries, setCombinedCountries] = useState<CountryWithDates[]>([]);

  // Initialize countries when dialog opens
  useEffect(() => {
    if (open && tripsToCombine.length > 0) {
      const loadCountries = async () => {
        await refetch();
        const allCountries: CountryWithDates[] = [];

        for (const trip of tripsToCombine) {
          const tripCountries = getCountriesForTrip(trip.id);
          
          // If trip has no countries in trip_countries, try to infer from destination
          if (tripCountries.length === 0 && trip.destination) {
            // Try to parse destination (e.g., "Switzerland" or "Switzerland, Germany")
            const destinations = trip.destination.split(',').map(d => d.trim());
            
            destinations.forEach(dest => {
              // Try to find matching country
              const matches = searchCountries(dest);
              const matchedCountry = matches[0]; // Take first match
              
              if (matchedCountry) {
                // Check if country already added (by code)
                if (!allCountries.some(c => c.code === matchedCountry.code)) {
                  allCountries.push({
                    ...matchedCountry,
                    start_date: trip.start_date || undefined,
                    end_date: trip.end_date || undefined,
                  });
                }
              } else {
                // No match found, add as-is (user can fix later)
                if (!allCountries.some(c => c.name === dest && !c.code)) {
                  allCountries.push({
                    name: dest,
                    code: '', // Will need to be filled manually
                    flag: '',
                    continent: '',
                    start_date: trip.start_date || undefined,
                    end_date: trip.end_date || undefined,
                  });
                }
              }
            });
          } else {
            // Use countries from trip_countries
            tripCountries.forEach(tc => {
              // Check if country already added (by code)
              if (!allCountries.some(c => c.code === tc.country_code)) {
                allCountries.push({
                  name: tc.country_name,
                  code: tc.country_code,
                  flag: tc.country_code,
                  continent: '',
                  start_date: tc.start_date || trip.start_date || undefined,
                  end_date: tc.end_date || trip.end_date || undefined,
                });
              }
            });
          }
        }

        // Limit to MAX_COUNTRIES
        if (allCountries.length > MAX_COUNTRIES) {
          toast.warning(`Only the first ${MAX_COUNTRIES} countries will be included`);
          setCombinedCountries(allCountries.slice(0, MAX_COUNTRIES));
        } else {
          setCombinedCountries(allCountries);
        }
      };
      loadCountries();
    } else {
      setCombinedCountries([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tripsToCombine]);

  const handleCountryDateChange = (countryCode: string, startDate: string | undefined, endDate: string | undefined) => {
    if (startDate && endDate && startDate > endDate) {
      return; // Invalid, don't update
    }

    // Use code or name as identifier (for countries without codes)
    setCombinedCountries(combinedCountries.map(c =>
      (c.code && c.code === countryCode) || (!c.code && c.name === countryCode)
        ? { ...c, start_date: startDate, end_date: endDate }
        : c
    ));
  };

  const handleRemoveCountry = (countryCode: string) => {
    // Use code or name as identifier
    setCombinedCountries(combinedCountries.filter(c => 
      !((c.code && c.code === countryCode) || (!c.code && c.name === countryCode))
    ));
  };

  // Calculate combined trip dates
  const calculatedTripDates = useMemo(() => {
    return calculateTripDateRange(combinedCountries);
  }, [combinedCountries, calculateTripDateRange]);

  // Get the primary trip (first one, will be kept)
  const primaryTrip = tripsToCombine[0];
  const tripsToDelete = tripsToCombine.slice(1);

  const handleCombine = async () => {
    if (combinedCountries.length === 0) {
      toast.error("Please add at least one country");
      return;
    }

    if (combinedCountries.length > MAX_COUNTRIES) {
      toast.error(`Maximum ${MAX_COUNTRIES} countries allowed per trip`);
      return;
    }

    // Validate dates
    const invalidDates = combinedCountries.some(c => {
      if (c.start_date && c.end_date) {
        return c.start_date > c.end_date;
      }
      return false;
    });

    if (invalidDates) {
      toast.error("Please fix invalid date ranges");
      return;
    }

    // Filter out countries without codes (they can't be saved)
    const validCountries = combinedCountries.filter(c => c.code);
    if (validCountries.length === 0) {
      toast.error("Please ensure all countries have valid country codes. Use the Edit Countries dialog to add countries properly.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Update primary trip with combined countries (only valid ones with codes)
      const { error: updateError } = await updateTripCountries(primaryTrip.id, validCountries);
      if (updateError) {
        throw updateError;
      }

      // 2. Calculate and update trip dates (use valid countries)
      const newTripDates = calculateTripDateRange(validCountries);
      if (newTripDates.start_date && newTripDates.end_date) {
        const { error: tripUpdateError } = await updateTrip(primaryTrip.id, {
          start_date: newTripDates.start_date,
          end_date: newTripDates.end_date,
          // Update destination to show all countries
          destination: validCountries.map(c => c.name).join(", "),
        });
        if (tripUpdateError) {
          logger.error('Error updating trip dates:', tripUpdateError);
        }
      }

      // 3. Sync country visit details (only for countries with codes)
      const countriesForSync = validCountries
        .filter(c => c.start_date && c.end_date) // Only sync countries with dates
        .map((c, index) => ({
          id: '',
          trip_id: primaryTrip.id,
          country_code: c.code!,
          country_name: c.name,
          order_index: index,
          start_date: c.start_date || null,
          end_date: c.end_date || null,
          created_at: new Date().toISOString(),
        }));

      const { error: syncError } = await syncCountryVisitDetails(primaryTrip.id, primaryTrip.title, countriesForSync);
      if (syncError) {
        logger.error('Error syncing country visit details:', syncError);
      }

      // 4. Delete other trips
      for (const trip of tripsToDelete) {
        const { error: deleteError } = await deleteTrip(trip.id);
        if (deleteError) {
          logger.error(`Error deleting trip ${trip.id}:`, deleteError);
          // Continue with other deletions
        }
      }

      await refetch();
      toast.success(`Successfully combined ${tripsToCombine.length} trips into one`);
      setOpen(false);
      onCombined();
    } catch (error) {
      logger.error("Error combining trips:", error);
      toast.error("Failed to combine trips. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tripDatesSummary = tripsToCombine.map(t => {
    if (t.start_date && t.end_date) {
      return `${format(parseISO(t.start_date), "MMM d")} - ${format(parseISO(t.end_date), "MMM d, yyyy")}`;
    }
    return t.start_date ? format(parseISO(t.start_date), "MMM d, yyyy") : "No dates";
  }).join(" | ");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Merge className="h-4 w-4 mr-2" />
          Combine Trips
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Combine {tripsToCombine.length} Trips</DialogTitle>
          <DialogDescription>
            Merge these trips into one multi-country trip. The first trip will be kept, others will be deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trip Summary */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Trips to combine:</p>
                {tripsToCombine.map((trip, idx) => (
                  <p key={trip.id} className="text-sm">
                    {idx + 1}. {trip.title} ({tripDatesSummary.split(" | ")[idx]})
                  </p>
                ))}
              </div>
            </AlertDescription>
          </Alert>

          {/* Countries List */}
          {combinedCountries.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Countries ({combinedCountries.length}/{MAX_COUNTRIES})
                </h4>
                {combinedCountries.length >= MAX_COUNTRIES && (
                  <p className="text-xs text-muted-foreground">
                    Maximum reached
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {combinedCountries.map((country, index) => {
                  // Use code or name as key and identifier
                  const identifier = country.code || country.name || `country-${index}`;
                  return (
                    <CountryDatePicker
                      key={identifier}
                      country={country}
                      startDate={country.start_date}
                      endDate={country.end_date}
                      onChange={(startDate, endDate) =>
                        handleCountryDateChange(identifier, startDate, endDate)
                      }
                      onRemove={() => handleRemoveCountry(identifier)}
                    />
                  );
                })}
              </div>

              {/* Calculated Trip Dates */}
              {calculatedTripDates.start_date && calculatedTripDates.end_date && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium">Combined Trip Duration:</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(calculatedTripDates.start_date), "MMM d, yyyy")} - {format(parseISO(calculatedTripDates.end_date), "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-calculated from country dates
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading countries...
            </p>
          )}

          {combinedCountries.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No countries found in these trips. Please use the Edit Countries button on the trip detail page to add countries first.
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for countries without codes */}
          {combinedCountries.some(c => !c.code) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some countries don't have valid country codes. These will be excluded from the combined trip. 
                Please use the Edit Countries dialog on the trip detail page to properly add countries.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCombine} disabled={loading || combinedCountries.length === 0}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Combine Trips
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
