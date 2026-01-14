import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usStateFlagUrls, getStateAbbreviation } from '@/lib/stateFlagsData';

interface StateGridSelectorProps {
  states: Record<string, string>;
  selectedStates: Set<string>;
  onStateToggle: (stateCode: string) => void;
  countryCode: string;
}

const StateCard = memo(({ 
  code, 
  name, 
  isSelected, 
  onToggle,
  flagUrl 
}: { 
  code: string; 
  name: string; 
  isSelected: boolean; 
  onToggle: () => void;
  flagUrl: string | null;
}) => {
  const abbreviation = getStateAbbreviation(code);
  
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative group aspect-[4/3] rounded-lg overflow-hidden transition-all duration-200",
        "border-2 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isSelected 
          ? "border-emerald-500 shadow-md shadow-emerald-500/20" 
          : "border-border/50 hover:border-primary/50"
      )}
    >
      {/* Flag Background */}
      {flagUrl ? (
        <img 
          src={flagUrl} 
          alt={`${name} flag`}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-all duration-200",
            isSelected ? "opacity-100" : "opacity-60 group-hover:opacity-80"
          )}
          loading="lazy"
        />
      ) : (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-muted to-muted/50",
          isSelected && "from-emerald-100 to-emerald-50"
        )} />
      )}
      
      {/* Overlay gradient for text readability */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t transition-opacity duration-200",
        isSelected 
          ? "from-emerald-900/70 via-emerald-900/30 to-transparent" 
          : "from-black/60 via-black/20 to-transparent group-hover:from-black/70"
      )} />
      
      {/* State Abbreviation */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(
          "text-lg md:text-xl font-bold tracking-wide drop-shadow-lg transition-colors",
          isSelected ? "text-white" : "text-white/90"
        )}>
          {abbreviation}
        </span>
      </div>
      
      {/* Selection Indicator */}
      <div className={cn(
        "absolute top-1.5 right-1.5 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all duration-200",
        isSelected 
          ? "bg-emerald-500 scale-100" 
          : "bg-white/20 backdrop-blur-sm scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100"
      )}>
        <Check className={cn(
          "w-3 h-3 md:w-4 md:h-4 transition-all duration-200",
          isSelected ? "text-white" : "text-white/70"
        )} />
      </div>
      
      {/* State Name Tooltip on Hover */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[10px] md:text-xs text-center",
        "text-white font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity",
        "bg-black/50 backdrop-blur-sm"
      )}>
        {name}
      </div>
      
      {/* Visited Badge */}
      {isSelected && (
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-emerald-500 rounded text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider">
          ✓
        </div>
      )}
    </button>
  );
});

StateCard.displayName = 'StateCard';

const StateGridSelector = ({ states, selectedStates, onStateToggle, countryCode }: StateGridSelectorProps) => {
  const stateEntries = Object.entries(states);
  const isUSA = countryCode === 'US';
  
  // Get flag URLs (only for USA currently)
  const getFlagUrl = (code: string): string | null => {
    if (isUSA) {
      return usStateFlagUrls[code] || null;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-9 gap-2 md:gap-3">
      {stateEntries.map(([code, name]) => (
        <StateCard
          key={code}
          code={code}
          name={name}
          isSelected={selectedStates.has(code)}
          onToggle={() => onStateToggle(code)}
          flagUrl={getFlagUrl(code)}
        />
      ))}
    </div>
  );
};

export default memo(StateGridSelector);
