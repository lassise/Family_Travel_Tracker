import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { CountryOption } from "@/lib/countriesData";
import CountryFlag from "@/components/common/CountryFlag";

interface CountryDatePickerProps {
  country: CountryOption;
  startDate?: string;
  endDate?: string;
  onChange: (startDate: string | undefined, endDate: string | undefined) => void;
  onRemove?: () => void;
}

export const CountryDatePicker = ({
  country,
  startDate,
  endDate,
  onChange,
  onRemove,
}: CountryDatePickerProps) => {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value || undefined;
    // If new start date is after end date, clear end date
    if (newStartDate && endDate && newStartDate > endDate) {
      onChange(newStartDate, undefined);
    } else {
      onChange(newStartDate, endDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value || undefined;
    // Validate: end date must be >= start date
    if (newEndDate && startDate && newEndDate < startDate) {
      // Don't update if invalid - let the error state show
      return;
    }
    onChange(startDate, newEndDate);
  };

  const hasError = startDate && endDate && startDate > endDate;

  return (
    <div className="space-y-2 p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CountryFlag 
            countryCode={country.code} 
            countryName={country.name} 
            size="sm" 
          />
          <Label className="font-medium text-sm">{country.name}</Label>
        </div>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${country.code}-start`} className="text-xs text-muted-foreground">
            Start Date
          </Label>
          <Input
            id={`${country.code}-start`}
            type="date"
            value={startDate || ""}
            onChange={handleStartDateChange}
            max={endDate || undefined}
            className={hasError ? "border-destructive" : ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${country.code}-end`} className="text-xs text-muted-foreground">
            End Date
          </Label>
          <Input
            id={`${country.code}-end`}
            type="date"
            value={endDate || ""}
            onChange={handleEndDateChange}
            min={startDate || undefined}
            className={hasError ? "border-destructive" : ""}
          />
        </div>
      </div>
      
      {hasError && (
        <p className="text-xs text-destructive">
          End date must be after start date
        </p>
      )}
    </div>
  );
};
