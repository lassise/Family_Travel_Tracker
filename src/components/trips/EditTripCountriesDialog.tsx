import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTripCountries, type CountryWithDates, type TripCountry } from "@/hooks/useTripCountries";
import { useTrips } from "@/hooks/useTrips";
import { CountryDatePicker } from "./CountryDatePicker";
import MultiCountrySelect from "./MultiCountrySelect";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { format, parseISO } from "date-fns";
import type { CountryOption } from "@/lib/countriesData";

interface EditTripCountriesDialogProps {
  tripId: string;
  tripTitle: string;
}

export const EditTripCountriesDialog = ({ tripId, tripTitle }: EditTripCountriesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getCountriesForTrip, updateTripCountries, calculateTripDateRange, syncCountryVisitDetails, refetch } = useTripCountries();
  const { updateTrip } = useTrips();

  // Get current countries for this trip
  const currentTripCountries = getCountriesForTrip(tripId);
  
  // Convert to CountryWithDates for editing
  const [editingCountries, setEditingCountries] = useState<CountryWithDates[]>([]);

  // Initialize editing countries when dialog opens
  useEffect(() => {
    if (open) {
      // Refetch to ensure we have latest data
      const loadCountries = async () => {
        await refetch();
        const freshCountries = getCountriesForTrip(tripId);
        const countries: CountryWithDates[] = freshCountries.map(tc => ({
          name: tc.country_name,
          code: tc.country_code,
          flag: tc.country_code,
          continent: '', // Not needed for editing
          start_date: tc.start_date || undefined,
          end_date: tc.end_date || undefined,
        }));
        setEditingCountries(countries);
      };
      loadCountries();
    } else {
      // Reset when dialog closes
      setEditingCountries([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tripId]);

  const handleAddCountry = (country: CountryOption) => {
    // Check if country already exists
    if (editingCountries.some(c => c.code === country.code)) {
      toast.error(`${country.name} is already added`);
      return;
    }
    setEditingCountries([...editingCountries, { ...country }]);
  };

  const handleRemoveCountry = (countryCode: string) => {
    setEditingCountries(editingCountries.filter(c => c.code !== countryCode));
  };

  const handleCountryDateChange = (countryCode: string, startDate: string | undefined, endDate: string | undefined) => {
    setEditingCountries(editingCountries.map(c =>
      c.code === countryCode
        ? { ...c, start_date: startDate, end_date: endDate }
        : c
    ));
  };

  const handleSave = async () => {
    // Validate: at least one country must exist
    if (editingCountries.length === 0) {
      toast.error("Please add at least one country");
      return;
    }

    // Validate: if dates are set, they must be valid
    const invalidDates = editingCountries.some(c => {
      if (c.start_date && c.end_date) {
        return c.start_date > c.end_date;
      }
      return false;
    });

    if (invalidDates) {
      toast.error("Please fix invalid date ranges (end date must be after start date)");
      return;
    }

    setLoading(true);
    try {
      // Update trip_countries
      const { error: updateError } = await updateTripCountries(tripId, editingCountries);
      if (updateError) {
        throw updateError;
      }

      // Calculate new trip dates from country dates
      const newTripDates = calculateTripDateRange(editingCountries);
      
      // Update trip dates if we have country dates
      if (newTripDates.start_date && newTripDates.end_date) {
        const { error: tripUpdateError } = await updateTrip(tripId, {
          start_date: newTripDates.start_date,
          end_date: newTripDates.end_date,
        });
        if (tripUpdateError) {
          logger.error('Error updating trip dates:', tripUpdateError);
          // Non-critical, continue
        }
      }

      // Sync country_visit_details
      const countriesForSync = editingCountries
        .filter(c => c.start_date && c.end_date)
        .map((c, index) => ({
          id: '', // Not needed for sync
          trip_id: tripId,
          country_code: c.code,
          country_name: c.name,
          order_index: index,
          start_date: c.start_date || null,
          end_date: c.end_date || null,
          created_at: new Date().toISOString(),
        }));

      const { error: syncError } = await syncCountryVisitDetails(tripId, tripTitle, countriesForSync);
      if (syncError) {
        logger.error('Error syncing country visit details:', syncError);
        // Non-critical, continue
      }

      // Refetch to update the display
      await refetch();
      
      toast.success("Countries updated successfully");
      setOpen(false);
    } catch (error) {
      logger.error("Error updating trip countries:", error);
      toast.error("Failed to update countries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Countries
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Countries</DialogTitle>
          <DialogDescription>
            Add, remove, or update dates for countries in this trip
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Country Selector */}
          <div>
            <MultiCountrySelect
              selectedCountries={editingCountries}
              onChange={(countries) => {
                // Update the list - preserve dates for existing countries
                const updatedCountries: CountryWithDates[] = countries.map(country => {
                  const existing = editingCountries.find(ec => ec.code === country.code);
                  return existing || { ...country };
                });
                setEditingCountries(updatedCountries);
              }}
              label="Add Countries"
              placeholder="Search and add countries..."
            />
          </div>

          {/* Country Date Pickers */}
          {editingCountries.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Set dates for each country</h4>
              <div className="space-y-2">
                {editingCountries.map((country) => (
                  <CountryDatePicker
                    key={country.code}
                    country={country}
                    startDate={country.start_date}
                    endDate={country.end_date}
                    onChange={(startDate, endDate) =>
                      handleCountryDateChange(country.code, startDate, endDate)
                    }
                    onRemove={() => handleRemoveCountry(country.code)}
                  />
                ))}
              </div>

              {/* Display calculated trip dates */}
              {(() => {
                const calculatedDates = calculateTripDateRange(editingCountries);
                if (calculatedDates.start_date && calculatedDates.end_date) {
                  try {
                    return (
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <p className="text-sm font-medium">Trip Duration:</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(calculatedDates.start_date), "MMM d, yyyy")} - {format(parseISO(calculatedDates.end_date), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Auto-calculated from country dates
                        </p>
                      </div>
                    );
                  } catch (error) {
                    logger.error("Error formatting dates:", error);
                    return null;
                  }
                }
                return null;
              })()}
            </div>
          )}

          {editingCountries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No countries added. Use the selector above to add countries.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
