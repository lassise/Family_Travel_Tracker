import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

interface CountryFiltersProps {
  continents: string[];
  years: number[];
  selectedContinent: string;
  selectedYear: string;
  onContinentChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onClear: () => void;
}

const CountryFilters = ({
  continents,
  years,
  selectedContinent,
  selectedYear,
  onContinentChange,
  onYearChange,
  onClear,
}: CountryFiltersProps) => {
  const hasFilters = selectedContinent !== 'all' || selectedYear !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filters:</span>
      </div>

      <Select value={selectedContinent} onValueChange={onContinentChange}>
        <SelectTrigger className="w-[140px] h-8 text-sm">
          <SelectValue placeholder="Continent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Continents</SelectItem>
          {continents.map((continent) => (
            <SelectItem key={continent} value={continent}>
              {continent}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="w-[120px] h-8 text-sm">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default CountryFilters;
