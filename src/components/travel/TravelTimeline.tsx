import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVisitDetails, VisitDetail } from '@/hooks/useVisitDetails';
import { Country } from '@/hooks/useFamilyData';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TravelTimelineProps {
  countries: Country[];
}

const TravelTimeline = ({ countries }: TravelTimelineProps) => {
  const { visitDetails } = useVisitDetails();

  // Sort visits by date
  const sortedVisits = [...visitDetails]
    .filter(v => v.visit_date || v.approximate_year)
    .sort((a, b) => {
      const dateA = a.visit_date ? new Date(a.visit_date) : new Date(a.approximate_year || 2000, (a.approximate_month || 1) - 1);
      const dateB = b.visit_date ? new Date(b.visit_date) : new Date(b.approximate_year || 2000, (b.approximate_month || 1) - 1);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 10);

  const getCountryName = (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    return country ? `${country.flag} ${country.name}` : 'Unknown';
  };

  const formatVisitDate = (visit: typeof visitDetails[0]) => {
    if (visit.visit_date) {
      return format(new Date(visit.visit_date), 'MMM dd, yyyy');
    }
    if (visit.approximate_year) {
      const month = visit.approximate_month ? format(new Date(2000, visit.approximate_month - 1), 'MMM') : '';
      return `${month} ${visit.approximate_year}`;
    }
    return 'Date unknown';
  };

  if (sortedVisits.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Travel Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Add visit dates to your countries to see your travel timeline!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          Travel Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent" />
          
          <div className="space-y-6">
            {sortedVisits.map((visit, index) => (
              <div key={visit.id} className="relative pl-10">
                {/* Timeline dot */}
                <div 
                  className="absolute left-2 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center"
                  style={{
                    background: index === 0 ? 'hsl(var(--primary))' : 
                               index < 3 ? 'hsl(var(--secondary))' : 'hsl(var(--accent))'
                  }}
                >
                  <MapPin className="h-3 w-3 text-primary-foreground" />
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 hover:bg-muted transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className="font-semibold text-foreground">
                      {getCountryName(visit.country_id)}
                    </h4>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatVisitDate(visit)}
                    </span>
                  </div>
                  
                  {visit.trip_name && (
                    <p className="text-sm text-primary mt-1">{visit.trip_name}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {visit.number_of_days && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {visit.number_of_days} days
                      </span>
                    )}
                  </div>
                  
                  {visit.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      "{visit.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TravelTimeline;
