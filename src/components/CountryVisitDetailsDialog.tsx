import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Plus, Trash2, Clock, X, Edit3, Hash, CalendarDays, ChevronDown, ChevronUp, Users, Check, ChevronsUpDown, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getCitiesForCountry } from "@/lib/citiesData";
import { getAllCountries, type CountryOption } from "@/lib/countriesData";
import { differenceInDays, parseISO, isAfter, format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TravelDatePicker } from "@/components/TravelDatePicker";
import CountryFlag from "@/components/common/CountryFlag";
import { cn } from "@/lib/utils";

// Calculate days between two dates (inclusive)
const calculateDays = (startDate: string | null, endDate: string | null): number | null => {
  if (!startDate || !endDate) return null;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (isAfter(start, end)) return null;
  return differenceInDays(end, start) + 1;
};

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
}

// Local state interface for new visits being created
interface NewVisitDraft {
  id: string;
  tripName: string;
  isApproximate: boolean;
  approximateMonth: number | null;
  approximateYear: number | null;
  visitDate: string | null;
  endDate: string | null;
  numberOfDays: number;
  cities: string[];
  familyMemberIds: string[];
  // Country for this leg (allows different country per leg for multi-country trips)
  countryCode: string;
  countryName: string;
  countryId: string | null; // null if the country doesn't exist yet in the user's list
}

// Debounced input component for trip name
const TripNameInput = ({ 
  initialValue, 
  onSave 
}: { 
  initialValue: string; 
  onSave: (value: string) => void;
}) => {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <Input
      type="text"
      placeholder="e.g., Trip with In-laws"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== initialValue) {
          onSave(value);
        }
      }}
      className="h-8 text-sm"
    />
  );
};

// Debounced input component for days
const DaysInput = ({ 
  initialValue, 
  disabled,
  onSave 
}: { 
  initialValue: number; 
  disabled: boolean;
  onSave: (value: number) => void;
}) => {
  const [value, setValue] = useState(initialValue.toString());
  
  useEffect(() => {
    setValue(initialValue.toString());
  }, [initialValue]);

  return (
    <Input
      type="number"
      min={1}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1 && numValue !== initialValue) {
          onSave(numValue);
        } else if (isNaN(numValue) || numValue < 1) {
          setValue(initialValue.toString());
        }
      }}
      disabled={disabled}
      className={`h-8 text-sm ${disabled ? "bg-muted cursor-not-allowed" : ""}`}
      placeholder="Enter days"
    />
  );
};

interface VisitDetail {
  id: string;
  country_id: string;
  visit_date: string | null;
  end_date: string | null;
  number_of_days: number;
  notes: string | null;
  trip_name: string | null;
  approximate_month?: number | null;
  approximate_year?: number | null;
  is_approximate?: boolean;
}

interface CityVisit {
  id: string;
  country_id: string;
  city_name: string;
  visit_date: string | null;
  notes: string | null;
}

interface CountryVisitDetailsDialogProps {
  countryId: string;
  countryName: string;
  countryCode: string;
  onUpdate: () => void;
  buttonLabel?: string;
  // Optional controlled props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // When true, hide the trigger button and control the dialog purely via `open`
  hideTrigger?: boolean;
}

// City picker component
const CityPicker = ({
  countryCode,
  selectedCities,
  onAddCity,
  onRemoveCity,
}: {
  countryCode: string;
  selectedCities: string[];
  onAddCity: (city: string) => void;
  onRemoveCity: (city: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const cities = getCitiesForCountry(countryCode);

  const filteredCities = cities.filter(
    (city) =>
      city.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selectedCities.includes(city)
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
            <Plus className="w-3 h-3 mr-1" />
            Add cities visited...
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or type city..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {searchValue.trim() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      onAddCity(searchValue.trim());
                      setSearchValue("");
                      setOpen(false);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add "{searchValue}"
                  </Button>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredCities.slice(0, 30).map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={() => {
                      onAddCity(city);
                      setSearchValue("");
                      setOpen(false);
                    }}
                  >
                    <MapPin className="w-3 h-3 mr-2 text-muted-foreground" />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedCities.map((city) => (
            <Badge key={city} variant="secondary" className="text-xs py-0.5 px-2">
              <MapPin className="w-2.5 h-2.5 mr-1" />
              {city}
              <button
                onClick={() => onRemoveCity(city)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// All countries for the country selector
const allCountries = getAllCountries();

// Single country selector for a leg
const LegCountrySelector = ({
  selectedCode,
  selectedName,
  onSelect,
}: {
  selectedCode: string;
  selectedName: string;
  onSelect: (country: CountryOption) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-8 text-sm"
          type="button"
        >
          <span className="flex items-center gap-2">
            <CountryFlag countryCode={selectedCode} countryName={selectedName} size="sm" />
            {selectedName}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search countries..." />
          <CommandList className="max-h-[200px]">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {allCountries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.name}
                  onSelect={() => {
                    onSelect(country);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCode === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <CountryFlag
                    countryCode={country.code}
                    countryName={country.name}
                    size="sm"
                    className="mr-2"
                  />
                  <span>{country.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// New visit draft card component
const NewVisitCard = ({
  draft,
  index,
  parentCountryCode,
  familyMembers,
  onUpdate,
  onRemove,
  onCountryChange,
}: {
  draft: NewVisitDraft;
  index: number;
  parentCountryCode: string;
  familyMembers: FamilyMember[];
  onUpdate: (id: string, updates: Partial<NewVisitDraft>) => void;
  onRemove: (id: string) => void;
  onCountryChange: (draftId: string, countryCode: string) => void;
}) => {
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const handleDateChange = (startDate: string | null, endDate: string | null) => {
    let numberOfDays = draft.numberOfDays;
    if (startDate && endDate) {
      const calculated = calculateDays(startDate, endDate);
      if (calculated) numberOfDays = calculated;
    }

    onUpdate(draft.id, {
      visitDate: startDate,
      endDate: endDate,
      numberOfDays,
      isApproximate: false,
      approximateMonth: null,
      approximateYear: null,
    });
  };

  const toggleFamilyMember = (memberId: string) => {
    const newIds = draft.familyMemberIds.includes(memberId)
      ? draft.familyMemberIds.filter((id) => id !== memberId)
      : [...draft.familyMemberIds, memberId];
    onUpdate(draft.id, { familyMemberIds: newIds });
  };

  const handleCountrySelect = (country: CountryOption) => {
    // Update the draft's country and clear cities (since they're country-specific)
    onUpdate(draft.id, {
      countryCode: country.code,
      countryName: country.name,
      countryId: null, // Will be resolved when saving
      cities: [], // Clear cities when country changes
    });
    onCountryChange(draft.id, country.code);
  };

  // Determine if this leg is for a different country than the parent dialog
  const isDifferentCountry = draft.countryCode !== parentCountryCode;

  return (
    <Card className={cn(
      "border-primary/30 bg-primary/5",
      isDifferentCountry && "border-blue-500/50 bg-blue-500/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Badge variant={isDifferentCountry ? "default" : "outline"} className="text-xs">
              {isDifferentCountry ? (
                <>
                  <Globe className="w-3 h-3 mr-1" />
                  Leg #{index + 1}
                </>
              ) : (
                `New Visit #${index + 1}`
              )}
            </Badge>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground cursor-pointer">
                Approximate dates
              </Label>
              <Switch
                checked={draft.isApproximate}
                onCheckedChange={(checked) => {
                  onUpdate(draft.id, {
                    isApproximate: checked,
                    visitDate: checked ? null : draft.visitDate,
                    endDate: checked ? null : draft.endDate,
                    approximateMonth: checked ? draft.approximateMonth : null,
                    approximateYear: checked ? draft.approximateYear : null,
                  });
                }}
                className="scale-75"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(draft.id)}
            className="text-destructive hover:text-destructive h-6 w-6 p-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Country Selector - allows picking a different country for this leg */}
        <div className="mb-3">
          <Label className="text-xs mb-1 block flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Country for this leg
          </Label>
          <LegCountrySelector
            selectedCode={draft.countryCode}
            selectedName={draft.countryName}
            onSelect={handleCountrySelect}
          />
          {isDifferentCountry && (
            <p className="text-xs text-blue-600 mt-1">
              This leg will be added to {draft.countryName}
            </p>
          )}
        </div>

        {/* Trip Name */}
        <div className="mb-3">
          <Label className="text-xs mb-1 block">Trip Name (optional)</Label>
          <Input
            type="text"
            placeholder="e.g., Trip with In-laws"
            value={draft.tripName}
            onChange={(e) => onUpdate(draft.id, { tripName: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-3">
          {draft.isApproximate ? (
            <div>
              <Label className="text-xs mb-1 block flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                Approximate Time
              </Label>
              <div className="flex gap-2">
                <Select
                  value={draft.approximateMonth?.toString() || ""}
                  onValueChange={(value) =>
                    onUpdate(draft.id, { approximateMonth: value ? parseInt(value) : null })
                  }
                >
                  <SelectTrigger className="h-8 text-sm flex-1">
                    <SelectValue placeholder="Month (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={draft.approximateYear?.toString() || ""}
                  onValueChange={(value) =>
                    onUpdate(draft.id, { approximateYear: value ? parseInt(value) : null })
                  }
                >
                  <SelectTrigger className="h-8 text-sm w-28">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs mb-1 block">Travel Dates</Label>
              <TravelDatePicker
                startDate={draft.visitDate}
                endDate={draft.endDate}
                onSave={handleDateChange}
              />
            </div>
          )}

          {/* Days */}
          <div>
            <Label className="text-xs mb-1 block">Days</Label>
            <Input
              type="number"
              min={1}
              value={draft.numberOfDays ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value);
                onUpdate(draft.id, {
                  numberOfDays: value === "" ? null : (isNaN(numValue) ? null : numValue),
                });
              }}
              disabled={!draft.isApproximate && !!draft.visitDate && !!draft.endDate}
              className="h-8 text-sm"
              placeholder="Enter days"
            />
          </div>

          {/* Cities */}
          <div>
            <Label className="text-xs mb-1 block flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Cities Visited in {draft.countryName}
            </Label>
            <CityPicker
              countryCode={draft.countryCode}
              selectedCities={draft.cities}
              onAddCity={(city) =>
                onUpdate(draft.id, { cities: [...draft.cities, city] })
              }
              onRemoveCity={(city) =>
                onUpdate(draft.id, { cities: draft.cities.filter((c) => c !== city) })
              }
            />
          </div>

          {/* Family Members */}
          {familyMembers.length > 0 && (
            <div>
              <Label className="text-xs mb-2 block flex items-center gap-1">
                <Users className="w-3 h-3" />
                Who went on this trip? (optional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {familyMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-1.5 text-xs cursor-pointer"
                  >
                    <Checkbox
                      checked={draft.familyMemberIds.includes(member.id)}
                      onCheckedChange={() => toggleFamilyMember(member.id)}
                    />
                    <span>{member.avatar}</span>
                    <span>{member.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CountryVisitDetailsDialog = ({
  countryId,
  countryName,
  countryCode,
  onUpdate,
  buttonLabel = "Details",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
}: CountryVisitDetailsDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Support both controlled and uncontrolled usage
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled && controlledOnOpenChange) {
      controlledOnOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  const [visitDetails, setVisitDetails] = useState<VisitDetail[]>([]);
  const [cityVisits, setCityVisits] = useState<CityVisit[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [visitFamilyMembers, setVisitFamilyMembers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [newVisits, setNewVisits] = useState<NewVisitDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const cities = getCitiesForCountry(countryCode);
  const [defaultVisitedMemberIds, setDefaultVisitedMemberIds] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [visitsResult, citiesResult, familyResult, countryVisitsResult] = await Promise.all([
        supabase
          .from("country_visit_details")
          .select("*")
          .eq("country_id", countryId)
          .order("visit_date", { ascending: false }),
        supabase
          .from("city_visits")
          .select("*")
          .eq("country_id", countryId)
          .order("city_name", { ascending: true }),
        supabase
          .from("family_members")
          .select("id, name, avatar")
          .order("name", { ascending: true }),
        supabase
          .from("country_visits")
          .select("family_member_id")
          .eq("country_id", countryId),
      ]);

      if (visitsResult.error) throw visitsResult.error;
      if (citiesResult.error) throw citiesResult.error;
      if (familyResult.error) throw familyResult.error;
      if (countryVisitsResult.error) throw countryVisitsResult.error;

      setVisitDetails(visitsResult.data || []);
      setCityVisits(citiesResult.data || []);
      setFamilyMembers(familyResult.data || []);

      // Precompute default family members who have visited this country
      if (countryVisitsResult.data) {
        const ids = Array.from(
          new Set(
            (countryVisitsResult.data as { family_member_id: string | null }[])
              .map((row) => row.family_member_id)
              .filter((id): id is string => !!id)
          )
        );
        setDefaultVisitedMemberIds(ids);
      }

      // Fetch visit family member associations
      if (visitsResult.data && visitsResult.data.length > 0) {
        const visitIds = visitsResult.data.map((v) => v.id);
        const { data: vfmData } = await supabase
          .from("visit_family_members")
          .select("visit_id, family_member_id")
          .in("visit_id", visitIds);

        if (vfmData) {
          const mapping: Record<string, string[]> = {};
          vfmData.forEach((item) => {
            if (!mapping[item.visit_id]) mapping[item.visit_id] = [];
            mapping[item.visit_id].push(item.family_member_id);
          });
          setVisitFamilyMembers(mapping);
        }
      }
    } catch (error) {
      console.error("Error fetching visit details:", error);
    } finally {
      setLoading(false);
    }
  }, [countryId]);

  useEffect(() => {
    if (open) {
      fetchData();
      setNewVisits([]);
    }
  }, [open, fetchData]);

  const createNewVisitDraft = (): NewVisitDraft => ({
    id: crypto.randomUUID(),
    tripName: "",
    isApproximate: false,
    approximateMonth: null,
    approximateYear: null,
    visitDate: null,
    endDate: null,
    numberOfDays: 1,
    cities: [],
    // Preselect all family members who have previously visited this country.
    // If none have, this will be an empty array.
    familyMemberIds: defaultVisitedMemberIds,
    // Default to the parent dialog's country
    countryCode: countryCode,
    countryName: countryName,
    countryId: countryId,
  });

  const handleAddNewVisitDraft = () => {
    setNewVisits((prev) => [...prev, createNewVisitDraft()]);
  };

  const handleUpdateNewVisitDraft = (id: string, updates: Partial<NewVisitDraft>) => {
    setNewVisits((prev) =>
      prev.map((draft) => (draft.id === id ? { ...draft, ...updates } : draft))
    );
  };

  const handleRemoveNewVisitDraft = (id: string) => {
    setNewVisits((prev) => prev.filter((draft) => draft.id !== id));
  };

  // When a leg's country changes, fetch family members who have visited that country
  // For NEW countries (not yet in user's list), pre-select ALL family members
  const handleLegCountryChange = useCallback(async (draftId: string, newCountryCode: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find the country ID from the user's countries table
      // Note: ISO code is stored in the 'flag' field, not 'code'
      const { data: countryData } = await supabase
        .from("countries")
        .select("id")
        .eq("flag", newCountryCode)
        .eq("user_id", user.id)
        .single();

      if (countryData) {
        // Country exists - fetch family members who have visited
        const { data: visitData } = await supabase
          .from("country_visits")
          .select("family_member_id")
          .eq("country_id", countryData.id);

        if (visitData) {
          const memberIds = Array.from(
            new Set(
              visitData
                .map((row) => row.family_member_id)
                .filter((id): id is string => !!id)
            )
          );
          
          // Update the draft with the country ID and preselected family members
          setNewVisits((prev) =>
            prev.map((draft) =>
              draft.id === draftId
                ? { ...draft, countryId: countryData.id, familyMemberIds: memberIds }
                : draft
            )
          );
        }
      } else {
        // NEW COUNTRY - not in user's list yet
        // Pre-select ALL family members since this is a brand new country
        // The user can deselect anyone who didn't go on this trip
        const allMemberIds = familyMembers.map(m => m.id);
        
        setNewVisits((prev) =>
          prev.map((draft) =>
            draft.id === draftId
              ? { ...draft, countryId: null, familyMemberIds: allMemberIds }
              : draft
          )
        );
      }
    } catch (error) {
      console.error("Error fetching country data for leg:", error);
    }
  }, [familyMembers]);

  const handleSaveNewVisits = async () => {
    if (newVisits.length === 0) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "You must be logged in", variant: "destructive" });
        setSaving(false);
        return;
      }

      // Determine if we have multiple legs (for trip grouping)
      const hasMultipleLegs = newVisits.length > 1;
      const hasDifferentCountries = new Set(newVisits.map(d => d.countryCode)).size > 1;
      
      // Generate a trip_group_id if we have multiple legs or different countries
      const tripGroupId = (hasMultipleLegs || hasDifferentCountries) ? crypto.randomUUID() : null;

      // Use the first non-empty trip name as the shared trip name for the group
      const sharedTripName = newVisits.find(d => d.tripName)?.tripName || null;

      // Insert all new visits
      for (const draft of newVisits) {
        // Resolve the country ID - may need to create the country first
        let resolvedCountryId = draft.countryId;
        
        if (!resolvedCountryId) {
          // Check if country exists in user's countries table
          // Note: ISO code is stored in the 'flag' field
          const { data: existingCountry } = await supabase
            .from("countries")
            .select("id")
            .eq("flag", draft.countryCode)
            .eq("user_id", user.id)
            .single();

          if (existingCountry) {
            resolvedCountryId = existingCountry.id;
          } else {
            // Create the country for this user
            // Note: 'flag' field stores the ISO code, not emoji
            const countryInfo = allCountries.find(c => c.code === draft.countryCode);
            const { data: newCountry, error: createError } = await supabase
              .from("countries")
              .insert({
                name: draft.countryName,
                flag: draft.countryCode, // ISO code goes in flag field
                continent: countryInfo?.continent || "Unknown",
                user_id: user.id,
              })
              .select()
              .single();

            if (createError) {
              console.error("Error creating country:", createError);
              toast({ title: `Error adding ${draft.countryName}`, variant: "destructive" });
              continue;
            }
            resolvedCountryId = newCountry.id;
          }
        }

        if (!resolvedCountryId) {
          console.error("Could not resolve country ID for:", draft.countryCode);
          continue;
        }

        const visitData = {
          country_id: resolvedCountryId,
          trip_name: draft.tripName || sharedTripName || null,
          is_approximate: draft.isApproximate,
          approximate_month: draft.approximateMonth,
          approximate_year: draft.approximateYear,
          visit_date: draft.visitDate,
          end_date: draft.endDate,
          number_of_days: draft.numberOfDays,
          user_id: user.id,
          trip_group_id: tripGroupId,
        };

        const { data: insertedVisit, error: visitError } = await supabase
          .from("country_visit_details")
          .insert(visitData)
          .select()
          .single();

        if (visitError) throw visitError;

        // Insert family member associations
        if (draft.familyMemberIds.length > 0 && insertedVisit) {
          const familyInserts = draft.familyMemberIds.map((memberId) => ({
            visit_id: insertedVisit.id,
            family_member_id: memberId,
            user_id: user.id,
          }));

          const { error: familyError } = await supabase
            .from("visit_family_members")
            .insert(familyInserts);

          if (familyError) console.error("Error saving family members:", familyError);
        }

        // Insert cities for this visit (using the draft's resolved country ID)
        if (draft.cities.length > 0) {
          // First check existing cities for this specific country
          const { data: existingCitiesData } = await supabase
            .from("city_visits")
            .select("city_name")
            .eq("country_id", resolvedCountryId);

          const existingCityNames = (existingCitiesData || []).map(c => c.city_name.toLowerCase());

          const cityInserts = draft.cities
            .filter(city => !existingCityNames.includes(city.toLowerCase()))
            .map((city) => ({
              country_id: resolvedCountryId,
              city_name: city,
              user_id: user.id,
            }));

          if (cityInserts.length > 0) {
            const { error: cityError } = await supabase
              .from("city_visits")
              .insert(cityInserts);

            if (cityError) console.error("Error saving cities:", cityError);
          }
        }

        // Ensure the country is marked as visited
        // Track if this was a newly created country (no prior visits possible)
        const isNewlyCreatedCountry = !draft.countryId;
        
        // Determine which family members to mark as visitors
        let membersToMark = draft.familyMemberIds;
        
        // For NEW countries with no family members selected, auto-add all family members
        // This ensures the country shows up in the visited list
        if (isNewlyCreatedCountry && membersToMark.length === 0 && familyMembers.length > 0) {
          membersToMark = familyMembers.map(m => m.id);
        }
        
        // Create visit entries for the family members
        for (const memberId of membersToMark) {
          // Check if visit already exists
          const { data: existingVisit } = await supabase
            .from("country_visits")
            .select("id")
            .eq("country_id", resolvedCountryId)
            .eq("family_member_id", memberId)
            .single();

          if (!existingVisit) {
            await supabase
              .from("country_visits")
              .insert({
                country_id: resolvedCountryId,
                family_member_id: memberId,
                user_id: user.id,
              });
          }
        }
      }

      const legCount = newVisits.length;
      const countryCount = new Set(newVisits.map(d => d.countryCode)).size;
      
      if (countryCount > 1) {
        toast({ title: `Added ${legCount} legs across ${countryCount} countries` });
      } else {
        toast({ title: `Added ${legCount} visit${legCount > 1 ? "s" : ""}` });
      }
      
      setNewVisits([]);
      fetchData();
      onUpdate(); // Notify parent to refresh
    } catch (error) {
      console.error("Error saving visits:", error);
      toast({ title: "Error saving visits", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisitFamilyMember = async (visitId: string, memberId: string) => {
    const currentMembers = visitFamilyMembers[visitId] || [];
    const isCurrentlySelected = currentMembers.includes(memberId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isCurrentlySelected) {
        // Remove the association
        await supabase
          .from("visit_family_members")
          .delete()
          .eq("visit_id", visitId)
          .eq("family_member_id", memberId);
      } else {
        // Add the association
        await supabase
          .from("visit_family_members")
          .insert({
            visit_id: visitId,
            family_member_id: memberId,
            user_id: user.id,
          });
      }

      // Update local state
      setVisitFamilyMembers((prev) => ({
        ...prev,
        [visitId]: isCurrentlySelected
          ? currentMembers.filter((id) => id !== memberId)
          : [...currentMembers, memberId],
      }));
    } catch (error) {
      console.error("Error toggling family member:", error);
    }
  };

  const handleUpdateVisit = async (
    visitId: string,
    field: string,
    value: string | number | null,
    currentVisit?: VisitDetail
  ) => {
    let updateData: Record<string, string | number | null> = { [field]: value };

    if (currentVisit && (field === "visit_date" || field === "end_date")) {
      const newStartDate = field === "visit_date" ? (value as string | null) : currentVisit.visit_date;
      const newEndDate = field === "end_date" ? (value as string | null) : currentVisit.end_date;

      if (newStartDate && newEndDate) {
        const start = parseISO(newStartDate);
        const end = parseISO(newEndDate);
        if (isAfter(start, end)) {
          toast({ title: "End date must be after start date", variant: "destructive" });
          return;
        }
        const calculatedDays = calculateDays(newStartDate, newEndDate);
        if (calculatedDays) {
          updateData.number_of_days = calculatedDays;
        }
      }
    }

    const { error } = await supabase
      .from("country_visit_details")
      .update(updateData)
      .eq("id", visitId);

    if (error) {
      toast({ title: "Error updating visit", variant: "destructive" });
    } else {
      fetchData();
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    const { error } = await supabase
      .from("country_visit_details")
      .delete()
      .eq("id", visitId);

    if (error) {
      toast({ title: "Error deleting visit", variant: "destructive" });
    } else {
      fetchData();
    }
  };

  const handleAddCity = async (cityName: string) => {
    if (!cityName.trim()) return;

    const existingCity = cityVisits.find(
      (c) => c.city_name.toLowerCase() === cityName.toLowerCase()
    );
    if (existingCity) {
      toast({ title: "City already added", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "You must be logged in", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("city_visits").insert({
      country_id: countryId,
      city_name: cityName.trim(),
      user_id: user.id,
    });

    if (error) {
      toast({ title: "Error adding city", variant: "destructive" });
    } else {
      fetchData();
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    const { error } = await supabase.from("city_visits").delete().eq("id", cityId);

    if (error) {
      toast({ title: "Error deleting city", variant: "destructive" });
    } else {
      fetchData();
    }
  };

  const totalDays = visitDetails.reduce((sum, v) => sum + (v.number_of_days || 0), 0);
  const timesVisited = visitDetails.length;

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      onUpdate();
    }
  };

  const toggleVisitExpanded = (visitId: string) => {
    setExpandedVisits((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(visitId)) {
        newSet.delete(visitId);
      } else {
        newSet.add(visitId);
      }
      return newSet;
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {buttonLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {countryName} Visit Details
          </DialogTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">
              <Clock className="w-3 h-3 mr-1" />
              {timesVisited} {timesVisited === 1 ? "visit" : "visits"}
            </Badge>
            <Badge variant="secondary">
              <Calendar className="w-3 h-3 mr-1" />
              {totalDays} {totalDays === 1 ? "day" : "days"} total
            </Badge>
            <Badge variant="secondary">
              <MapPin className="w-3 h-3 mr-1" />
              {cityVisits.length} {cityVisits.length === 1 ? "city" : "cities"}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Add Multiple Visits Section */}
              <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <Label className="font-medium">Add Trip Legs</Label>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Add one or more trip legs. Each leg can be in a different country — perfect for multi-country trips!
              </p>
              
              {newVisits.length > 0 && (
                <div className="space-y-3 mb-3">
                  {newVisits.map((draft, index) => (
                    <NewVisitCard
                      key={draft.id}
                      draft={draft}
                      index={index}
                      parentCountryCode={countryCode}
                      familyMembers={familyMembers}
                      onUpdate={handleUpdateNewVisitDraft}
                      onRemove={handleRemoveNewVisitDraft}
                      onCountryChange={handleLegCountryChange}
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleAddNewVisitDraft}>
                  <Plus className="w-4 h-4 mr-1" />
                  {newVisits.length === 0 ? "Add Trip Leg" : "Add Another Leg"}
                </Button>
                {newVisits.length > 0 && (
                  <Button size="sm" onClick={handleSaveNewVisits} disabled={saving}>
                    {saving ? "Saving..." : (() => {
                      const countryCount = new Set(newVisits.map(d => d.countryCode)).size;
                      if (countryCount > 1) {
                        return `Save ${newVisits.length} Legs (${countryCount} countries)`;
                      }
                      return `Save ${newVisits.length} Visit${newVisits.length > 1 ? "s" : ""}`;
                    })()}
                  </Button>
                )}
              </div>
            </div>

            {/* Existing Visits Section */}
            {visitDetails.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Saved Visits ({visitDetails.length})</h3>
                </div>

                <div className="space-y-2">
                  {visitDetails.map((visit, index) => {
                    const isExpanded = expandedVisits.has(visit.id);

                    const hasDateRange = visit.visit_date && visit.end_date;
                    const isAutoCalculated = hasDateRange && calculateDays(visit.visit_date, visit.end_date) !== null;
                    const isApproximate = visit.is_approximate || false;

                    const handleVisitDateSave = async (startDate: string | null, endDate: string | null) => {
                      let updateData: Record<string, string | number | null | boolean> = {
                        visit_date: startDate,
                        end_date: endDate,
                        is_approximate: false,
                        approximate_month: null,
                        approximate_year: null,
                      };

                      if (startDate && endDate) {
                        const calculatedDays = calculateDays(startDate, endDate);
                        if (calculatedDays) {
                          updateData.number_of_days = calculatedDays;
                        }
                      }

                      const { error } = await supabase
                        .from("country_visit_details")
                        .update(updateData)
                        .eq("id", visit.id);

                      if (error) {
                        toast({ title: "Error updating dates", variant: "destructive" });
                      } else {
                        fetchData();
                      }
                    };

                    const handleApproximateToggle = async (checked: boolean) => {
                      const updateData: Record<string, string | number | null | boolean> = {
                        is_approximate: checked,
                      };

                      if (checked) {
                        updateData.visit_date = null;
                        updateData.end_date = null;
                      } else {
                        updateData.approximate_month = null;
                        updateData.approximate_year = null;
                      }

                      const { error } = await supabase
                        .from("country_visit_details")
                        .update(updateData)
                        .eq("id", visit.id);

                      if (error) {
                        toast({ title: "Error updating visit", variant: "destructive" });
                      } else {
                        fetchData();
                      }
                    };

                    const handleApproximateUpdate = async (field: string, value: number | string | null) => {
                      const { error } = await supabase
                        .from("country_visit_details")
                        .update({ [field]: value })
                        .eq("id", visit.id);

                      if (error) {
                        toast({ title: "Error updating visit", variant: "destructive" });
                      } else {
                        fetchData();
                      }
                    };

                    const months = [
                      { value: 1, label: "January" },
                      { value: 2, label: "February" },
                      { value: 3, label: "March" },
                      { value: 4, label: "April" },
                      { value: 5, label: "May" },
                      { value: 6, label: "June" },
                      { value: 7, label: "July" },
                      { value: 8, label: "August" },
                      { value: 9, label: "September" },
                      { value: 10, label: "October" },
                      { value: 11, label: "November" },
                      { value: 12, label: "December" },
                    ];

                    const currentYear = new Date().getFullYear();
                    const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

                    // Build a display title for the visit
                    let visitTitle = visit.trip_name || `Visit #${visitDetails.length - index}`;
                    let visitSubtitle = "";
                    if (isApproximate) {
                      const monthName = months.find((m) => m.value === visit.approximate_month)?.label;
                      visitSubtitle = [monthName, visit.approximate_year].filter(Boolean).join(" ") || "Date unknown";
                    } else if (visit.visit_date) {
                      visitSubtitle = visit.end_date
                        ? `${format(parseISO(visit.visit_date), "MMM d")} - ${format(parseISO(visit.end_date), "MMM d, yyyy")}`
                        : format(parseISO(visit.visit_date), "MMM d, yyyy");
                    }
                    visitSubtitle += ` • ${visit.number_of_days} day${visit.number_of_days !== 1 ? "s" : ""}`;
                    
                    // Indicate if this visit is part of a multi-country trip group
                    const isPartOfGroupedTrip = !!visit.trip_group_id;

                    return (
                      <Collapsible key={visit.id} open={isExpanded} onOpenChange={() => toggleVisitExpanded(visit.id)}>
                        <Card>
                          <CollapsibleTrigger asChild>
                            <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="font-medium text-sm flex items-center gap-2">
                                    {visitTitle}
                                    {isPartOfGroupedTrip && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        Multi-country
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{visitSubtitle}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteVisit(visit.id);
                                  }}
                                  className="text-destructive hover:text-destructive h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0 pb-4 px-4 border-t">
                              <div className="pt-3 space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                  <Label className="text-xs text-muted-foreground cursor-pointer">
                                    Approximate dates
                                  </Label>
                                  <Switch
                                    checked={isApproximate}
                                    onCheckedChange={handleApproximateToggle}
                                    className="scale-75"
                                  />
                                </div>

                                {/* Trip Name */}
                                <div>
                                  <Label className="text-xs mb-1 block">Trip Name</Label>
                                  <TripNameInput
                                    initialValue={visit.trip_name || ""}
                                    onSave={(value) => handleUpdateVisit(visit.id, "trip_name", value || null)}
                                  />
                                </div>

                                {isApproximate ? (
                                  <div>
                                    <Label className="text-xs mb-1 block flex items-center gap-1">
                                      <CalendarDays className="w-3 h-3" />
                                      Approximate Time
                                    </Label>
                                    <div className="flex gap-2">
                                      <Select
                                        value={visit.approximate_month?.toString() || ""}
                                        onValueChange={(value) =>
                                          handleApproximateUpdate("approximate_month", value ? parseInt(value) : null)
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-sm flex-1">
                                          <SelectValue placeholder="Month (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {months.map((month) => (
                                            <SelectItem key={month.value} value={month.value.toString()}>
                                              {month.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={visit.approximate_year?.toString() || ""}
                                        onValueChange={(value) =>
                                          handleApproximateUpdate("approximate_year", value ? parseInt(value) : null)
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-sm w-28">
                                          <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {years.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>
                                              {year}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <Label className="text-xs mb-1 block">Travel Dates</Label>
                                    <TravelDatePicker
                                      startDate={visit.visit_date}
                                      endDate={visit.end_date}
                                      onSave={handleVisitDateSave}
                                    />
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <Label className="text-xs">Days</Label>
                                    {!isApproximate && isAutoCalculated ? (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Auto-calculated
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Edit3 className="w-3 h-3" />
                                        Manual entry
                                      </span>
                                    )}
                                  </div>
                                  <DaysInput
                                    initialValue={visit.number_of_days}
                                    disabled={!isApproximate && isAutoCalculated}
                                    onSave={(value) => handleUpdateVisit(visit.id, "number_of_days", value)}
                                  />
                                </div>

                                {/* Family Members */}
                                {familyMembers.length > 0 && (
                                  <div>
                                    <Label className="text-xs mb-2 block flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      Who went on this trip? (optional)
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                      {familyMembers.map((member) => (
                                        <label
                                          key={member.id}
                                          className="flex items-center gap-1.5 text-xs cursor-pointer"
                                        >
                                          <Checkbox
                                            checked={(visitFamilyMembers[visit.id] || []).includes(member.id)}
                                            onCheckedChange={() => handleToggleVisitFamilyMember(visit.id, member.id)}
                                          />
                                          <span>{member.avatar}</span>
                                          <span>{member.name}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Cities Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">All Cities Visited</h3>
              </div>

              <div className="mb-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Add a city...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search or type city name..." />
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandEmpty>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={(e) => {
                              const input = (e.target as HTMLElement).closest('[cmdk-root]')?.querySelector('input');
                              if (input?.value) handleAddCity(input.value);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add custom city
                          </Button>
                        </CommandEmpty>
                        <CommandGroup>
                          {cities
                            .filter(
                              (city) =>
                                !cityVisits.some(
                                  (c) => c.city_name.toLowerCase() === city.toLowerCase()
                                )
                            )
                            .slice(0, 50)
                            .map((city) => (
                              <CommandItem
                                key={city}
                                value={city}
                                onSelect={() => handleAddCity(city)}
                              >
                                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                                {city}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {cityVisits.length === 0 ? (
                <p className="text-muted-foreground text-sm">No cities recorded yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {cityVisits.map((city) => (
                    <Badge
                      key={city.id}
                      variant="secondary"
                      className="text-sm py-1 px-3 flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      {city.city_name}
                      <button
                        onClick={() => handleDeleteCity(city.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CountryVisitDetailsDialog;
