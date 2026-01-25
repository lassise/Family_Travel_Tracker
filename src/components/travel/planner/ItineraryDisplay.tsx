import { Button } from "@/components/ui/button";
import { Calendar, Sun, Moon, Clock, Trash2, Save, RotateCcw, Share2 } from "lucide-react";

interface DayActivity {
  activity: string;
  description: string;
  duration: string;
}

interface ItineraryDay {
  dayNumber: number;
  title: string;
  morning: DayActivity;
  afternoon: DayActivity;
  evening: DayActivity;
  tips: string;
}

export interface QuickItinerary {
  destination: string;
  summary: string;
  days: ItineraryDay[];
}

interface ItineraryDisplayProps {
  itinerary: QuickItinerary;
  onDelete: () => void;
  onSave: () => void;
  onRegenerate: () => void;
  onNewPlan: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

const ItineraryDisplay = ({
  itinerary,
  onDelete,
  onSave,
  onRegenerate,
  onNewPlan,
  isSaving,
  isSaved,
}: ItineraryDisplayProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{itinerary.destination}</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onDelete} title="Delete plan">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRegenerate} title="Regenerate">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">{itinerary.summary}</p>

      <div className="space-y-4">
        {itinerary.days.map((day) => (
          <div key={day.dayNumber} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Day {day.dayNumber}: {day.title}</span>
            </div>

            <div className="grid gap-2 pl-6">
              <div className="flex items-start gap-2">
                <Sun className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">{day.morning.activity}</p>
                  <p className="text-xs text-muted-foreground">{day.morning.description}</p>
                  <span className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />{day.morning.duration}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Sun className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">{day.afternoon.activity}</p>
                  <p className="text-xs text-muted-foreground">{day.afternoon.description}</p>
                  <span className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />{day.afternoon.duration}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Moon className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">{day.evening.activity}</p>
                  <p className="text-xs text-muted-foreground">{day.evening.description}</p>
                  <span className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />{day.evening.duration}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              💡 {day.tips}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onNewPlan} className="flex-1">
          New Plan
        </Button>
        {!isSaved && (
          <Button onClick={onSave} disabled={isSaving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Trip"}
          </Button>
        )}
        {isSaved && (
          <Button variant="secondary" disabled className="flex-1">
            ✓ Saved
          </Button>
        )}
      </div>
    </div>
  );
};

export default ItineraryDisplay;
