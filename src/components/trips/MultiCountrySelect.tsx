import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X, MapPin } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAllCountries, type CountryOption } from "@/lib/countriesData";
import { cn } from "@/lib/utils";
import CountryFlag from "@/components/common/CountryFlag";

interface MultiCountrySelectProps {
  selectedCountries: CountryOption[];
  onChange: (countries: CountryOption[]) => void;
  label?: string;
  placeholder?: string;
}

const allCountries = getAllCountries();

const MultiCountrySelect = ({ 
  selectedCountries, 
  onChange, 
  label = "Countries", 
  placeholder = "Select countries..." 
}: MultiCountrySelectProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (country: CountryOption) => {
    const isSelected = selectedCountries.some(c => c.code === country.code);
    
    if (isSelected) {
      onChange(selectedCountries.filter(c => c.code !== country.code));
    } else {
      onChange([...selectedCountries, country]);
    }
  };

  const handleRemove = (countryCode: string) => {
    onChange(selectedCountries.filter(c => c.code !== countryCode));
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        {label}
      </Label>
      
      {/* Selected Countries Display */}
      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 rounded-md border bg-muted/30">
          {selectedCountries.map((country) => (
            <Badge 
              key={country.code} 
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <CountryFlag countryCode={country.code} countryName={country.name} size="sm" />
              <span>{country.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                onClick={() => handleRemove(country.code)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Country Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            type="button"
          >
            <span className="text-muted-foreground">
              {selectedCountries.length === 0 
                ? placeholder 
                : `${selectedCountries.length} ${selectedCountries.length === 1 ? 'country' : 'countries'} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search countries..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {allCountries.map((country) => {
                  const isSelected = selectedCountries.some(c => c.code === country.code);
                  return (
                    <CommandItem
                      key={country.code}
                      value={country.name}
                      onSelect={() => handleSelect(country)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <CountryFlag 
                        countryCode={country.code} 
                        countryName={country.name} 
                        size="sm" 
                        className="mr-2" 
                      />
                      <span>{country.name}</span>
                      <span className="ml-auto text-muted-foreground text-xs">
                        {country.continent}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <p className="text-xs text-muted-foreground">
        Add multiple countries if your trip spans several destinations
      </p>
    </div>
  );
};

export default MultiCountrySelect;
