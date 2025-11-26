import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Award, TrendingUp, Users } from "lucide-react";

interface TravelStatsProps {
  totalCountries: number;
  totalContinents: number;
  familyMembers: number;
}

const TravelStats = ({ totalCountries, totalContinents, familyMembers }: TravelStatsProps) => {
  // Calculate percentile based on countries visited
  // Source: Most people visit 5-10 countries in their lifetime
  const getPercentile = (countries: number): number => {
    if (countries >= 50) return 99;
    if (countries >= 40) return 95;
    if (countries >= 30) return 90;
    if (countries >= 25) return 85;
    if (countries >= 20) return 75;
    if (countries >= 15) return 60;
    if (countries >= 10) return 40;
    return 20;
  };

  const percentile = getPercentile(totalCountries);
  
  const stats = [
    {
      icon: Globe,
      label: "Global Explorer",
      value: `Top ${100 - percentile}%`,
      description: `You've visited more countries than ${percentile}% of people worldwide`,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Award,
      label: "Continent Collector",
      value: `${totalContinents}/7`,
      description: `${totalContinents === 7 ? "All continents conquered!" : `${7 - totalContinents} continent${7 - totalContinents !== 1 ? 's' : ''} to go`}`,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: TrendingUp,
      label: "Travel Dedication",
      value: `${(totalCountries / familyMembers).toFixed(1)} avg`,
      description: "Average countries visited per family member",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Users,
      label: "Family Adventures",
      value: `${totalCountries} total`,
      description: "Countries explored together as a family",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Travel Achievements
          </h2>
          <p className="text-muted-foreground text-lg">
            Your family's incredible journey in numbers
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2 text-foreground">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TravelStats;
