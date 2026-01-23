import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X, Users } from 'lucide-react';
import { FamilyMember } from '@/hooks/useFamilyData';

interface CountryFiltersProps {
  continents: string[];
  years: number[];
  selectedContinent: string;
  selectedYear: string;
  onContinentChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onClear: () => void;
  familyMembers?: FamilyMember[];
  selectedMemberId?: string | null;
  onMemberChange?: (memberId: string | null) => void;
}

const CountryFilters = ({
  continents,
  years,
  selectedContinent,
  selectedYear,
  onContinentChange,
  onYearChange,
  onClear,
  familyMembers,
  selectedMemberId,
  onMemberChange,
}: CountryFiltersProps) => {
  const hasFilters = selectedContinent !== 'all' || selectedYear !== 'all' || (selectedMemberId !== null && selectedMemberId !== undefined);

  const handleMemberChange = (value: string) => {
    if (onMemberChange) {
      onMemberChange(value === 'all' ? null : value);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filters:</span>
      </div>

      {familyMembers && familyMembers.length > 1 && onMemberChange && (
        <Select
          value={selectedMemberId || 'all'}
          onValueChange={handleMemberChange}
        >
          <SelectTrigger className="w-auto min-w-[140px] h-8 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground mr-2" />
            <SelectValue placeholder="All Members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {familyMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  />
                  <span>{member.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

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
