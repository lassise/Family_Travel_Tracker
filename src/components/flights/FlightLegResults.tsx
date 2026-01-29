import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { FlightTransparencyPanel } from "./FlightTransparencyPanel";
import { ConnectionRiskIndicator } from "./ConnectionRiskIndicator";
import { PriceAlertDialog } from "./PriceAlertDialog";
import { AirportTooltip } from "./AirportTooltip";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
  Star,
  Zap,
  DollarSign,
  PlaneTakeoff,
  Clock,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Wifi,
  Power,
  Tv,
  ThumbsUp,
  ThumbsDown,
  TrendingDown,
  TrendingUp,
  Minus,
  Lightbulb,
  Info,
  Briefcase,
  Baby,
  Plane,
  Bell,
  Copy,
  ExternalLink,
  ArrowUpDown,
  Filter,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoredFlight } from "@/lib/flightScoring";
import { AIRLINES } from "@/lib/airportsData";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { formatPrice, formatPricePerTicket } from "@/lib/priceFormatter";
import { calculateTotalTripDuration, formatDuration } from "@/lib/flightDuration";

// Helper to parse duration (ISO 8601 string or number in minutes)
// Handles edge cases: "PT5H" (no minutes), "PT30M" (no hours), invalid formats
const parseDuration = (duration: string | number | undefined | null): number => {
  if (duration === null || duration === undefined) return 0;
  if (typeof duration === 'number') {
    return Math.max(0, Math.round(duration));
  }
  if (typeof duration !== 'string' || duration.trim() === '') return 0;
  
  try {
    // Handle ISO 8601 format: PT5H30M, PT5H, PT30M, etc.
    const hoursMatch = duration.match(/(\d+)H/);
    const minutesMatch = duration.match(/(\d+)M/);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    
    // Validate parsed values
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0) {
      logger.warn('Invalid duration format:', duration);
      return 0;
    }
    
    const totalMinutes = hours * 60 + minutes;
    return Math.max(0, totalMinutes);
  } catch (error) {
    logger.warn('Error parsing duration:', duration, error);
    return 0;
  }
};

interface FlightLegResultsProps {
  legId: string;
  legLabel: string;
  origin: string;
  destination: string;
  date: string;
  flights: ScoredFlight[];
  isLoading: boolean;
  error: string | null;
  selectedFlightId: string | null;
  onSelectFlight: (flight: ScoredFlight) => void;
  onConfirmSelection: () => void;
  onRetry: () => void;
  isAvoidedAirline: (code: string) => boolean;
  formatTime: (dateTime: string) => string;
  formatDate: (dateTime: string) => string;
  isLocked?: boolean;
  lockedMessage?: string;
  passengers?: number;
  isConfirmed?: boolean;
  canGoBack?: boolean;
  onGoBack?: () => void;
  nextLegLabel?: string;
  tripType?: "oneway" | "roundtrip" | "multicity";
  onContinueToGoogle?: () => void;
  onCopyChecklist?: () => void;
  preferNonstop?: boolean;
  onFilterChange?: (filters: FlightFilters) => void;
}

interface FlightFilters {
  minPrice?: number;
  maxPrice?: number;
  minDepartureHour?: number;
  maxDepartureHour?: number;
  minArrivalHour?: number;
  maxArrivalHour?: number;
}

// Get airline info from code
const getAirlineInfo = (code: string) => {
  return AIRLINES.find(a => code?.startsWith(a.code) || code === a.name);
};

// Extract amenities from flight extensions
const extractAmenities = (flight: ScoredFlight) => {
  const amenities = {
    hasWifi: false,
    hasSeatbackScreen: false,
    hasPower: false,
    hasUsbPorts: false,
    legroom: null as string | null,
    aircraft: null as string | null,
    meal: false,
  };

  for (const it of flight.itineraries) {
    for (const seg of it.segments) {
      const ext = (seg.extensions || []).map((e: string) => e?.toLowerCase() || '');
      
      if (ext.some(e => e.includes('wi-fi') || e.includes('wifi'))) amenities.hasWifi = true;
      if (ext.some(e => e.includes('personal device') || e.includes('seatback') || e.includes('on-demand') || e.includes('entertainment'))) amenities.hasSeatbackScreen = true;
      if (ext.some(e => e.includes('power outlet') || e.includes('in-seat power'))) amenities.hasPower = true;
      if (ext.some(e => e.includes('usb'))) amenities.hasUsbPorts = true;
      if (ext.some(e => e.includes('meal') || e.includes('food'))) amenities.meal = true;
      
      if (seg.legroom) amenities.legroom = seg.legroom;
      if (seg.airplane || seg.aircraft) amenities.aircraft = seg.airplane || seg.aircraft;
    }
  }

  return amenities;
};

// Detect if basic economy
const isBasicEconomy = (flight: ScoredFlight): boolean => {
  for (const it of flight.itineraries) {
    for (const seg of it.segments) {
      const ext = (seg.extensions || []).map((e: string) => e?.toLowerCase() || '');
      if (ext.some(e => e.includes('basic') || e.includes('main cabin') && e.includes('basic'))) {
        return true;
      }
    }
  }
  return false;
};

// Get fare inclusions estimate
const getFareInclusions = (flight: ScoredFlight, airlineCode: string) => {
  const isBasic = isBasicEconomy(flight);
  const isULCC = ['NK', 'F9', 'WN'].includes(airlineCode);
  const isPremium = flight.itineraries[0]?.segments[0]?.cabin === 'business' || flight.itineraries[0]?.segments[0]?.cabin === 'first';

  return {
    carryOn: isULCC ? 'fee' as const : true,
    checkedBag: isPremium ? true : 'fee' as const,
    seatSelection: isBasic || isULCC ? 'fee' as const : isPremium ? true : 'limited' as const,
    mealIncluded: isPremium,
    wifi: 'fee' as const,
    power: !isULCC,
    entertainment: !isULCC,
    changeable: isPremium ? true : 'fee' as const,
    refundable: isPremium,
  };
};

export const FlightLegResults = ({
  legId,
  legLabel,
  origin,
  destination,
  date,
  flights,
  isLoading,
  error,
  selectedFlightId,
  onSelectFlight,
  onConfirmSelection,
  onRetry,
  isAvoidedAirline,
  formatTime,
  formatDate,
  isLocked = false,
  lockedMessage,
  passengers = 1,
  isConfirmed = false,
  canGoBack = false,
  onGoBack,
  nextLegLabel,
  tripType,
  onContinueToGoogle,
  onCopyChecklist,
  preferNonstop = false,
  onFilterChange,
}: FlightLegResultsProps) => {
  const [isExpanded, setIsExpanded] = useState(!isLocked && !isConfirmed);
  const [showAll, setShowAll] = useState(false);
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);
  const [priceAlertFlight, setPriceAlertFlight] = useState<ScoredFlight | null>(null);
  const [sortBy, setSortBy] = useState<"best" | "price" | "duration" | "departure" | "arrival">("best");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FlightFilters>({});

  // Helper to calculate total duration for a flight
  const getFlightDuration = (flight: ScoredFlight): number => {
    return flight.itineraries.reduce(
      (sum, it) =>
        sum +
        it.segments.reduce((s, seg) => s + parseDuration(seg.duration), 0),
      0
    );
  };

  // Helper to get departure time for sorting
  const getDepartureTime = (flight: ScoredFlight): number => {
    const firstSeg = flight.itineraries[0]?.segments[0];
    if (!firstSeg?.departureTime) return Infinity;
    return new Date(firstSeg.departureTime).getTime();
  };

  // Helper to get arrival time for sorting
  const getArrivalTime = (flight: ScoredFlight): number => {
    const lastItinerary = flight.itineraries[flight.itineraries.length - 1];
    const lastSeg = lastItinerary?.segments[lastItinerary.segments.length - 1];
    if (!lastSeg?.arrivalTime) return Infinity;
    return new Date(lastSeg.arrivalTime).getTime();
  };

  // Apply filters first
  const filteredFlights = flights.filter((flight) => {
    // Price filter
    if (filters.minPrice !== undefined && flight.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && flight.price > filters.maxPrice) return false;

    // Departure time filter
    if (filters.minDepartureHour !== undefined || filters.maxDepartureHour !== undefined) {
      const firstSeg = flight.itineraries[0]?.segments[0];
      if (firstSeg?.departureTime) {
        const departureHour = new Date(firstSeg.departureTime).getHours();
        if (filters.minDepartureHour !== undefined && departureHour < filters.minDepartureHour) return false;
        if (filters.maxDepartureHour !== undefined && departureHour > filters.maxDepartureHour) return false;
      }
    }

    // Arrival time filter
    if (filters.minArrivalHour !== undefined || filters.maxArrivalHour !== undefined) {
      const lastItinerary = flight.itineraries[flight.itineraries.length - 1];
      const lastSeg = lastItinerary?.segments[lastItinerary.segments.length - 1];
      if (lastSeg?.arrivalTime) {
        const arrivalHour = new Date(lastSeg.arrivalTime).getHours();
        if (filters.minArrivalHour !== undefined && arrivalHour < filters.minArrivalHour) return false;
        if (filters.maxArrivalHour !== undefined && arrivalHour > filters.maxArrivalHour) return false;
      }
    }

    return true;
  });

  // Sort flights: prioritize nonstop when preferNonstop is true, and put avoided airlines at the bottom
  // Then apply user-selected sort option
  const sortedFlights = [...filteredFlights].sort((a, b) => {
    const aAirline = a.itineraries[0]?.segments[0]?.airline || "";
    const bAirline = b.itineraries[0]?.segments[0]?.airline || "";
    const aAvoided = isAvoidedAirline(aAirline) || a.isAvoidedAirline;
    const bAvoided = isAvoidedAirline(bAirline) || b.isAvoidedAirline;
    
    // First: Avoided airlines go to the bottom
    if (aAvoided && !bAvoided) return 1;
    if (!aAvoided && bAvoided) return -1;
    
    // Second: When preferNonstop is true, prioritize nonstop flights (similar to avoided airlines logic)
    if (preferNonstop) {
      const aIsNonstop = a.itineraries.every(it => it.segments.length === 1);
      const bIsNonstop = b.itineraries.every(it => it.segments.length === 1);
      
      // Nonstop flights come before layover flights
      if (aIsNonstop && !bIsNonstop) return -1;
      if (!aIsNonstop && bIsNonstop) return 1;
    }
    
    // Third: Apply user-selected sort option
    if (sortBy === "price") {
      return a.price - b.price; // Lowest price first
    } else if (sortBy === "duration") {
      const aDur = getFlightDuration(a);
      const bDur = getFlightDuration(b);
      return aDur - bDur; // Shortest duration first
    } else if (sortBy === "departure") {
      const aTime = getDepartureTime(a);
      const bTime = getDepartureTime(b);
      return aTime - bTime; // Earliest departure first
    } else if (sortBy === "arrival") {
      const aTime = getArrivalTime(a);
      const bTime = getArrivalTime(b);
      return aTime - bTime; // Earliest arrival first
    }
    
    // Default: sort by score (best match)
    return b.score - a.score;
  });
  
  const displayedFlights = showAll ? sortedFlights : sortedFlights.slice(0, 5);

  // Calculate price range for filters (use original flights, not filtered)
  const priceRange = useMemo(() => {
    if (flights.length === 0) return { min: 0, max: 1000 };
    const prices = flights.map(f => f.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [flights]);

  // Quick categories (use filtered flights for badges)
  const nonAvoidedFlights = useMemo(
    () =>
      filteredFlights.filter((f) => {
        const code = f.itineraries[0]?.segments[0]?.airline || "";
        return !(isAvoidedAirline(code) || f.isAvoidedAirline);
      }),
    [filteredFlights, isAvoidedAirline]
  );

  // Prefer to feature non-avoided flights in the top badges; fall back if all are avoided.
  const featuredFlights = nonAvoidedFlights.length > 0 ? nonAvoidedFlights : filteredFlights;

  const bestOverall = featuredFlights[0];
  const cheapest =
    featuredFlights.length > 0 ? [...featuredFlights].sort((a, b) => a.price - b.price)[0] : null;
  const fastest =
    featuredFlights.length > 0
      ? [...featuredFlights].sort((a, b) => {
          const aDur = a.itineraries.reduce(
            (sum, it) =>
              sum +
              it.segments.reduce((s, seg) => s + parseDuration(seg.duration), 0),
            0
          );
          const bDur = b.itineraries.reduce(
            (sum, it) =>
              sum +
              it.segments.reduce((s, seg) => s + parseDuration(seg.duration), 0),
            0
          );
          return aDur - bDur;
        })[0]
      : null;
  
  // Find most eco-friendly flight (lowest carbon emissions)
  const mostEcoFriendly = featuredFlights.length > 0
    ? [...featuredFlights]
        .filter(f => f.carbonEmissions && f.carbonEmissions > 0)
        .sort((a, b) => (a.carbonEmissions || Infinity) - (b.carbonEmissions || Infinity))[0]
    : null;
  
  // Calculate average carbon emissions for comparison
  const avgCarbonEmissions = useMemo(() => {
    const flightsWithEmissions = filteredFlights.filter(f => f.carbonEmissions && f.carbonEmissions > 0);
    if (flightsWithEmissions.length === 0) return null;
    const sum = flightsWithEmissions.reduce((acc, f) => acc + (f.carbonEmissions || 0), 0);
    return sum / flightsWithEmissions.length;
  }, [filteredFlights]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Loader2 className="h-4 w-4 animate-spin" />
            {legLabel}: {origin} → {destination}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4 text-destructive" />
            {legLabel}: {origin} → {destination}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry this leg
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (flights.length === 0) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {legLabel}: {origin} → {destination}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plane className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Flights Found
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              We couldn't find any flights for {origin} → {destination} on {formatDate(date)}.
            </p>
            <div className="space-y-2 text-xs text-muted-foreground mb-4">
              <p className="font-medium text-foreground">Try:</p>
              <ul className="list-disc list-inside space-y-1 text-left">
                <li>Checking nearby dates (±3 days)</li>
                <li>Using alternate airports</li>
                <li>Removing the "nonstop only" filter</li>
                <li>Adjusting your cabin class preference</li>
              </ul>
            </div>
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Locked state for sequential selection
  if (isLocked) {
    return (
      <Card className="opacity-60">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {legLabel}: {origin} → {destination}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {lockedMessage || "Select your outbound flight first to see return options"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find the selected flight details for confirmed state
  const selectedFlight = flights.find(f => f.id === selectedFlightId);
  const selectedFirstSeg = selectedFlight?.itineraries[0]?.segments[0];
  const selectedLastSeg = selectedFlight?.itineraries[0]?.segments[selectedFlight?.itineraries[0]?.segments.length - 1];
  const selectedStops = (selectedFlight?.itineraries[0]?.segments.length || 1) - 1;
  const selectedDuration = selectedFlight?.itineraries.reduce(
    (sum, it) => sum + it.segments.reduce((s, seg) => s + (typeof seg.duration === "number" ? seg.duration : 0), 0),
    0
  ) || 0;

  // Confirmed state - show summary with ability to change
  if (isConfirmed && selectedFlight) {
    return (
      <Card className="border-primary bg-primary/5">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {legLabel}: {origin} → {destination}
              <Badge variant="default" className="text-xs bg-primary">
                Confirmed
              </Badge>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between gap-4 p-3 bg-background rounded-lg border">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs font-medium">
                  {getAirlineInfo(selectedFirstSeg?.airline || "")?.name || selectedFirstSeg?.airline}
                </Badge>
                <span className="text-xs text-muted-foreground">{selectedFirstSeg?.flightNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="font-semibold">{formatTime(selectedFirstSeg?.departureTime || "")}</p>
                  <AirportTooltip code={selectedFirstSeg?.departureAirport || ""}>
                    <p className="text-xs text-muted-foreground cursor-help">{selectedFirstSeg?.departureAirport}</p>
                  </AirportTooltip>
                </div>
                <div className="flex-1 flex flex-col items-center px-2">
                  <span className="text-xs text-muted-foreground">
                    {Math.floor(selectedDuration / 60)}h {selectedDuration % 60}m
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className={cn(
                    "text-xs",
                    selectedStops === 0 ? "text-emerald-600 font-medium" : "text-muted-foreground"
                  )}>
                    {selectedStops === 0 ? "Nonstop" : `${selectedStops} stop${selectedStops > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{formatTime(selectedLastSeg?.arrivalTime || "")}</p>
                  <AirportTooltip code={selectedLastSeg?.arrivalAirport || ""}>
                    <p className="text-xs text-muted-foreground cursor-help">{selectedLastSeg?.arrivalAirport}</p>
                  </AirportTooltip>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">{formatPrice(selectedFlight.price)}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 gap-2" 
            onClick={() => {
              if (onGoBack) onGoBack();
            }}
          >
            <RefreshCw className="h-3 w-3" />
            Change {legLabel} Flight
          </Button>
          
          {/* One-way flight: Show checklist and Google Flights buttons directly */}
          {tripType === "oneway" && selectedFlight && (
            <div className="mt-4 space-y-3">
              {/* Match This Flight Checklist */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full text-xs gap-2">
                    <Info className="h-3 w-3" />
                    Match This Flight Checklist
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="p-3 bg-muted rounded-md text-xs space-y-2">
                    <p className="text-muted-foreground">
                      Use this checklist to find the exact same flights on Google Flights:
                    </p>
                    <div className="font-mono text-[10px] whitespace-pre-wrap bg-background p-2 rounded border max-h-40 overflow-auto">
                      {`${legLabel}:
• Airline: ${selectedFirstSeg?.airline || ""} ${selectedFirstSeg?.flightNumber || ""}
• Departs: ${formatTime(selectedFirstSeg?.departureTime || "")} from ${selectedFirstSeg?.departureAirport || ""}
• Arrives: ${formatTime(selectedLastSeg?.arrivalTime || "")} at ${selectedLastSeg?.arrivalAirport || destination}
• Stops: ${selectedStops === 0 ? "Nonstop" : `${selectedStops} stop${selectedStops > 1 ? "s" : ""}`}
• Duration: ${Math.floor(selectedDuration / 60)}h ${selectedDuration % 60}m
• Price: ${formatPrice(selectedFlight.price)}`}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => {
                        const checklist = `${legLabel}:
• Airline: ${selectedFirstSeg?.airline || ""} ${selectedFirstSeg?.flightNumber || ""}
• Departs: ${formatTime(selectedFirstSeg?.departureTime || "")} from ${selectedFirstSeg?.departureAirport || ""}
• Arrives: ${formatTime(selectedLastSeg?.arrivalTime || "")} at ${selectedLastSeg?.arrivalAirport || destination}
• Stops: ${selectedStops === 0 ? "Nonstop" : `${selectedStops} stop${selectedStops > 1 ? "s" : ""}`}
• Duration: ${Math.floor(selectedDuration / 60)}h ${selectedDuration % 60}m
• Price: ${formatPrice(selectedFlight.price)}`;
                        navigator.clipboard.writeText(checklist);
                        toast.success("Checklist copied to clipboard");
                        if (onCopyChecklist) onCopyChecklist();
                      }}
                    >
                      <Copy className="h-3 w-3" />
                      Copy Checklist
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Continue to Google Flights */}
              {onContinueToGoogle && (
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={onContinueToGoogle}
                >
                  Continue to Google Flights
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      selectedFlightId ? "border-primary" : "",
      isConfirmed && "border-primary bg-primary/5"
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 cursor-pointer hover:bg-muted/50">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                {selectedFlightId ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <PlaneTakeoff className="h-4 w-4" />
                )}
                {legLabel}: {origin} → {destination}
                <Badge variant="secondary" className="text-xs">
                  {flights.length} options
                </Badge>
              </span>
              <div className="flex items-center gap-2">
                {selectedFlightId && !isConfirmed && (
                  <Badge variant="outline" className="text-xs border-primary text-primary">
                    Click to confirm
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Confirm selection button - sticky at top when flight is selected */}
            {selectedFlightId && !isConfirmed && (
              <div className="sticky top-0 z-10 bg-background border-b pb-3 -mx-6 px-6 pt-3">
                <div className="flex items-center justify-between gap-3 p-3 bg-primary/10 rounded-lg border border-primary/30">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Flight selected</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmSelection();
                    }}
                  >
                    Confirm {legLabel}
                    {nextLegLabel && (
                      <>
                        <ArrowRight className="h-3 w-3" />
                        <span className="text-xs opacity-80">Next: {nextLegLabel}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Quick category badges */}
            <div className="flex flex-wrap gap-2">
              {bestOverall && (
                <Badge variant="outline" className="text-xs gap-1 bg-primary/10 text-primary border-primary/30">
                  <Star className="h-3 w-3" /> Best Match: {formatPrice(bestOverall.price)}
                </Badge>
              )}
              {cheapest && cheapest.id !== bestOverall?.id && (
                <Badge variant="outline" className="text-xs gap-1 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <DollarSign className="h-3 w-3" /> Cheapest: {formatPrice(cheapest.price)}
                </Badge>
              )}
              {fastest && fastest.id !== bestOverall?.id && (
                <Badge variant="outline" className="text-xs gap-1 bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400">
                  <Zap className="h-3 w-3" /> Fastest
                </Badge>
              )}
            </div>

            {/* Sort and Filter controls */}
            <div className="flex items-center justify-between gap-3 mb-2">
              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best">Best Match</SelectItem>
                    <SelectItem value="price">Price (Lowest)</SelectItem>
                    <SelectItem value="duration">Duration (Fastest)</SelectItem>
                    <SelectItem value="departure">Departure (Earliest)</SelectItem>
                    <SelectItem value="arrival">Arrival (Earliest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(filters.minPrice !== undefined || filters.maxPrice !== undefined || 
                  filters.minDepartureHour !== undefined || filters.maxDepartureHour !== undefined ||
                  filters.minArrivalHour !== undefined || filters.maxArrivalHour !== undefined) && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                    Active
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <Card className="mb-4 border-primary/20 bg-muted/30">
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Filter Results</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilters({});
                        onFilterChange?.({});
                      }}
                      className="h-7 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs">Price Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">Min Price</Label>
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.minPrice || ""}
                          onChange={(e) => {
                            const newFilters = { ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined };
                            setFilters(newFilters);
                            onFilterChange?.(newFilters);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">Max Price</Label>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.maxPrice || ""}
                          onChange={(e) => {
                            const newFilters = { ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined };
                            setFilters(newFilters);
                            onFilterChange?.(newFilters);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Range: {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
                    </p>
                  </div>

                  {/* Departure Time Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs">Departure Time</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">From (24h)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          max="23"
                          value={filters.minDepartureHour !== undefined ? filters.minDepartureHour : ""}
                          onChange={(e) => {
                            const newFilters = { ...filters, minDepartureHour: e.target.value ? Number(e.target.value) : undefined };
                            setFilters(newFilters);
                            onFilterChange?.(newFilters);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">To (24h)</Label>
                        <Input
                          type="number"
                          placeholder="23"
                          min="0"
                          max="23"
                          value={filters.maxDepartureHour !== undefined ? filters.maxDepartureHour : ""}
                          onChange={(e) => {
                            const newFilters = { ...filters, maxDepartureHour: e.target.value ? Number(e.target.value) : undefined };
                            setFilters(newFilters);
                            onFilterChange?.(newFilters);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Arrival Time Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs">Arrival Time</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">From (24h)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          max="23"
                          value={filters.minArrivalHour !== undefined ? filters.minArrivalHour : ""}
                          onChange={(e) => {
                            const newFilters = { ...filters, minArrivalHour: e.target.value ? Number(e.target.value) : undefined };
                            setFilters(newFilters);
                            onFilterChange?.(newFilters);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">To (24h)</Label>
                        <Input
                          type="number"
                          placeholder="23"
                          min="0"
                          max="23"
                          value={filters.maxArrivalHour !== undefined ? filters.maxArrivalHour : ""}
                          onChange={(e) => {
                            const newFilters = { ...filters, maxArrivalHour: e.target.value ? Number(e.target.value) : undefined };
                            setFilters(newFilters);
                            onFilterChange?.(newFilters);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Showing {filteredFlights.length} of {flights.length} flights
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Flight options */}
            {displayedFlights.map((flight, idx) => {
              const firstSeg = flight.itineraries[0]?.segments[0];
              const lastSeg =
                flight.itineraries[0]?.segments[flight.itineraries[0]?.segments.length - 1];
              const stops = (flight.itineraries[0]?.segments.length || 1) - 1;
              
              // Calculate total trip duration (includes layovers)
              // This gives the true door-to-door time
              const duration = calculateTotalTripDuration(flight);
              
              const isSelected = flight.id === selectedFlightId;
              const flightAirline = firstSeg?.airline || "";
              const isAvoided = isAvoidedAirline(flightAirline);
              const airlineInfo = getAirlineInfo(flightAirline);
              const amenities = extractAmenities(flight);
              const isFlightExpanded = expandedFlightId === flight.id;
              const isBasic = isBasicEconomy(flight);

              // Calculate layover info for ALL connections (not just first)
              // This handles multi-layover flights correctly
              const layovers: Array<{ minutes: number; airport: string; overnight: boolean }> = [];
              let totalLayoverMinutes = 0;
              let hasTerminalChange = false;
              
              if (stops > 0 && flight.itineraries[0]?.segments.length > 1) {
                const segments = flight.itineraries[0].segments;
                for (let i = 0; i < segments.length - 1; i++) {
                  const seg1 = segments[i];
                  const seg2 = segments[i + 1];
                  
                  if (seg1?.arrivalTime && seg2?.departureTime) {
                    try {
                      const arrival = new Date(seg1.arrivalTime);
                      const departure = new Date(seg2.departureTime);
                      
                      // Validate dates
                      if (isNaN(arrival.getTime()) || isNaN(departure.getTime())) {
                        logger.warn('Invalid date in flight segment:', { seg1: seg1.arrivalTime, seg2: seg2.departureTime });
                        continue;
                      }
                      
                      const layoverMs = departure.getTime() - arrival.getTime();
                      const layoverMins = Math.round(layoverMs / (1000 * 60));
                      
                      // Handle negative layovers (timezone issues or data errors)
                      if (layoverMins < 0) {
                        logger.warn('Negative layover detected, possible timezone issue:', {
                          arrival: seg1.arrivalTime,
                          departure: seg2.departureTime,
                          minutes: layoverMins
                        });
                        // For negative layovers, assume minimum connection time
                        layovers.push({
                          minutes: 60, // Assume 1 hour minimum
                          airport: seg1.arrivalAirport || 'Unknown',
                          overnight: false
                        });
                        totalLayoverMinutes += 60;
                      } else {
                        // Check for overnight layover (more than 12 hours)
                        const overnight = layoverMins > 12 * 60;
                        layovers.push({
                          minutes: layoverMins,
                          airport: seg1.arrivalAirport || 'Unknown',
                          overnight
                        });
                        totalLayoverMinutes += layoverMins;
                      }
                    } catch (error) {
                      logger.error('Error calculating layover:', error);
                      // Continue with next layover
                    }
                  }
                }
              }
              
              // Use first layover for connection risk indicator (backward compatibility)
              const layoverMinutes = layovers.length > 0 ? layovers[0].minutes : 0;

              const positiveMatches = flight.preferenceMatches.filter(m => m.type === 'positive');
              const negativeMatches = flight.preferenceMatches.filter(m => m.type === 'negative');

              return (
                <div
                  key={flight.id}
                  className={cn(
                    "rounded-lg border transition-all",
                    isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20",
                    (isAvoided || flight.isAvoidedAirline) && !isSelected && "border-muted bg-muted/30 opacity-60",
                    !isSelected && !isAvoided && !flight.isAvoidedAirline && "hover:border-primary/50"
                  )}
                >
                  {/* Avoided warning with penalty indicator - subtle styling since card is greyed */}
                  {(isAvoided || flight.isAvoidedAirline) && (
                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/50 border-b border-muted">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="font-medium">Avoided airline</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] gap-1 bg-muted text-muted-foreground">
                        <TrendingDown className="h-2.5 w-2.5" />
                        -{flight.scorePenalty || 50} pts
                      </Badge>
                    </div>
                  )}
                  
                  {/* Preferred airline boost indicator */}
                  {flight.isPreferredAirline && !isAvoided && !flight.isAvoidedAirline && (
                    <div className="flex items-center justify-between gap-2 px-3 pt-2 bg-emerald-100/50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="font-medium">Your preferred airline</span>
                      </div>
                      <Badge className="text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-600">
                        <TrendingUp className="h-2.5 w-2.5" />
                        +{flight.scoreBoost || 20} pts boost
                      </Badge>
                    </div>
                  )}

                  <div 
                    className="p-3 cursor-pointer"
                    onClick={() => onSelectFlight(flight)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Airline and badges row */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs font-medium">
                              {airlineInfo?.name || flightAirline}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {firstSeg?.flightNumber}
                            </span>
                          </div>
                          
                          {/* Ranking badges */}
                          {idx === 0 && !isAvoided && (
                            <Badge className="text-[10px] bg-primary gap-1">
                              <Star className="h-2.5 w-2.5" /> Best Match
                            </Badge>
                          )}
                          {flight.id === cheapest?.id && idx !== 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <DollarSign className="h-2.5 w-2.5" /> Cheapest
                            </Badge>
                          )}
                          {flight.id === fastest?.id && idx !== 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Zap className="h-2.5 w-2.5" /> Fastest
                            </Badge>
                          )}
                          {flight.id === mostEcoFriendly?.id && flight.carbonEmissions && idx !== 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-1 bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400">
                              <Leaf className="h-2.5 w-2.5" /> Lowest CO₂
                            </Badge>
                          )}
                          {isBasic && (
                            <Badge variant="outline" className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Basic Economy
                            </Badge>
                          )}
                        </div>

                        {/* Times and route */}
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-lg font-semibold">{formatTime(firstSeg?.departureTime || "")}</p>
                            <AirportTooltip code={firstSeg?.departureAirport || ""}>
                              <p className="text-xs text-muted-foreground cursor-help">{firstSeg?.departureAirport}</p>
                            </AirportTooltip>
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center px-2">
                            <span className="text-xs text-muted-foreground">
                              {Math.floor(duration / 60)}h {duration % 60}m
                            </span>
                            <div className="w-full h-px bg-border relative my-1">
                              {stops > 0 && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1">
                                  {Array.from({ length: stops }).map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className={cn(
                              "text-xs",
                              stops === 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"
                            )}>
                              {stops === 0 ? "Nonstop" : `${stops} stop${stops > 1 ? 's' : ''}`}
                            </span>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-lg font-semibold">{formatTime(lastSeg?.arrivalTime || "")}</p>
                            <AirportTooltip code={lastSeg?.arrivalAirport || ""}>
                              <p className="text-xs text-muted-foreground cursor-help">{lastSeg?.arrivalAirport}</p>
                            </AirportTooltip>
                          </div>
                        </div>

                        {/* Connection risk for stops - show worst layover */}
                        {stops > 0 && layovers.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {/* Show risk indicator for shortest layover (most risky) */}
                            {layovers.length > 0 && (
                              <ConnectionRiskIndicator 
                                layoverMinutes={Math.min(...layovers.map(l => l.minutes))}
                                hasTerminalChange={hasTerminalChange}
                                className="text-[10px]"
                              />
                            )}
                            {/* Show all layovers if multiple */}
                            {layovers.length > 1 && (
                              <div className="text-[10px] text-muted-foreground mt-1">
                                {layovers.map((layover, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span>
                                      <AirportTooltip code={layover.airport}>
                                        <span className="cursor-help">{layover.airport}</span>
                                      </AirportTooltip>: {Math.floor(layover.minutes / 60)}h {layover.minutes % 60}m
                                      {layover.overnight && ' (overnight)'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Amenities quick view */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {amenities.hasWifi && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                  <Wifi className="h-3 w-3" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>WiFi available</TooltipContent>
                            </Tooltip>
                          )}
                          {amenities.hasSeatbackScreen && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                  <Tv className="h-3 w-3" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Seatback entertainment</TooltipContent>
                            </Tooltip>
                          )}
                          {(amenities.hasPower || amenities.hasUsbPorts) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                  <Power className="h-3 w-3" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Power outlets / USB</TooltipContent>
                            </Tooltip>
                          )}
                          {amenities.legroom && (
                            <span className="text-[10px] text-muted-foreground">
                              {amenities.legroom} legroom
                            </span>
                          )}
                          {amenities.aircraft && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Plane className="h-2.5 w-2.5" />
                                  {amenities.aircraft}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Aircraft type</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* Price and score */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-primary">{formatPrice(flight.price)}</p>
                        {flight.pricePerTicket && flight.passengers && flight.passengers > 1 && (
                          <p className="text-[10px] text-muted-foreground">
                            {formatPricePerTicket(flight.price, flight.passengers)}
                          </p>
                        )}
                        
                        {/* Score indicator */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">Score:</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] px-1.5",
                              flight.score >= 80 && "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
                              flight.score >= 60 && flight.score < 80 && "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
                              flight.score < 60 && "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400"
                            )}
                          >
                            {flight.score}
                          </Badge>
                        </div>

                        {/* Price insight */}
                        {flight.priceInsight && (
                          <div className={cn(
                            "flex items-center justify-end gap-1 mt-1 text-[10px]",
                            flight.priceInsight.level === 'low' && "text-emerald-600",
                            flight.priceInsight.level === 'medium' && "text-amber-600",
                            flight.priceInsight.level === 'high' && "text-red-600"
                          )}>
                            {flight.priceInsight.level === 'low' && <TrendingDown className="h-3 w-3" />}
                            {flight.priceInsight.level === 'medium' && <Minus className="h-3 w-3" />}
                            {flight.priceInsight.level === 'high' && <TrendingUp className="h-3 w-3" />}
                            {flight.priceInsight.label}
                          </div>
                        )}

                        {/* Carbon emissions */}
                        {flight.carbonEmissions && flight.carbonEmissions > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "flex items-center justify-end gap-1 mt-1 text-[10px]",
                                avgCarbonEmissions && flight.carbonEmissions < avgCarbonEmissions * 0.9
                                  ? "text-green-600 dark:text-green-400"
                                  : avgCarbonEmissions && flight.carbonEmissions > avgCarbonEmissions * 1.1
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                              )}>
                                <Leaf className="h-3 w-3" />
                                {Math.round(flight.carbonEmissions)} kg CO₂
                                {avgCarbonEmissions && (
                                  <span className="text-[9px]">
                                    {flight.carbonEmissions < avgCarbonEmissions * 0.9 && " (below avg)"}
                                    {flight.carbonEmissions > avgCarbonEmissions * 1.1 && " (above avg)"}
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-medium">Carbon Emissions: {Math.round(flight.carbonEmissions)} kg CO₂</p>
                                {avgCarbonEmissions && (
                                  <p className="text-xs text-muted-foreground">
                                    Average: {Math.round(avgCarbonEmissions)} kg CO₂
                                    {flight.carbonEmissions < avgCarbonEmissions && (
                                      <span className="text-green-600"> ({Math.round(((avgCarbonEmissions - flight.carbonEmissions) / avgCarbonEmissions) * 100)}% lower)</span>
                                    )}
                                    {flight.carbonEmissions > avgCarbonEmissions && (
                                      <span className="text-amber-600"> ({Math.round(((flight.carbonEmissions - avgCarbonEmissions) / avgCarbonEmissions) * 100)}% higher)</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {isSelected && (
                          <Badge variant="default" className="mt-2 text-[10px]">
                            <Check className="h-3 w-3 mr-1" /> Selected
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Explanation */}
                    {flight.explanation && (
                      <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded px-2 py-1">
                        {flight.explanation}
                      </p>
                    )}

                    {/* Preference matches - quick view */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {positiveMatches.slice(0, 3).map((match, i) => (
                        <Tooltip key={`pos-${i}`}>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-[10px] gap-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400">
                              <ThumbsUp className="h-2.5 w-2.5" />
                              {match.label}
                            </Badge>
                          </TooltipTrigger>
                          {match.detail && <TooltipContent>{match.detail}</TooltipContent>}
                        </Tooltip>
                      ))}
                      {negativeMatches.slice(0, 2).map((match, i) => (
                        <Tooltip key={`neg-${i}`}>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-[10px] gap-0.5 bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400">
                              <ThumbsDown className="h-2.5 w-2.5" />
                              {match.label}
                            </Badge>
                          </TooltipTrigger>
                          {match.detail && <TooltipContent>{match.detail}</TooltipContent>}
                        </Tooltip>
                      ))}
                      {(positiveMatches.length > 3 || negativeMatches.length > 2) && (
                        <Badge 
                          variant="outline" 
                          className="text-[10px] cursor-pointer hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedFlightId(isFlightExpanded ? null : flight.id);
                          }}
                        >
                          +{positiveMatches.length - 3 + negativeMatches.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  <Collapsible open={isFlightExpanded}>
                    <CollapsibleTrigger asChild>
                      <button 
                        className="w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 border-t hover:bg-muted/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedFlightId(isFlightExpanded ? null : flight.id);
                        }}
                      >
                        <Info className="h-3 w-3" />
                        {isFlightExpanded ? "Hide details" : "Show full analysis & what's included"}
                        {isFlightExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-3 pb-3 space-y-3 border-t bg-muted/30">
                        {/* Match explanation */}
                        {flight.matchExplanation && (
                          <div className="pt-3 space-y-2">
                            {flight.matchExplanation.whyNotPerfect.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                  <AlertTriangle className="h-3 w-3" /> Why it's not perfect
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-0.5 ml-4">
                                  {flight.matchExplanation.whyNotPerfect.map((reason, i) => (
                                    <li key={i}>• {reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {flight.matchExplanation.whyBestChoice.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mb-1">
                                  <Lightbulb className="h-3 w-3" /> Why it's still a good choice
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-0.5 ml-4">
                                  {flight.matchExplanation.whyBestChoice.map((reason, i) => (
                                    <li key={i}>• {reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* All preference matches */}
                        <div className="pt-2">
                          <p className="text-xs font-medium mb-2">All preference matches</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] text-emerald-600 font-medium mb-1 flex items-center gap-1">
                                <ThumbsUp className="h-2.5 w-2.5" /> Matches your preferences
                              </p>
                              {positiveMatches.length > 0 ? (
                                <ul className="text-xs text-muted-foreground space-y-0.5">
                                  {positiveMatches.map((m, i) => (
                                    <li key={i} className="flex items-start gap-1">
                                      <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                      <span>{m.label}{m.detail ? `: ${m.detail}` : ''}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-muted-foreground">None</p>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] text-red-600 font-medium mb-1 flex items-center gap-1">
                                <ThumbsDown className="h-2.5 w-2.5" /> Doesn't match
                              </p>
                              {negativeMatches.length > 0 ? (
                                <ul className="text-xs text-muted-foreground space-y-0.5">
                                  {negativeMatches.map((m, i) => (
                                    <li key={i} className="flex items-start gap-1">
                                      <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                                      <span>{m.label}{m.detail ? `: ${m.detail}` : ''}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-muted-foreground">None</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Hidden costs */}
                        {flight.hiddenCosts.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs font-medium mb-1 flex items-center gap-1 text-amber-600">
                              <Briefcase className="h-3 w-3" /> Potential additional costs
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {flight.hiddenCosts.map((cost, i) => (
                                <li key={i}>
                                  • {cost.description}
                                  {cost.estimatedCost > 0 && (
                                    <span className="text-amber-600 ml-1">~${cost.estimatedCost}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Delay risk */}
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium mb-1">Delay risk assessment</p>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              flight.delayRisk === 'low' && "bg-emerald-50 text-emerald-700 border-emerald-300",
                              flight.delayRisk === 'medium' && "bg-amber-50 text-amber-700 border-amber-300",
                              flight.delayRisk === 'high' && "bg-red-50 text-red-700 border-red-300"
                            )}
                          >
                            {flight.delayRisk === 'low' && '✓ Low risk'}
                            {flight.delayRisk === 'medium' && '⚠ Medium risk'}
                            {flight.delayRisk === 'high' && '⚠ High risk'}
                          </Badge>
                        </div>

                        {/* Family stress score */}
                        {flight.familyStressScore !== undefined && (
                          <div className="pt-2 border-t">
                            <p className="text-xs font-medium mb-1 flex items-center gap-1">
                              <Baby className="h-3 w-3" /> Family friendliness
                            </p>
                            <Badge 
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                flight.familyStressScore < 30 && "bg-emerald-50 text-emerald-700 border-emerald-300",
                                flight.familyStressScore >= 30 && flight.familyStressScore < 60 && "bg-amber-50 text-amber-700 border-amber-300",
                                flight.familyStressScore >= 60 && "bg-red-50 text-red-700 border-red-300"
                              )}
                            >
                              {flight.familyStressScore < 30 && '✓ Great for families'}
                              {flight.familyStressScore >= 30 && flight.familyStressScore < 60 && '⚠ Manageable with kids'}
                              {flight.familyStressScore >= 60 && '⚠ May be stressful with kids'}
                            </Badge>
                          </div>
                        )}

                        {/* Price insight advice */}
                        {flight.priceInsight && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-medium flex items-center gap-1">
                                <Lightbulb className="h-3 w-3" /> Price insight
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPriceAlertFlight(flight);
                                }}
                              >
                                <Bell className="h-3 w-3" />
                                Set Price Alert
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{flight.priceInsight.advice}</p>
                          </div>
                        )}

                        {/* Transparency panel */}
                        <div className="pt-2 border-t">
                          <FlightTransparencyPanel
                            cabinClass={firstSeg?.cabin || 'economy'}
                            isBasicEconomy={isBasic}
                            fareFamily={isBasic ? 'Basic Economy' : undefined}
                            inclusions={getFareInclusions(flight, flightAirline)}
                            restrictions={isBasic ? [
                              'Last to board - overhead bin space not guaranteed',
                              'No changes or refunds',
                              'Seat assigned at check-in',
                            ] : []}
                            estimatedBagFees={
                              ['NK', 'F9'].includes(flightAirline) 
                                ? { carryOn: 45, firstBag: 35, secondBag: 45 }
                                : { firstBag: 35, secondBag: 45 }
                            }
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}

            {/* Show more button */}
            {flights.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAll(!showAll);
                }}
              >
                {showAll ? "Show less" : `Show ${flights.length - 5} more options`}
                {showAll ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Price Alert Dialog */}
      {priceAlertFlight && (
        <PriceAlertDialog
          open={!!priceAlertFlight}
          onOpenChange={(open) => !open && setPriceAlertFlight(null)}
          origin={origin}
          destination={destination}
          departureDate={date}
          currentPrice={priceAlertFlight.price}
          passengers={passengers}
        />
      )}
    </Card>
  );
};
