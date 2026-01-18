import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfToday } from 'date-fns';

interface PriceData {
  date: string;
  price: number;
  priceLevel: 'low' | 'medium' | 'high';
}

interface FlexibleDateCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  priceData?: PriceData[];
  minDate?: Date;
  className?: string;
}

const FlexibleDateCalendar = ({
  selectedDate,
  onDateSelect,
  priceData = [],
  minDate = startOfToday(),
  className,
}: FlexibleDateCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      return new Date(selectedDate);
    }
    return new Date();
  });

  const priceMap = useMemo(() => {
    const map = new Map<string, PriceData>();
    priceData.forEach(p => map.set(p.date, p));
    return map;
  }, [priceData]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const getPriceColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700';
      default:
        return '';
    }
  };

  // Find cheapest date in current month
  const cheapestInMonth = useMemo(() => {
    const monthPrices = priceData.filter(p => {
      const d = new Date(p.date);
      return isSameMonth(d, currentMonth);
    });
    if (monthPrices.length === 0) return null;
    return monthPrices.reduce((min, curr) => curr.price < min.price ? curr : min);
  }, [priceData, currentMonth]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonth = days[0].getDay();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">Great price</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-muted-foreground">Average</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">Higher price</span>
          </div>
          {cheapestInMonth && (
            <Badge variant="outline" className="ml-auto bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <TrendingDown className="h-3 w-3 mr-1" />
              Best: ${cheapestInMonth.price} on {format(new Date(cheapestInMonth.date), 'MMM d')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the first of the month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Day cells */}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const priceInfo = priceMap.get(dateStr);
            const isSelected = dateStr === selectedDate;
            const isPast = isBefore(day, minDate);
            const isTodayDate = isToday(day);
            
            return (
              <button
                key={dateStr}
                onClick={() => !isPast && onDateSelect(dateStr)}
                disabled={isPast}
                className={cn(
                  'relative aspect-square flex flex-col items-center justify-center rounded-lg border text-sm transition-all',
                  isPast && 'opacity-40 cursor-not-allowed bg-muted',
                  !isPast && 'hover:border-primary hover:bg-primary/5 cursor-pointer',
                  isSelected && 'border-primary bg-primary text-primary-foreground hover:bg-primary',
                  !isSelected && priceInfo && getPriceColor(priceInfo.priceLevel),
                  !isSelected && !priceInfo && 'border-border bg-background',
                  isTodayDate && !isSelected && 'ring-2 ring-primary ring-offset-1'
                )}
              >
                <span className={cn('font-medium', isSelected && 'text-primary-foreground')}>
                  {format(day, 'd')}
                </span>
                {priceInfo && !isSelected && (
                  <span className="text-[10px] font-medium">
                    ${priceInfo.price}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FlexibleDateCalendar;