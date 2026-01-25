import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, Zap, MapPin, HelpCircle } from "lucide-react";
import { useTravelPreferences } from "@/hooks/useTravelPreferences";
import { useFamilyData } from "@/hooks/useFamilyData";
import { useTrips } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DiscoveryQuestions, { DiscoveryAnswers } from "./planner/DiscoveryQuestions";
import DestinationRecommendations, { DestinationRecommendation } from "./planner/DestinationRecommendations";
import ItineraryDisplay, { QuickItinerary } from "./planner/ItineraryDisplay";

type PlannerMode = "input" | "discovery" | "recommendations" | "itinerary";

const QuickAIPlanner = () => {
  const { preferences } = useTravelPreferences();
  const { familyMembers, countries } = useFamilyData();
  const { createTrip } = useTrips();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<PlannerMode>("input");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState([5]);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<QuickItinerary | null>(null);
  const [recommendations, setRecommendations] = useState<DestinationRecommendation[]>([]);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<DiscoveryAnswers | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const visitedCountries = countries.filter(c => c.visitedBy.length > 0).map(c => c.name);

  const generateItinerary = async (dest?: string) => {
    const targetDestination = dest || destination.trim();
    if (!targetDestination) {
      toast({ title: "Please enter a destination", variant: "destructive" });
      return;
    }

    setLoading(true);
    setMode("itinerary");
    try {
      const { data, error } = await supabase.functions.invoke("generate-trip-suggestions", {
        body: {
          request_type: "quick_itinerary",
          destination: targetDestination,
          days: days[0],
          preferences: preferences ? {
            travel_style: preferences.travel_style,
            interests: preferences.interests,
            budget: preferences.budget_preference,
            pace: preferences.pace_preference,
          } : null,
        },
      });

      if (error) throw error;

      if (data?.days) {
        setItinerary(data);
        setDestination(targetDestination);
        setIsSaved(false);
      } else {
        toast({ title: "Could not generate itinerary", variant: "destructive" });
        setMode("input");
      }
    } catch (error) {
      console.error("Error generating itinerary:", error);
      toast({ title: "Failed to generate itinerary", variant: "destructive" });
      setMode("input");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoveryComplete = async (answers: DiscoveryAnswers) => {
    setDiscoveryAnswers(answers);
    setLoading(true);
    setMode("recommendations");

    try {
      const { data, error } = await supabase.functions.invoke("generate-trip-suggestions", {
        body: {
          request_type: "discover_destinations",
          discovery_answers: answers,
          visited_countries: visitedCountries,
          preferences: preferences ? {
            travel_style: preferences.travel_style,
            interests: preferences.interests,
            liked_countries: preferences.liked_countries,
            disliked_countries: preferences.disliked_countries,
          } : null,
        },
      });

      if (error) throw error;

      if (data?.recommendations?.length > 0) {
        setRecommendations(data.recommendations);
      } else {
        toast({ title: "Could not generate recommendations", variant: "destructive" });
        setMode("input");
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({ title: "Failed to generate recommendations", variant: "destructive" });
      setMode("input");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDestination = (dest: string) => {
    setDestination(dest);
    generateItinerary(dest);
  };

  const handleSaveTrip = async () => {
    if (!itinerary) return;
    
    setIsSaving(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days[0] - 1);

      const { error } = await createTrip({
        title: `${itinerary.destination} Trip`,
        destination: itinerary.destination,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: "planning",
        notes: itinerary.summary,
        pace_preference: discoveryAnswers?.pace || preferences?.pace_preference || "moderate",
      });

      if (error) throw error;

      setIsSaved(true);
      toast({ title: "Trip saved!", description: "You can find it in your Trips section." });
    } catch (error) {
      console.error("Error saving trip:", error);
      toast({ title: "Failed to save trip", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setItinerary(null);
    setIsSaved(false);
    setMode("input");
    toast({ title: "Plan deleted" });
  };

  const handleRegenerate = () => {
    if (destination) {
      generateItinerary(destination);
    }
  };

  const handleRegenerateRecommendations = () => {
    if (discoveryAnswers) {
      handleDiscoveryComplete(discoveryAnswers);
    }
  };

  const resetPlanner = () => {
    setItinerary(null);
    setRecommendations([]);
    setDiscoveryAnswers(null);
    setDestination("");
    setDays([5]);
    setIsSaved(false);
    setMode("input");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick AI Planner
        </CardTitle>
        <CardDescription>
          Get an instant itinerary based on your preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mode === "input" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="destination">Where do you want to go?</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Tokyo, Paris, Bali..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Trip Duration</Label>
                <span className="text-sm font-medium">{days[0]} days</span>
              </div>
              <Slider
                value={days}
                onValueChange={setDays}
                min={1}
                max={14}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Weekend</span>
                <span>Week</span>
                <span>2 Weeks</span>
              </div>
            </div>

            {preferences && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground mb-2">Using your preferences:</p>
                <div className="flex flex-wrap gap-1">
                  {preferences.travel_style.slice(0, 3).map((style) => (
                    <span key={style} className="px-2 py-0.5 bg-primary/10 rounded text-xs">
                      {style}
                    </span>
                  ))}
                  {preferences.interests.slice(0, 3).map((interest) => (
                    <span key={interest} className="px-2 py-0.5 bg-secondary/50 rounded text-xs">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={() => generateItinerary()}
                disabled={loading || !destination.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Itinerary
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setMode("discovery")}
                className="w-full"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                I don't know where I want to go
              </Button>
            </div>
          </div>
        )}

        {mode === "discovery" && (
          <DiscoveryQuestions
            onComplete={handleDiscoveryComplete}
            onCancel={resetPlanner}
            existingPreferences={preferences}
            familyMembers={familyMembers}
          />
        )}

        {mode === "recommendations" && (
          <DestinationRecommendations
            recommendations={recommendations}
            loading={loading}
            onSelect={handleSelectDestination}
            onRegenerate={handleRegenerateRecommendations}
            onBack={resetPlanner}
          />
        )}

        {mode === "itinerary" && loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Creating your perfect itinerary...</p>
          </div>
        )}

        {mode === "itinerary" && !loading && itinerary && (
          <ItineraryDisplay
            itinerary={itinerary}
            onDelete={handleDelete}
            onSave={handleSaveTrip}
            onRegenerate={handleRegenerate}
            onNewPlan={resetPlanner}
            isSaving={isSaving}
            isSaved={isSaved}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default QuickAIPlanner;
