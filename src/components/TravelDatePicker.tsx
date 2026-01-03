import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface TravelDatePickerProps {
  startDate: string | null;
  endDate: string | null;
  onSave: (startDate: string | null, endDate: string | null) => void;
  disabled?: boolean;
}

export const TravelDatePicker = ({
  startDate,
  endDate,
  onSave,
  disabled = false,
}: TravelDatePickerProps) => {
  const [open, setOpen] = useState(false);
  const [localStartDate, setLocalStartDate] = useState<Date | undefined>(
    startDate ? parseISO(startDate) : undefined
  );
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(
    endDate ? parseISO(endDate) : undefined
  );
  const [activeField, setActiveField] = useState<"start" | "end">("start");

  // Sync with external props when popover opens
  useEffect(() => {
    if (open) {
      setLocalStartDate(startDate ? parseISO(startDate) : undefined);
      setLocalEndDate(endDate ? parseISO(endDate) : undefined);
      setActiveField("start");
    }
  }, [open, startDate, endDate]);

  const handleDone = () => {
    const formattedStart = localStartDate ? format(localStartDate, "yyyy-MM-dd") : null;
    const formattedEnd = localEndDate ? format(localEndDate, "yyyy-MM-dd") : null;
    onSave(formattedStart, formattedEnd);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalStartDate(startDate ? parseISO(startDate) : undefined);
    setLocalEndDate(endDate ? parseISO(endDate) : undefined);
    setOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (activeField === "start") {
      setLocalStartDate(date);
      // If end date is before start date, clear it
      if (localEndDate && date > localEndDate) {
        setLocalEndDate(undefined);
      }
      setActiveField("end");
    } else {
      // If selecting end date before start, swap them
      if (localStartDate && date < localStartDate) {
        setLocalEndDate(localStartDate);
        setLocalStartDate(date);
      } else {
        setLocalEndDate(date);
      }
    }
  };

  const displayText = () => {
    if (startDate && endDate) {
      return `${format(parseISO(startDate), "MMM d, yyyy")} - ${format(parseISO(endDate), "MMM d, yyyy")}`;
    }
    if (startDate) {
      return format(parseISO(startDate), "MMM d, yyyy");
    }
    return "Pick travel dates";
  };

  const hasChanges = () => {
    const originalStart = startDate ? format(parseISO(startDate), "yyyy-MM-dd") : null;
    const originalEnd = endDate ? format(parseISO(endDate), "yyyy-MM-dd") : null;
    const newStart = localStartDate ? format(localStartDate, "yyyy-MM-dd") : null;
    const newEnd = localEndDate ? format(localEndDate, "yyyy-MM-dd") : null;
    return originalStart !== newStart || originalEnd !== newEnd;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !startDate && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {displayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b bg-muted/30">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setActiveField("start")}
              className={cn(
                "flex-1 p-2 rounded-md border text-left transition-colors",
                activeField === "start"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <Label className="text-xs text-muted-foreground block mb-0.5">Start Date</Label>
              <div className="text-sm font-medium">
                {localStartDate ? format(localStartDate, "MMM d, yyyy") : "Select..."}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveField("end")}
              className={cn(
                "flex-1 p-2 rounded-md border text-left transition-colors",
                activeField === "end"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <Label className="text-xs text-muted-foreground block mb-0.5">End Date</Label>
              <div className="text-sm font-medium">
                {localEndDate ? format(localEndDate, "MMM d, yyyy") : "Select..."}
              </div>
            </button>
          </div>
        </div>
        
        <CalendarComponent
          mode="single"
          selected={activeField === "start" ? localStartDate : localEndDate}
          onSelect={handleDateSelect}
          defaultMonth={localStartDate || localEndDate || new Date()}
          className="pointer-events-auto"
          modifiers={{
            range_start: localStartDate ? [localStartDate] : [],
            range_end: localEndDate ? [localEndDate] : [],
            range_middle: localStartDate && localEndDate 
              ? { after: localStartDate, before: localEndDate }
              : [],
          }}
          modifiersClassNames={{
            range_start: "bg-primary text-primary-foreground rounded-l-md",
            range_end: "bg-primary text-primary-foreground rounded-r-md",
            range_middle: "bg-accent text-accent-foreground",
          }}
        />
        
        <div className="p-3 border-t flex justify-end gap-2 bg-muted/30">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleDone}
            disabled={!localStartDate}
          >
            <Check className="w-4 h-4 mr-1" />
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
