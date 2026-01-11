import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Country, FamilyMember } from '@/hooks/useFamilyData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVisitDetails } from '@/hooks/useVisitDetails';
import { 
  Trophy, Target, Star, Globe, Map, Plane, Award, Medal, 
  Crown, Gem, Plus, Check, Calendar, Trash2, Clock, Users,
  MapPin, Route, CalendarDays, CalendarRange, Milestone
} from 'lucide-react';
import { format, differenceInDays, parseISO, getYear } from 'date-fns';

interface AchievementsGoalsProps {
  countries: Country[];
  familyMembers: FamilyMember[];
  totalContinents: number;
}

interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  requirement: number;
  type: 'countries' | 'continents';
}

interface Goal {
  id: string;
  title: string;
  target_count: number;
  goal_type: string;
  deadline: string | null;
  is_completed: boolean;
}

interface GoalType {
  value: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const GOAL_TYPES: GoalType[] = [
  { value: 'countries', label: 'Countries Visited', icon: Globe, description: 'Total unique countries visited' },
  { value: 'continents', label: 'Continents Visited', icon: Map, description: 'Total continents explored' },
  { value: 'days_abroad', label: 'Days Abroad', icon: CalendarDays, description: 'Total days spent traveling' },
  { value: 'trips', label: 'Number of Trips', icon: Plane, description: 'Total trips taken' },
  { value: 'cities', label: 'Cities Visited', icon: MapPin, description: 'Total unique cities visited' },
  { value: 'countries_this_year', label: 'Countries This Year', icon: Calendar, description: 'New countries visited this year' },
  { value: 'days_this_year', label: 'Days Abroad This Year', icon: Clock, description: 'Days spent traveling this year' },
  { value: 'family_countries', label: 'Family Countries', icon: Users, description: 'Countries all family members visited together' },
  { value: 'consecutive_years', label: 'Years Traveling', icon: CalendarRange, description: 'Years with at least one trip' },
  { value: 'longest_trip', label: 'Longest Trip (Days)', icon: Route, description: 'Longest single trip duration' },
];

const ACHIEVEMENTS: Achievement[] = [
  // Country milestones
  { key: 'first_country', name: 'First Steps', description: 'Visit your first country', icon: Globe, color: 'bg-emerald-500', requirement: 1, type: 'countries' },
  { key: 'five_countries', name: 'Explorer', description: 'Visit 5 countries', icon: Map, color: 'bg-blue-500', requirement: 5, type: 'countries' },
  { key: 'ten_countries', name: 'Adventurer', description: 'Visit 10 countries', icon: Plane, color: 'bg-cyan-500', requirement: 10, type: 'countries' },
  { key: 'twenty_countries', name: 'Globetrotter', description: 'Visit 20 countries', icon: Star, color: 'bg-purple-500', requirement: 20, type: 'countries' },
  { key: 'twentyfive_countries', name: 'Quarter Century', description: 'Visit 25 countries', icon: Medal, color: 'bg-amber-500', requirement: 25, type: 'countries' },
  { key: 'thirty_countries', name: 'World Traveler', description: 'Visit 30 countries', icon: Award, color: 'bg-orange-500', requirement: 30, type: 'countries' },
  { key: 'forty_countries', name: 'Elite Explorer', description: 'Visit 40 countries', icon: Crown, color: 'bg-rose-500', requirement: 40, type: 'countries' },
  { key: 'fifty_countries', name: 'Legendary', description: 'Visit 50 countries', icon: Gem, color: 'bg-violet-500', requirement: 50, type: 'countries' },
  { key: 'hundred_countries', name: 'Century Club', description: 'Visit 100 countries', icon: Trophy, color: 'bg-gradient-to-r from-amber-500 to-yellow-500', requirement: 100, type: 'countries' },
  // Continent milestones
  { key: 'two_continents', name: 'Continental Start', description: 'Visit 2 continents', icon: Globe, color: 'bg-teal-500', requirement: 2, type: 'continents' },
  { key: 'three_continents', name: 'Continental', description: 'Visit 3 continents', icon: Map, color: 'bg-indigo-500', requirement: 3, type: 'continents' },
  { key: 'five_continents', name: 'Global Citizen', description: 'Visit 5 continents', icon: Plane, color: 'bg-pink-500', requirement: 5, type: 'continents' },
  { key: 'six_continents', name: 'Almost There', description: 'Visit 6 continents', icon: Star, color: 'bg-fuchsia-500', requirement: 6, type: 'continents' },
  { key: 'all_continents', name: 'World Conqueror', description: 'Visit all 7 continents', icon: Crown, color: 'bg-gradient-to-r from-purple-500 to-pink-500', requirement: 7, type: 'continents' },
];

const AchievementsGoals = ({ countries, familyMembers, totalContinents }: AchievementsGoalsProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);
  const [achievementsLoaded, setAchievementsLoaded] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target_count: 5, goal_type: 'countries', deadline: '' });
  const { toast } = useToast();
  const { visitDetails, cityVisits } = useVisitDetails();

  const visitedCountries = countries.filter(c => c.visitedBy.length > 0).length;

  // Calculate all metrics
  const calculateMetrics = () => {
    const currentYear = new Date().getFullYear();
    
    // Total days abroad
    const totalDaysAbroad = visitDetails.reduce((sum, v) => sum + (v.number_of_days || 0), 0);
    
    // Total trips (count of visit records)
    const totalTrips = visitDetails.length;
    
    // Total cities
    const totalCities = cityVisits.length;
    
    // This year's visits
    const thisYearVisits = visitDetails.filter(v => {
      if (v.visit_date) return getYear(parseISO(v.visit_date)) === currentYear;
      if (v.approximate_year) return v.approximate_year === currentYear;
      return false;
    });
    
    const countriesThisYear = [...new Set(thisYearVisits.map(v => v.country_id))].length;
    const daysThisYear = thisYearVisits.reduce((sum, v) => sum + (v.number_of_days || 0), 0);
    
    // Countries all family members visited (shared)
    const familyCountries = countries.filter(c => 
      familyMembers.length > 0 && c.visitedBy.length === familyMembers.length
    ).length;
    
    // Years with travel
    const yearsWithTravel = new Set<number>();
    visitDetails.forEach(v => {
      if (v.visit_date) yearsWithTravel.add(getYear(parseISO(v.visit_date)));
      else if (v.approximate_year) yearsWithTravel.add(v.approximate_year);
    });
    const consecutiveYears = yearsWithTravel.size;
    
    // Longest trip
    const longestTrip = Math.max(
      ...visitDetails.map(v => v.number_of_days || 0),
      0
    );
    
    return {
      countries: visitedCountries,
      continents: totalContinents,
      days_abroad: totalDaysAbroad,
      trips: totalTrips,
      cities: totalCities,
      countries_this_year: countriesThisYear,
      days_this_year: daysThisYear,
      family_countries: familyCountries,
      consecutive_years: consecutiveYears,
      longest_trip: longestTrip,
    };
  };

  const metrics = calculateMetrics();

  // Fetch existing data on mount
  useEffect(() => {
    fetchGoals();
    fetchAchievements();
  }, []);

  // Check for new achievements only after existing ones are loaded
  useEffect(() => {
    if (achievementsLoaded) {
      checkAndAwardAchievements();
    }
  }, [visitedCountries, totalContinents, achievementsLoaded]);

  const fetchGoals = async () => {
    const { data } = await supabase.from('travel_goals').select('*').order('created_at', { ascending: false });
    if (data) setGoals(data as Goal[]);
  };

  const fetchAchievements = async () => {
    const { data } = await supabase.from('user_achievements').select('achievement_key');
    if (data) {
      setEarnedAchievements(data.map(a => a.achievement_key));
    }
    setAchievementsLoaded(true);
  };

  const checkAndAwardAchievements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newlyEarned: string[] = [];

    for (const achievement of ACHIEVEMENTS) {
      const current = achievement.type === 'countries' ? visitedCountries : totalContinents;
      // Only award if not already earned (check both state and what we're about to add)
      if (current >= achievement.requirement && 
          !earnedAchievements.includes(achievement.key) && 
          !newlyEarned.includes(achievement.key)) {
        
        // Try to insert - will fail silently if already exists due to unique constraint
        const { error } = await supabase.from('user_achievements').insert({
          user_id: user.id,
          achievement_key: achievement.key,
        });
        
        // Only show toast if insert succeeded (wasn't already in DB)
        if (!error) {
          newlyEarned.push(achievement.key);
          toast({
            title: '🎉 Achievement Unlocked!',
            description: `${achievement.name}: ${achievement.description}`,
          });
        }
      }
    }

    if (newlyEarned.length > 0) {
      setEarnedAchievements(prev => [...prev, ...newlyEarned]);
    }
  };

  const handleAddGoal = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('travel_goals').insert({
      user_id: user.id,
      ...newGoal,
      deadline: newGoal.deadline || null,
    });

    if (!error) {
      toast({ title: 'Goal added!' });
      setIsAddingGoal(false);
      setNewGoal({ title: '', target_count: 5, goal_type: 'countries', deadline: '' });
      fetchGoals();
    }
  };

  const handleDeleteGoal = async (id: string) => {
    await supabase.from('travel_goals').delete().eq('id', id);
    fetchGoals();
  };

  const getGoalProgress = (goal: Goal) => {
    const current = metrics[goal.goal_type as keyof typeof metrics] || 0;
    return (current / goal.target_count) * 100;
  };

  const getGoalCurrent = (goal: Goal): number => {
    return metrics[goal.goal_type as keyof typeof metrics] || 0;
  };

  const getGoalTypeInfo = (goalType: string) => {
    return GOAL_TYPES.find(t => t.value === goalType);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Achievements */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Trophy className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((achievement) => {
              const isEarned = earnedAchievements.includes(achievement.key);
              const current = achievement.type === 'countries' ? visitedCountries : totalContinents;
              
              return (
                <div 
                  key={achievement.key}
                  className={`relative flex flex-col items-center p-3 rounded-lg transition-all ${
                    isEarned 
                      ? 'bg-muted' 
                      : 'bg-muted/30 opacity-50'
                  }`}
                  title={`${achievement.name}: ${achievement.description} (${current}/${achievement.requirement})`}
                >
                  <div className={`p-2 rounded-full ${isEarned ? achievement.color : 'bg-muted'}`}>
                    <achievement.icon className={`h-5 w-5 ${isEarned ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground mt-2 text-center">
                    {achievement.name}
                  </span>
                  {isEarned && (
                    <Check className="absolute top-1 right-1 h-4 w-4 text-accent" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Target className="h-5 w-5 text-primary" />
            Travel Goals
          </CardTitle>
          <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Set a Travel Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Goal Title</Label>
                  <Input 
                    placeholder="e.g., Visit 10 new countries this year"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>What do you want to track?</Label>
                  <Select value={newGoal.goal_type} onValueChange={(v) => setNewGoal({ ...newGoal, goal_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newGoal.goal_type && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {metrics[newGoal.goal_type as keyof typeof metrics] || 0} • {getGoalTypeInfo(newGoal.goal_type)?.description}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Target</Label>
                  <Input 
                    type="number" 
                    min={1}
                    value={newGoal.target_count}
                    onChange={(e) => setNewGoal({ ...newGoal, target_count: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Deadline (optional)</Label>
                  <Input 
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddGoal} className="w-full" disabled={!newGoal.title}>
                  Create Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-6">
              <Milestone className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No goals yet. Set your first travel goal!
              </p>
              <div className="mt-4 text-xs text-muted-foreground">
                <p className="font-medium mb-2">Track things like:</p>
                <div className="grid grid-cols-2 gap-1">
                  {GOAL_TYPES.slice(0, 6).map(type => (
                    <div key={type.value} className="flex items-center gap-1">
                      <type.icon className="h-3 w-3" />
                      <span>{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = Math.min(getGoalProgress(goal), 100);
                const current = getGoalCurrent(goal);
                const goalTypeInfo = getGoalTypeInfo(goal.goal_type);
                const GoalIcon = goalTypeInfo?.icon || Target;
                
                return (
                  <div key={goal.id} className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-primary/10 rounded">
                          <GoalIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{goal.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {current} / {goal.target_count} {goalTypeInfo?.label.toLowerCase() || goal.goal_type}
                            {goal.deadline && ` • Due ${format(new Date(goal.deadline), 'MMM d, yyyy')}`}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <Progress value={progress} className="h-2" />
                    {progress >= 100 && (
                      <p className="text-xs text-accent mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Goal completed!
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AchievementsGoals;
