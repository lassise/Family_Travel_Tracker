import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Train, Clock, ExternalLink, AlertTriangle, MapPin } from "lucide-react";

interface TrainSegment {
  id: string;
  origin_city: string;
  origin_station: string;
  origin_station_alternatives: string[] | null;
  destination_city: string;
  destination_station: string;
  destination_station_alternatives: string[] | null;
  departure_time: string | null;
  arrival_time: string | null;
  duration_minutes: number | null;
  train_type: string | null;
  booking_url: string | null;
  price_estimate: number | null;
  currency: string | null;
  station_guidance: string | null;
  station_warning: string | null;
}

interface TrainSegmentCardProps {
  segment: TrainSegment;
}

const TrainSegmentCard = ({ segment }: TrainSegmentCardProps) => {
  const formatTime = (time: string | null) => {
    if (!time) return "--:--";
    return time.substring(0, 5);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card className="bg-blue-500/5 border-blue-500/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Train className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-600">Train Journey</span>
          {segment.train_type && (
            <Badge variant="outline" className="text-xs">
              {segment.train_type}
            </Badge>
          )}
        </div>

        {/* Journey details */}
        <div className="flex items-center gap-4">
          {/* Origin */}
          <div className="flex-1">
            <p className="text-lg font-semibold">{formatTime(segment.departure_time)}</p>
            <p className="text-sm font-medium">{segment.origin_city}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {segment.origin_station}
            </p>
          </div>

          {/* Arrow and duration */}
          <div className="flex flex-col items-center px-2">
            <div className="w-16 h-0.5 bg-blue-500 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-blue-500 border-y-4 border-y-transparent" />
            </div>
            {segment.duration_minutes && (
              <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(segment.duration_minutes)}
              </span>
            )}
          </div>

          {/* Destination */}
          <div className="flex-1 text-right">
            <p className="text-lg font-semibold">{formatTime(segment.arrival_time)}</p>
            <p className="text-sm font-medium">{segment.destination_city}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
              <MapPin className="h-3 w-3" />
              {segment.destination_station}
            </p>
          </div>
        </div>

        {/* Station warning */}
        {segment.station_warning && (
          <div className="flex items-start gap-2 mt-3 p-2 bg-yellow-500/10 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700">{segment.station_warning}</p>
          </div>
        )}

        {/* Station guidance */}
        {segment.station_guidance && (
          <p className="text-sm text-muted-foreground mt-2 italic">
            💡 {segment.station_guidance}
          </p>
        )}

        {/* Alternative stations */}
        {(segment.origin_station_alternatives?.length || segment.destination_station_alternatives?.length) && (
          <div className="mt-2 text-xs text-muted-foreground">
            {segment.origin_station_alternatives?.length ? (
              <p>Alternative origin stations: {segment.origin_station_alternatives.join(", ")}</p>
            ) : null}
            {segment.destination_station_alternatives?.length ? (
              <p>Alternative destination stations: {segment.destination_station_alternatives.join(", ")}</p>
            ) : null}
          </div>
        )}

        {/* Price and booking */}
        <div className="flex items-center justify-between mt-4">
          {segment.price_estimate && (
            <span className="text-sm font-medium">
              ~{segment.currency || "EUR"} {segment.price_estimate}
            </span>
          )}
          {segment.booking_url && (
            <Button
              size="sm"
              onClick={() => window.open(segment.booking_url!, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Book Train
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainSegmentCard;
