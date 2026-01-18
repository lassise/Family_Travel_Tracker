import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  ChevronDown, 
  Check, 
  X, 
  Briefcase, 
  ShoppingBag,
  Armchair,
  Utensils,
  Wifi,
  Power,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface FlightTransparencyProps {
  cabinClass: string;
  isBasicEconomy?: boolean;
  fareFamily?: string;
  inclusions: {
    carryOn: boolean | 'fee';
    checkedBag: boolean | 'fee';
    seatSelection: boolean | 'fee' | 'limited';
    mealIncluded: boolean;
    wifi: boolean | 'fee';
    power: boolean;
    entertainment: boolean;
    changeable: boolean | 'fee';
    refundable: boolean;
  };
  restrictions?: string[];
  estimatedBagFees?: {
    firstBag?: number;
    secondBag?: number;
    carryOn?: number;
  };
}

const FlightTransparencyPanel = ({
  cabinClass,
  isBasicEconomy = false,
  fareFamily,
  inclusions,
  restrictions = [],
  estimatedBagFees,
}: FlightTransparencyProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const renderInclusionIcon = (value: boolean | 'fee' | 'limited') => {
    if (value === true) {
      return <Check className="h-4 w-4 text-emerald-500" />;
    }
    if (value === 'fee') {
      return <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">$</span>;
    }
    if (value === 'limited') {
      return <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Limited</span>;
    }
    return <X className="h-4 w-4 text-red-400" />;
  };

  const inclusionItems = [
    { key: 'carryOn', label: 'Carry-on bag', icon: ShoppingBag, value: inclusions.carryOn },
    { key: 'checkedBag', label: 'Checked bag', icon: Briefcase, value: inclusions.checkedBag },
    { key: 'seatSelection', label: 'Seat selection', icon: Armchair, value: inclusions.seatSelection },
    { key: 'mealIncluded', label: 'Meal/snacks', icon: Utensils, value: inclusions.mealIncluded },
    { key: 'wifi', label: 'Wi-Fi', icon: Wifi, value: inclusions.wifi },
    { key: 'power', label: 'Power outlet', icon: Power, value: inclusions.power },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            <span>What's included</span>
            {isBasicEconomy && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px] px-1.5 py-0">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                Basic Economy
              </Badge>
            )}
          </div>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <Card className="mt-2 border-dashed">
          <CardContent className="p-3 space-y-3">
            {/* Fare type */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fare type</span>
              <span className="font-medium capitalize">{fareFamily || cabinClass}</span>
            </div>
            
            {/* Inclusions grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {inclusionItems.map(item => (
                <div key={item.key} className="flex items-center gap-2 text-xs">
                  {renderInclusionIcon(item.value)}
                  <span className={cn(
                    item.value === false && 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Change/Refund policies */}
            <div className="flex flex-wrap gap-3 pt-2 border-t text-xs">
              <div className="flex items-center gap-1">
                {renderInclusionIcon(inclusions.changeable)}
                <span>Changes</span>
              </div>
              <div className="flex items-center gap-1">
                {renderInclusionIcon(inclusions.refundable)}
                <span>Refunds</span>
              </div>
            </div>
            
            {/* Bag fees estimate */}
            {estimatedBagFees && (Object.keys(estimatedBagFees).length > 0) && (
              <div className="pt-2 border-t space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Estimated bag fees (verify at booking)</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {estimatedBagFees.carryOn !== undefined && estimatedBagFees.carryOn > 0 && (
                    <span>Carry-on: ${estimatedBagFees.carryOn}</span>
                  )}
                  {estimatedBagFees.firstBag !== undefined && (
                    <span>1st checked: ${estimatedBagFees.firstBag}</span>
                  )}
                  {estimatedBagFees.secondBag !== undefined && (
                    <span>2nd checked: ${estimatedBagFees.secondBag}</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Basic Economy restrictions */}
            {isBasicEconomy && restrictions.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Basic Economy Restrictions</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {restrictions.map((r, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Disclaimer */}
            <p className="text-[10px] text-muted-foreground pt-2 border-t">
              Final price and inclusions confirmed at booking. Baggage policies vary by airline and route.
            </p>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

export { FlightTransparencyPanel };
export type { FlightTransparencyProps };