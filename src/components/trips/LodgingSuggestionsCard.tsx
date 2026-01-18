import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Hotel, 
  Star, 
  ExternalLink, 
  MapPin, 
  Baby, 
  Wifi, 
  Car,
  Utensils,
  Waves
} from "lucide-react";

interface LodgingSuggestion {
  id: string;
  name: string;
  description: string | null;
  lodging_type: string | null;
  rating: number | null;
  review_count: number | null;
  price_per_night: number | null;
  currency: string | null;
  booking_url: string | null;
  address: string | null;
  amenities: string[] | null;
  is_kid_friendly: boolean | null;
  distance_from_center: string | null;
  why_recommended: string | null;
}

interface LodgingSuggestionsCardProps {
  suggestions: LodgingSuggestion[];
  tripTitle: string;
}

const LodgingSuggestionsCard = ({ suggestions, tripTitle }: LodgingSuggestionsCardProps) => {
  if (!suggestions || suggestions.length === 0) return null;

  const getLodgingTypeIcon = (type: string | null) => {
    switch (type) {
      case "hotel":
        return <Hotel className="h-4 w-4" />;
      case "vacation_rental":
      case "apartment":
        return <Hotel className="h-4 w-4" />;
      default:
        return <Hotel className="h-4 w-4" />;
    }
  };

  const getLodgingTypeLabel = (type: string | null) => {
    switch (type) {
      case "hotel":
        return "Hotel";
      case "vacation_rental":
        return "Vacation Rental";
      case "hostel":
        return "Hostel";
      case "apartment":
        return "Apartment";
      default:
        return "Accommodation";
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("wifi") || lower.includes("internet")) return <Wifi className="h-3 w-3" />;
    if (lower.includes("parking") || lower.includes("car")) return <Car className="h-3 w-3" />;
    if (lower.includes("pool") || lower.includes("swim")) return <Waves className="h-3 w-3" />;
    if (lower.includes("breakfast") || lower.includes("kitchen") || lower.includes("restaurant")) return <Utensils className="h-3 w-3" />;
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hotel className="h-5 w-5 text-primary" />
          Lodging Suggestions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          We noticed you haven't booked lodging yet. Here are some recommendations for {tripTitle}:
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.id} 
            className="bg-background rounded-lg p-4 border"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold">{suggestion.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {getLodgingTypeIcon(suggestion.lodging_type)}
                    <span className="ml-1">{getLodgingTypeLabel(suggestion.lodging_type)}</span>
                  </Badge>
                  {suggestion.is_kid_friendly && (
                    <Badge variant="secondary" className="text-xs">
                      <Baby className="h-3 w-3 mr-1" />
                      Family-friendly
                    </Badge>
                  )}
                </div>

                {/* Rating */}
                {suggestion.rating !== null && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{suggestion.rating.toFixed(1)}</span>
                    {suggestion.review_count && (
                      <span className="text-xs text-muted-foreground">
                        ({suggestion.review_count.toLocaleString()} reviews)
                      </span>
                    )}
                  </div>
                )}

                {suggestion.description && (
                  <p className="text-sm text-muted-foreground mt-2">{suggestion.description}</p>
                )}

                {/* Why recommended */}
                {suggestion.why_recommended && (
                  <p className="text-sm text-primary mt-2 italic">
                    ✨ {suggestion.why_recommended}
                  </p>
                )}

                {/* Location and distance */}
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                  {suggestion.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {suggestion.address}
                    </span>
                  )}
                  {suggestion.distance_from_center && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {suggestion.distance_from_center} from center
                    </span>
                  )}
                </div>

                {/* Amenities */}
                {suggestion.amenities && suggestion.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {suggestion.amenities.slice(0, 5).map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {getAmenityIcon(amenity)}
                        <span className={getAmenityIcon(amenity) ? "ml-1" : ""}>{amenity}</span>
                      </Badge>
                    ))}
                    {suggestion.amenities.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{suggestion.amenities.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Price and booking */}
              <div className="text-right flex-shrink-0">
                {suggestion.price_per_night && (
                  <div>
                    <span className="text-lg font-bold">
                      {suggestion.currency || "$"}{suggestion.price_per_night}
                    </span>
                    <span className="text-xs text-muted-foreground">/night</span>
                  </div>
                )}
                {suggestion.booking_url && (
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open(suggestion.booking_url!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Book
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LodgingSuggestionsCard;
