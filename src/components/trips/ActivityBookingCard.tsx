import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  ExternalLink,
  Clock,
  MapPin,
  DollarSign,
  Baby,
  ShoppingCart,
  AlertCircle,
  Sun,
  Users,
  Sparkles,
  Train,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityBookingCardProps {
  activity: {
    id: string;
    title: string;
    description: string | null;
    location_name: string | null;
    location_address: string | null;
    category: string | null;
    duration_minutes: number | null;
    cost_estimate: number | null;
    is_kid_friendly: boolean | null;
    is_stroller_friendly: boolean | null;
    requires_reservation: boolean | null;
    reservation_info: string | null;
    start_time: string | null;
    end_time: string | null;
    rating: number | null;
    review_count: number | null;
    booking_url: string | null;
    provider_type: string | null;
    why_it_fits: string | null;
    best_time_to_visit: string | null;
    crowd_level: string | null;
    seasonal_notes: string | null;
    transport_mode: string | null;
    transport_booking_url: string | null;
    transport_station_notes: string | null;
  };
  hasKids: boolean;
}

const ActivityBookingCard = ({ activity, hasKids }: ActivityBookingCardProps) => {
  const formatTime = (time: string | null) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "attraction":
        return "bg-blue-500/10 text-blue-600";
      case "restaurant":
        return "bg-orange-500/10 text-orange-600";
      case "outdoor":
        return "bg-green-500/10 text-green-600";
      case "museum":
        return "bg-purple-500/10 text-purple-600";
      case "entertainment":
        return "bg-pink-500/10 text-pink-600";
      case "transport":
        return "bg-gray-500/10 text-gray-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCrowdLevelColor = (level: string | null) => {
    switch (level) {
      case "low":
        return "bg-green-500/10 text-green-600";
      case "moderate":
        return "bg-yellow-500/10 text-yellow-600";
      case "high":
        return "bg-orange-500/10 text-orange-600";
      case "peak":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getProviderLabel = (type: string | null) => {
    switch (type) {
      case "local_tour":
        return "Local Tour";
      case "airbnb_experience":
        return "Airbnb Experience";
      case "viator":
        return "Viator";
      case "getyourguide":
        return "GetYourGuide";
      default:
        return null;
    }
  };

  const providerLabel = getProviderLabel(activity.provider_type);

  return (
    <div className="bg-muted/30 rounded-lg p-4">
      {/* Header with time and category */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {activity.start_time && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(activity.start_time)}
              {activity.end_time && ` - ${formatTime(activity.end_time)}`}
            </Badge>
          )}
          <Badge className={getCategoryColor(activity.category)}>
            {activity.category || "activity"}
          </Badge>
          {providerLabel && (
            <Badge variant="secondary" className="text-xs">
              {providerLabel}
            </Badge>
          )}
        </div>

        {/* Rating */}
        {activity.rating !== null ? (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{activity.rating.toFixed(1)}</span>
            {activity.review_count && (
              <span className="text-xs text-muted-foreground">
                ({activity.review_count.toLocaleString()})
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Rating unavailable</span>
        )}
      </div>

      {/* Title and description */}
      <h4 className="font-semibold text-lg">{activity.title}</h4>
      {activity.description && (
        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
      )}

      {/* Why it fits - personalized recommendation */}
      {activity.why_it_fits && (
        <div className="flex items-start gap-2 mt-3 p-2 bg-primary/5 rounded-md">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary">{activity.why_it_fits}</p>
        </div>
      )}

      {/* Crowd and timing info */}
      <div className="flex flex-wrap gap-2 mt-3">
        {activity.best_time_to_visit && (
          <Badge variant="outline" className="text-xs">
            <Sun className="h-3 w-3 mr-1" />
            {activity.best_time_to_visit}
          </Badge>
        )}
        {activity.crowd_level && (
          <Badge className={cn("text-xs", getCrowdLevelColor(activity.crowd_level))}>
            <Users className="h-3 w-3 mr-1" />
            {activity.crowd_level.charAt(0).toUpperCase() + activity.crowd_level.slice(1)} crowds
          </Badge>
        )}
      </div>

      {/* Seasonal notes */}
      {activity.seasonal_notes && (
        <p className="text-xs text-muted-foreground mt-2 italic">
          ⚠️ {activity.seasonal_notes}
        </p>
      )}

      {/* Location and details */}
      <div className="flex flex-wrap gap-4 mt-3 text-sm">
        {activity.location_name && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {activity.location_name}
          </div>
        )}
        {activity.duration_minutes && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {activity.duration_minutes} min
          </div>
        )}
        {activity.cost_estimate !== null && activity.cost_estimate > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            ~${activity.cost_estimate}
          </div>
        )}
      </div>

      {/* Kid-friendly badges */}
      {hasKids && (
        <div className="flex gap-1 mt-2">
          {activity.is_kid_friendly && (
            <Badge variant="secondary" className="text-xs">
              <Baby className="h-3 w-3 mr-1" />
              Kid-friendly
            </Badge>
          )}
          {activity.is_stroller_friendly && (
            <Badge variant="secondary" className="text-xs">
              <ShoppingCart className="h-3 w-3 mr-1" />
              Stroller OK
            </Badge>
          )}
        </div>
      )}

      {/* Transport notes */}
      {activity.transport_station_notes && (
        <div className="flex items-start gap-2 mt-3 p-2 bg-blue-500/5 rounded-md">
          <Train className="h-4 w-4 text-blue-600 mt-0.5" />
          <p className="text-sm text-blue-600">{activity.transport_station_notes}</p>
        </div>
      )}

      {/* Reservation warning */}
      {activity.requires_reservation && (
        <div className="flex items-start gap-2 mt-3 p-2 bg-yellow-500/10 rounded-md">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <span className="font-medium text-yellow-600">Reservation required</span>
            {activity.reservation_info && (
              <p className="text-muted-foreground">{activity.reservation_info}</p>
            )}
          </div>
        </div>
      )}

      {/* Booking button */}
      {activity.booking_url && (
        <Button
          variant="default"
          size="sm"
          className="mt-3 w-full sm:w-auto"
          onClick={() => window.open(activity.booking_url!, "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Book Now
        </Button>
      )}

      {/* Transport booking if available */}
      {activity.transport_booking_url && activity.transport_mode === 'train' && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 ml-0 sm:ml-2 w-full sm:w-auto"
          onClick={() => window.open(activity.transport_booking_url!, "_blank")}
        >
          <Train className="h-4 w-4 mr-2" />
          Book Train
        </Button>
      )}
    </div>
  );
};

export default ActivityBookingCard;
