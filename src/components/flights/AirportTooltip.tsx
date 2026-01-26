/**
 * Airport tooltip component - shows airport details on hover
 */

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { searchAirports, type Airport } from "@/lib/airportsData";
import { MapPin, Baby } from "lucide-react";

interface AirportTooltipProps {
  code: string;
  children: React.ReactNode;
  className?: string;
}

export const AirportTooltip = ({ code, children, className }: AirportTooltipProps) => {
  // Find airport info
  const airport = searchAirports(code).find(a => a.code === code.toUpperCase());
  
  if (!airport) {
    // If airport not found, just render children without tooltip
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild className={className}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">{airport.code}</p>
              <p className="text-xs text-muted-foreground">{airport.name}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {airport.city}, {airport.country === "US" ? "United States" : airport.country}
          </p>
          {airport.hasPlayground && (
            <div className="flex items-center gap-1.5 pt-1 mt-1 border-t border-border">
              <Baby className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs text-primary font-medium">Has playground - great for layovers!</p>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
