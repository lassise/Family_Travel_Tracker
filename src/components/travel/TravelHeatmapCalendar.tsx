import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVisitDetails, VisitDetail } from '@/hooks/useVisitDetails';
import { CalendarDays } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TravelHeatmapCalendar = () => {
  const { visitDetails } = useVisitDetails();

  // Count visits by month
  const monthCounts = visitDetails.reduce((acc, visit) => {
    let month: number | null = null;
    
    if (visit.visit_date) {
      month = new Date(visit.visit_date).getMonth();
    } else if (visit.approximate_month) {
      month = visit.approximate_month - 1;
    }
    
    if (month !== null) {
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const maxCount = Math.max(...Object.values(monthCounts), 1);

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-muted/30';
    const ratio = count / maxCount;
    if (ratio > 0.75) return 'bg-primary';
    if (ratio > 0.5) return 'bg-primary/75';
    if (ratio > 0.25) return 'bg-primary/50';
    return 'bg-primary/25';
  };

  // Find peak travel months
  const sortedMonths = Object.entries(monthCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <CalendarDays className="h-5 w-5 text-primary" />
          Travel Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2 mb-6">
          {MONTHS.map((month, index) => {
            const count = monthCounts[index] || 0;
            return (
              <div key={month} className="flex flex-col items-center">
                <div 
                  className={`w-full aspect-square rounded-lg ${getIntensity(count)} flex items-center justify-center transition-all hover:scale-105`}
                  title={`${month}: ${count} trips`}
                >
                  <span className={`text-sm font-bold ${count > 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    {count || ''}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">{month}</span>
              </div>
            );
          })}
        </div>

        {sortedMonths.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Peak Travel Months</h4>
            <div className="flex flex-wrap gap-2">
              {sortedMonths.map(([month, count], index) => (
                <span 
                  key={month}
                  className={`px-3 py-1 rounded-full text-sm ${
                    index === 0 ? 'bg-primary text-primary-foreground' :
                    index === 1 ? 'bg-secondary text-secondary-foreground' :
                    'bg-accent text-accent-foreground'
                  }`}
                >
                  {MONTHS[parseInt(month)]} ({count} trips)
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-muted/30" />
            <div className="w-4 h-4 rounded bg-primary/25" />
            <div className="w-4 h-4 rounded bg-primary/50" />
            <div className="w-4 h-4 rounded bg-primary/75" />
            <div className="w-4 h-4 rounded bg-primary" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TravelHeatmapCalendar;
