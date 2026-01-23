import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  PlaneTakeoff, 
  PlaneLanding, 
  Calendar,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchAirports, type Airport } from '@/lib/airportsData';
import { getAllCountries } from '@/lib/countriesData';

export interface FlightLeg {
  id: string;
  origin: string;
  originName?: string;
  destination: string;
  destinationName?: string;
  date: string;
}

interface MultiCityBuilderProps {
  legs: FlightLeg[];
  onLegsChange: (legs: FlightLeg[]) => void;
  maxLegs?: number;
  minLegs?: number;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const MultiCityBuilder = ({
  legs,
  onLegsChange,
  maxLegs = 6,
  minLegs = 2,
}: MultiCityBuilderProps) => {
  const [activeInput, setActiveInput] = useState<{ legId: string; field: 'origin' | 'destination' } | null>(null);
  const [searchResults, setSearchResults] = useState<Airport[]>([]);

  const handleAddLeg = () => {
    if (legs.length >= maxLegs) return;
    
    // Pre-fill origin with previous leg's destination
    const lastLeg = legs[legs.length - 1];
    const newLeg: FlightLeg = {
      id: generateId(),
      origin: lastLeg?.destination || '',
      originName: lastLeg?.destinationName || '',
      destination: '',
      date: '',
    };
    
    onLegsChange([...legs, newLeg]);
  };

  const handleRemoveLeg = (id: string) => {
    if (legs.length <= minLegs) return;
    onLegsChange(legs.filter(leg => leg.id !== id));
  };

  const handleLegChange = (id: string, field: keyof FlightLeg, value: string) => {
    onLegsChange(
      legs.map(leg => leg.id === id ? { ...leg, [field]: value } : leg)
    );
  };

  const handleSearch = (query: string, legId: string, field: 'origin' | 'destination') => {
    handleLegChange(legId, field, query.toUpperCase());
    if (query.length >= 2) {
      setSearchResults(searchAirports(query));
      setActiveInput({ legId, field });
    } else {
      setSearchResults([]);
      setActiveInput(null);
    }
  };

  // Helper to get country name from code
  const getCountryName = (code: string): string => {
    const allCountries = getAllCountries();
    const country = allCountries.find(c => c.code === code);
    return country?.name || code;
  };

  const handleSelectAirport = (airport: Airport, legId: string, field: 'origin' | 'destination') => {
    handleLegChange(legId, field, airport.code);
    const countryName = getCountryName(airport.country);
    const location = airport.country === "US" && airport.state 
      ? `${airport.city}, ${airport.state}, ${countryName}`
      : `${airport.city}, ${countryName}`;
    handleLegChange(legId, `${field}Name` as keyof FlightLeg, location);
    setSearchResults([]);
    setActiveInput(null);
    
    // If selecting destination, auto-fill next leg's origin
    if (field === 'destination') {
      const legIndex = legs.findIndex(l => l.id === legId);
      if (legIndex < legs.length - 1) {
        const nextLeg = legs[legIndex + 1];
        if (!nextLeg.origin) {
          handleLegChange(nextLeg.id, 'origin', airport.code);
          handleLegChange(nextLeg.id, 'originName', location);
        }
      }
    }
  };

  const moveLeg = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= legs.length) return;
    
    const newLegs = [...legs];
    [newLegs[fromIndex], newLegs[toIndex]] = [newLegs[toIndex], newLegs[fromIndex]];
    onLegsChange(newLegs);
  };

  // Validate legs
  const getValidationErrors = () => {
    const errors: string[] = [];
    
    legs.forEach((leg, index) => {
      if (!leg.origin) errors.push(`Flight ${index + 1}: Missing origin`);
      if (!leg.destination) errors.push(`Flight ${index + 1}: Missing destination`);
      if (!leg.date) errors.push(`Flight ${index + 1}: Missing date`);
      if (leg.origin && leg.destination && leg.origin === leg.destination) {
        errors.push(`Flight ${index + 1}: Origin and destination cannot be the same`);
      }
    });
    
    // Check date sequence
    for (let i = 1; i < legs.length; i++) {
      if (legs[i].date && legs[i - 1].date && legs[i].date < legs[i - 1].date) {
        errors.push(`Flight ${i + 1} date cannot be before Flight ${i} date`);
      }
    }
    
    return errors;
  };

  const validationErrors = getValidationErrors();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Multi-City Flights</CardTitle>
          <Badge variant="secondary">{legs.length} flights</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legs list */}
        {legs.map((leg, index) => (
          <div 
            key={leg.id} 
            className={cn(
              'relative p-4 rounded-lg border bg-card',
              index > 0 && 'mt-2'
            )}
          >
            {/* Leg number and reorder controls */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  Flight {index + 1}
                </Badge>
                {leg.originName && leg.destinationName && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {leg.originName} → {leg.destinationName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveLeg(index, 'up')}
                  >
                    <GripVertical className="h-3.5 w-3.5 rotate-90" />
                    <span className="sr-only">Move up</span>
                  </Button>
                )}
                {legs.length > minLegs && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveLeg(leg.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Remove flight</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Flight inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Origin */}
              <div className="relative">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <PlaneTakeoff className="h-3 w-3" />
                  From
                </Label>
                <Input
                  value={leg.origin}
                  onChange={(e) => handleSearch(e.target.value, leg.id, 'origin')}
                  onFocus={() => leg.origin.length >= 2 && setActiveInput({ legId: leg.id, field: 'origin' })}
                  onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                  placeholder="City or airport"
                  className="mt-1"
                />
                {activeInput?.legId === leg.id && activeInput.field === 'origin' && searchResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                    {searchResults.slice(0, 8).map(airport => {
                      const countryName = getCountryName(airport.country);
                      return (
                        <button
                          key={airport.code}
                          className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                          onMouseDown={() => handleSelectAirport(airport, leg.id, 'origin')}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{airport.code}</span>
                            <span className="text-xs text-muted-foreground">
                              {airport.city}{airport.country === "US" && airport.state ? `, ${airport.state}` : ""}, {countryName}
                            </span>
                            <span className="text-xs text-muted-foreground">{airport.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Destination */}
              <div className="relative">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <PlaneLanding className="h-3 w-3" />
                  To
                </Label>
                <Input
                  value={leg.destination}
                  onChange={(e) => handleSearch(e.target.value, leg.id, 'destination')}
                  onFocus={() => leg.destination.length >= 2 && setActiveInput({ legId: leg.id, field: 'destination' })}
                  onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                  placeholder="City or airport"
                  className="mt-1"
                />
                {activeInput?.legId === leg.id && activeInput.field === 'destination' && searchResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                    {searchResults.slice(0, 8).map(airport => {
                      const countryName = getCountryName(airport.country);
                      return (
                        <button
                          key={airport.code}
                          className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                          onMouseDown={() => handleSelectAirport(airport, leg.id, 'destination')}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{airport.code}</span>
                            <span className="text-xs text-muted-foreground">
                              {airport.city}{airport.country === "US" && airport.state ? `, ${airport.state}` : ""}, {countryName}
                            </span>
                            <span className="text-xs text-muted-foreground">{airport.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={leg.date}
                  onChange={(e) => handleLegChange(leg.id, 'date', e.target.value)}
                  min={index > 0 ? legs[index - 1].date : new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Connection indicator */}
            {index < legs.length - 1 && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-background border rounded-full p-1">
                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add flight button */}
        {legs.length < maxLegs && (
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={handleAddLeg}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add another flight
          </Button>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {validationErrors.map((error, i) => (
                  <p key={i} className="text-xs text-destructive">{error}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {legs.every(l => l.origin && l.destination) && (
          <div className="p-3 rounded-md bg-muted/50 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Route:</span>
            {legs.map((leg, i) => (
              <span key={leg.id} className="flex items-center gap-1">
                <span className="font-medium">{leg.origin}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-medium">{leg.destination}</span>
                {i < legs.length - 1 && <span className="text-muted-foreground mx-1">•</span>}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { MultiCityBuilder };