import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllCountries, type CountryOption } from "@/lib/countriesData";

export interface SelectedCountry {
  code: string;
  name: string;
  flag: string;
}

interface CountryMultiSelectProps {
  value: SelectedCountry[];
  onChange: (countries: SelectedCountry[]) => void;
  placeholder?: string;
  className?: string;
}

export const CountryMultiSelect = ({
  value,
  onChange,
  placeholder = "Select countries...",
  className,
}: CountryMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const allCountries = useMemo(() => getAllCountries(), []);

  const filteredCountries = useMemo(() => {
    if (!search) return allCountries;
    const lower = search.toLowerCase();
    return allCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.code.toLowerCase().includes(lower)
    );
  }, [allCountries, search]);

  const selectedCodes = new Set(value.map((c) => c.code));

  const handleSelect = (country: CountryOption) => {
    if (selectedCodes.has(country.code)) {
      // Remove
      onChange(value.filter((c) => c.code !== country.code));
    } else {
      // Add
      onChange([
        ...value,
        { code: country.code, name: country.name, flag: country.flag },
      ]);
    }
  };

  const handleRemove = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((c) => c.code !== code));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10", className)}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              value.map((country) => (
                <Badge
                  key={country.code}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5"
                >
                  <span>{country.flag}</span>
                  <span className="text-xs">{country.name}</span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => handleRemove(country.code, e)}
                  />
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-[240px]">
          {filteredCountries.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No countries found
            </div>
          ) : (
            <div className="p-1">
              {filteredCountries.map((country) => {
                const isSelected = selectedCodes.has(country.code);
                return (
                  <button
                    key={country.code}
                    onClick={() => handleSelect(country)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-left",
                      isSelected && "bg-accent"
                    )}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {country.continent}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {value.length > 0 && (
          <div className="p-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {value.length} {value.length === 1 ? "country" : "countries"} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onChange([])}
              >
                Clear all
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
