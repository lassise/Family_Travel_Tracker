import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TripFormData } from "../TripWizard";
import { Calendar, Hotel, Users, Briefcase, Palmtree, ArrowRightLeft } from "lucide-react";
import MultiCountrySelect from "../MultiCountrySelect";
import { CountryDatePicker } from "../CountryDatePicker";
import { useTripCountries, type CountryWithDates } from "@/hooks/useTripCountries";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import type { CountryOption } from "@/lib/countriesData";

interface TripBasicsStepProps {
  formData: TripFormData;
  updateFormData: (updates: Partial<TripFormData>) => void;
}

const PURPOSE_OPTIONS = [
  { value: "leisure", label: "Leisure / Vacation", icon: Palmtree, description: "Family fun, relaxation, sightseeing" },
  { value: "business", label: "Business Trip", icon: Briefcase, description: "Meetings, conferences, work-related" },
  { value: "mixed", label: "Bleisure (Both)", icon: ArrowRightLeft, description: "Combine work with leisure activities" },
];

export const TripBasicsStep = ({ formData, updateFormData }: TripBasicsStepProps) => {
  const { calculateTripDateRange } = useTripCountries();

  const handleCountriesChange = (countries: CountryOption[]) => {
    // Convert to CountryWithDates, preserving existing dates
    const countriesWithDates: CountryWithDates[] = countries.map(country => {
      const existing = formData.countries.find(c => c.code === country.code);
      return {
        ...country,
        start_date: (existing as CountryWithDates)?.start_date,
        end_date: (existing as CountryWithDates)?.end_date,
      };
    });

    updateFormData({ 
      countries: countriesWithDates,
      // Set destination to comma-separated list for backward compatibility
      destination: countries.map(c => c.name).join(", ")
    });
  };

  // Convert countries to CountryWithDates for date calculation
  const countriesWithDates: CountryWithDates[] = useMemo(() => {
    return (formData.countries || []).map(c => ({
      ...c,
      start_date: (c as CountryWithDates).start_date,
      end_date: (c as CountryWithDates).end_date,
    }));
  }, [formData.countries]);

  // Calculate trip dates from country dates
  const calculatedTripDates = useMemo(() => {
    return calculateTripDateRange(countriesWithDates);
  }, [countriesWithDates, calculateTripDateRange]);

  // Update trip dates when country dates change
  const handleCountryDateChange = (countryCode: string, startDate: string | undefined, endDate: string | undefined) => {
    // Validate: end date must be >= start date
    if (startDate && endDate && startDate > endDate) {
      // Don't update if invalid - let the error state show in CountryDatePicker
      return;
    }

    const updatedCountries: CountryWithDates[] = formData.countries.map(c => 
      c.code === countryCode
        ? { ...c, start_date: startDate, end_date: endDate }
        : c
    );

    // Calculate new trip dates
    const newTripDates = calculateTripDateRange(updatedCountries);

    updateFormData({
      countries: updatedCountries,
      startDate: newTripDates.start_date || formData.startDate,
      endDate: newTripDates.end_date || formData.endDate,
    });
  };

  const showCountryDatePickers = formData.hasDates && formData.countries.length > 0;
  const showTripDateInputs = formData.hasDates && formData.countries.length === 0;

  return (
    <div className="space-y-6">
      {/* Multi-Country Selector */}
      <MultiCountrySelect
        selectedCountries={formData.countries || []}
        onChange={handleCountriesChange}
        label="Where are you going?"
        placeholder="Select destination countries..."
      />

      {/* Fallback destination input for free-text entry (optional) */}
      {formData.countries?.length === 0 && (
        <div className="space-y-2">
          <Label htmlFor="destination" className="text-sm text-muted-foreground">
            Or type a destination
          </Label>
          <Input
            id="destination"
            placeholder="e.g., Paris, France or Disney World, Orlando"
            value={formData.destination}
            onChange={(e) => updateFormData({ destination: e.target.value })}
          />
        </div>
      )}

      {/* Trip Purpose */}
      <div className="space-y-3">
        <Label>What's the primary purpose of this trip?</Label>
        <RadioGroup
          value={formData.tripPurpose}
          onValueChange={(value) => updateFormData({ tripPurpose: value })}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {PURPOSE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <label
                key={option.value}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
                  formData.tripPurpose === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={option.value} className="sr-only" />
                <Icon className="h-6 w-6 mb-2" />
                <span className="font-medium text-sm">{option.label}</span>
                <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      {/* Planning stage toggles */}
      <div className="space-y-4 p-4 rounded-lg bg-muted/50">
        <p className="text-sm font-medium text-foreground">What details do you have so far?</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="hasDates" className="font-normal cursor-pointer">
              I know my travel dates
            </Label>
          </div>
          <Switch
            id="hasDates"
            checked={formData.hasDates}
            onCheckedChange={(checked) => updateFormData({ hasDates: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hotel className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="hasLodging" className="font-normal cursor-pointer">
              I know where I'm staying
            </Label>
          </div>
          <Switch
            id="hasLodging"
            checked={formData.hasLodging}
            onCheckedChange={(checked) => updateFormData({ hasLodging: checked })}
          />
        </div>

        {formData.tripPurpose !== "business" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="travelingWithKids" className="font-normal cursor-pointer">
                Traveling with kids
              </Label>
            </div>
            <Switch
              id="travelingWithKids"
              checked={formData.travelingWithKids}
              onCheckedChange={(checked) => updateFormData({ travelingWithKids: checked })}
            />
          </div>
        )}
      </div>

      {/* Country Date Pickers - shown when hasDates and countries selected */}
      {showCountryDatePickers && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Set dates for each country</Label>
          <div className="space-y-2">
            {formData.countries.map((country) => (
              <CountryDatePicker
                key={country.code}
                country={country}
                startDate={(country as CountryWithDates).start_date}
                endDate={(country as CountryWithDates).end_date}
                onChange={(startDate, endDate) => 
                  handleCountryDateChange(country.code, startDate, endDate)
                }
              />
            ))}
          </div>
          
          {/* Display calculated trip dates */}
          {calculatedTripDates.start_date && calculatedTripDates.end_date && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Trip Duration:</span>
                <span className="text-muted-foreground">
                  {format(parseISO(calculatedTripDates.start_date), "MMM d, yyyy")} - {format(parseISO(calculatedTripDates.end_date), "MMM d, yyyy")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Auto-calculated from country dates
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trip Date Inputs - shown when hasDates but no countries selected (backward compat) */}
      {showTripDateInputs && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => updateFormData({ startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              min={formData.startDate}
              onChange={(e) => updateFormData({ endDate: e.target.value })}
            />
          </div>
        </div>
      )}

      {formData.hasLodging && (
        <div className="space-y-2">
          <Label htmlFor="lodging">Where are you staying?</Label>
          <Input
            id="lodging"
            placeholder="e.g., Marriott Downtown, Airbnb near Central Park"
            value={formData.lodgingLocation}
            onChange={(e) => updateFormData({ lodgingLocation: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Helps us plan activities near your accommodation
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Trip Name (optional)</Label>
        <Input
          id="title"
          placeholder="Give your trip a fun name"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Leave blank and we'll create one for you
        </p>
      </div>
    </div>
  );
};
