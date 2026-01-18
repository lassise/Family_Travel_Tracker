import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, ChevronRight, Sparkles, Crown, Armchair } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CabinOption {
  cabin: 'economy' | 'premium_economy' | 'business' | 'first';
  lowestPrice: number;
  avgDuration: string;
  stops: string;
  features: {
    legroom: string;
    seatWidth: string;
    recline: string;
    meal: boolean | 'snack' | 'full' | 'multi-course';
    lounge: boolean;
    priority: boolean;
    baggage: string;
  };
  available: boolean;
  flightCount: number;
}

interface CabinComparisonProps {
  options: CabinOption[];
  onSelectCabin: (cabin: string) => void;
  selectedCabin?: string;
}

const cabinLabels: Record<string, { label: string; icon: typeof Armchair }> = {
  economy: { label: 'Economy', icon: Armchair },
  premium_economy: { label: 'Premium Economy', icon: Sparkles },
  business: { label: 'Business', icon: Crown },
  first: { label: 'First Class', icon: Crown },
};

const CabinComparison = ({ options, onSelectCabin, selectedCabin }: CabinComparisonProps) => {
  const formatMeal = (meal: boolean | 'snack' | 'full' | 'multi-course') => {
    if (meal === false) return 'Purchase only';
    if (meal === true || meal === 'snack') return 'Snacks included';
    if (meal === 'full') return 'Full meal included';
    if (meal === 'multi-course') return 'Multi-course dining';
    return 'Not specified';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          Compare Cabins
          <Badge variant="secondary" className="text-xs font-normal">
            {options.filter(o => o.available).length} available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {options.map(option => {
            const config = cabinLabels[option.cabin];
            const Icon = config.icon;
            const isSelected = selectedCabin === option.cabin;
            
            return (
              <Card 
                key={option.cabin}
                className={cn(
                  'relative overflow-hidden transition-all cursor-pointer',
                  !option.available && 'opacity-50 cursor-not-allowed',
                  isSelected && 'ring-2 ring-primary',
                  option.available && !isSelected && 'hover:border-primary/50'
                )}
                onClick={() => option.available && onSelectCabin(option.cabin)}
              >
                {/* Cabin tier indicator */}
                {(option.cabin === 'business' || option.cabin === 'first') && (
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-400 to-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl">
                    PREMIUM
                  </div>
                )}
                
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{config.label}</span>
                  </div>
                  
                  {/* Price */}
                  <div>
                    <p className="text-2xl font-bold">
                      ${option.lowestPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      from • {option.flightCount} flights
                    </p>
                  </div>
                  
                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{option.stops}</Badge>
                    <Badge variant="outline">{option.avgDuration}</Badge>
                  </div>
                  
                  {/* Features */}
                  <div className="space-y-1.5 text-xs pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Legroom</span>
                      <span className="font-medium">{option.features.legroom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recline</span>
                      <span className="font-medium">{option.features.recline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Meal</span>
                      <span className="font-medium">{formatMeal(option.features.meal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Baggage</span>
                      <span className="font-medium">{option.features.baggage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lounge access</span>
                      {option.features.lounge ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {/* CTA */}
                  {option.available ? (
                    <Button 
                      variant={isSelected ? "default" : "outline"} 
                      size="sm" 
                      className="w-full mt-2"
                    >
                      {isSelected ? 'Selected' : 'View flights'}
                      {!isSelected && <ChevronRight className="h-4 w-4 ml-1" />}
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="w-full mt-2" disabled>
                      Not available
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export { CabinComparison };
export type { CabinOption, CabinComparisonProps };