import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FamilyMember } from '@/hooks/useFamilyData';
import { useVisitDetails } from '@/hooks/useVisitDetails';
import { Globe, Users, Calendar, Plane, Trophy } from 'lucide-react';

interface QuickStatsDashboardProps {
  totalCountries: number;
  totalContinents: number;
  familyMembers: FamilyMember[];
}

const QuickStatsDashboard = ({ totalCountries, totalContinents, familyMembers }: QuickStatsDashboardProps) => {
  const { visitDetails } = useVisitDetails();
  
  const totalDaysAbroad = visitDetails.reduce((sum, v) => sum + (v.number_of_days || 0), 0);
  const totalTrips = visitDetails.length;
  const mostTraveled = familyMembers.reduce((max, m) => 
    m.countriesVisited > max.countriesVisited ? m : max, 
    familyMembers[0] || { name: 'N/A', countriesVisited: 0 }
  );

  const stats = [
    {
      icon: Globe,
      value: totalCountries,
      label: 'Countries',
      sublabel: 'explored',
      gradient: 'from-primary to-primary/60',
    },
    {
      icon: Plane,
      value: totalContinents,
      label: 'Continents',
      sublabel: 'of 7',
      gradient: 'from-secondary to-secondary/60',
    },
    {
      icon: Calendar,
      value: totalDaysAbroad,
      label: 'Days',
      sublabel: 'abroad',
      gradient: 'from-accent to-accent/60',
    },
    {
      icon: Plane,
      value: totalTrips,
      label: 'Trips',
      sublabel: 'recorded',
      gradient: 'from-primary to-secondary',
    },
    {
      icon: Users,
      value: familyMembers.length,
      label: 'Travelers',
      sublabel: 'in family',
      gradient: 'from-secondary to-accent',
    },
    {
      icon: Trophy,
      value: mostTraveled?.countriesVisited || 0,
      label: mostTraveled?.name?.split(' ')[0] || 'Top',
      sublabel: 'most traveled',
      gradient: 'from-accent to-primary',
    },
  ];

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Your Family's Travel Journey
        </h2>
        <p className="text-muted-foreground mt-2">
          Adventures across the globe, memories that last forever
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="bg-card border-border overflow-hidden group hover:shadow-travel transition-all duration-300"
          >
            <CardContent className="p-4 text-center">
              <div className={`inline-flex p-3 rounded-full bg-gradient-to-br ${stat.gradient} mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-foreground">
                {stat.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {stat.sublabel}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuickStatsDashboard;
