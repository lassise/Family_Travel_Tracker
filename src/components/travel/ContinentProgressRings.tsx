import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Country } from '@/hooks/useFamilyData';
import { MapPin } from 'lucide-react';

interface ContinentProgressRingsProps {
  countries: Country[];
}

const CONTINENT_TOTALS: Record<string, number> = {
  'Africa': 54,
  'Asia': 48,
  'Europe': 44,
  'North America': 23,
  'South America': 12,
  'Oceania': 14,
  'Antarctica': 1,
};

const CONTINENT_COLORS: Record<string, string> = {
  'Africa': 'hsl(20, 90%, 58%)',
  'Asia': 'hsl(200, 85%, 55%)',
  'Europe': 'hsl(160, 50%, 45%)',
  'North America': 'hsl(45, 100%, 50%)',
  'South America': 'hsl(280, 60%, 55%)',
  'Oceania': 'hsl(340, 75%, 55%)',
  'Antarctica': 'hsl(210, 20%, 70%)',
};

const CircularProgress = ({ 
  percentage, 
  color, 
  size = 100,
  strokeWidth = 8 
}: { 
  percentage: number; 
  color: string; 
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

const ContinentProgressRings = ({ countries }: ContinentProgressRingsProps) => {
  const visitedByContinent = countries
    .filter(c => c.visitedBy.length > 0)
    .reduce((acc, country) => {
      acc[country.continent] = (acc[country.continent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const continents = Object.entries(CONTINENT_TOTALS)
    .filter(([name]) => name !== 'Antarctica')
    .map(([name, total]) => ({
      name,
      visited: visitedByContinent[name] || 0,
      total,
      percentage: Math.round(((visitedByContinent[name] || 0) / total) * 100),
      color: CONTINENT_COLORS[name],
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          Continent Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {continents.map((continent) => (
            <div key={continent.name} className="flex flex-col items-center">
              <div className="relative">
                <CircularProgress 
                  percentage={continent.percentage} 
                  color={continent.color}
                  size={80}
                  strokeWidth={6}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground">
                    {continent.percentage}%
                  </span>
                </div>
              </div>
              <h4 className="mt-3 font-medium text-foreground text-center text-sm">
                {continent.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {continent.visited}/{continent.total}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContinentProgressRings;
