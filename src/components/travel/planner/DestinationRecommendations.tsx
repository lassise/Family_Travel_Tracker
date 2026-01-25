import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Star, ChevronRight, RotateCcw } from "lucide-react";

export interface DestinationRecommendation {
  destination: string;
  country: string;
  matchScore: number;
  reason: string;
  highlights: string[];
  bestTimeToVisit: string;
}

interface DestinationRecommendationsProps {
  recommendations: DestinationRecommendation[];
  loading: boolean;
  onSelect: (destination: string) => void;
  onRegenerate: () => void;
  onBack: () => void;
}

const DestinationRecommendations = ({
  recommendations,
  loading,
  onSelect,
  onRegenerate,
  onBack,
}: DestinationRecommendationsProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Finding perfect destinations for you...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Top Destinations For You</h3>
        <Button variant="ghost" size="sm" onClick={onRegenerate}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <button
            key={index}
            onClick={() => onSelect(rec.destination)}
            className="w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-accent/30 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">{rec.destination}</span>
                  {rec.country && rec.country !== rec.destination && (
                    <span className="text-sm text-muted-foreground">• {rec.country}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium">{rec.matchScore}% match</span>
                  </div>
                  <span className="text-xs text-muted-foreground">• Best: {rec.bestTimeToVisit}</span>
                </div>

                <p className="text-sm text-muted-foreground">{rec.reason}</p>

                <div className="flex flex-wrap gap-1">
                  {rec.highlights.slice(0, 4).map((highlight, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="pt-2">
        <Button variant="outline" onClick={onBack} className="w-full">
          Start Over
        </Button>
      </div>
    </div>
  );
};

export default DestinationRecommendations;
