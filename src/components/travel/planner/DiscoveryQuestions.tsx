import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { ChevronRight, ChevronLeft, Sparkles, Plane, Mountain, Building2, Palette, Utensils, TreePine, Waves, Users } from "lucide-react";

export interface DiscoveryAnswers {
  tripPurpose: string;
  tripType: string[];
  flexibility: number;
  travelDistance: string;
  travelingWithKids: boolean;
  kidsAges: number[];
  pace: string;
  budget: string;
}

interface DiscoveryQuestionsProps {
  onComplete: (answers: DiscoveryAnswers) => void;
  onCancel: () => void;
  existingPreferences?: {
    travel_style?: string[];
    interests?: string[];
    budget_preference?: string;
    pace_preference?: string;
  } | null;
  familyMembers?: Array<{ name: string; role: string }>;
}

const TRIP_TYPES = [
  { id: "nature", label: "Nature & Outdoors", icon: TreePine },
  { id: "city", label: "City Exploration", icon: Building2 },
  { id: "beach", label: "Beach & Relaxation", icon: Waves },
  { id: "cultural", label: "Cultural & Historical", icon: Palette },
  { id: "adventure", label: "Adventure & Active", icon: Mountain },
  { id: "food", label: "Food & Culinary", icon: Utensils },
];

const DiscoveryQuestions = ({ 
  onComplete, 
  onCancel, 
  existingPreferences,
  familyMembers 
}: DiscoveryQuestionsProps) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DiscoveryAnswers>({
    tripPurpose: "",
    tripType: existingPreferences?.interests?.slice(0, 2) || [],
    flexibility: 50,
    travelDistance: "moderate",
    travelingWithKids: familyMembers?.some(m => m.role.toLowerCase().includes("child") || m.role.toLowerCase().includes("kid")) || false,
    kidsAges: [],
    pace: existingPreferences?.pace_preference || "moderate",
    budget: existingPreferences?.budget_preference || "moderate",
  });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else onComplete(answers);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else onCancel();
  };

  const toggleTripType = (type: string) => {
    setAnswers(prev => ({
      ...prev,
      tripType: prev.tripType.includes(type)
        ? prev.tripType.filter(t => t !== type)
        : [...prev.tripType, type].slice(0, 3)
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">What's the main purpose of this trip?</Label>
            <RadioGroup
              value={answers.tripPurpose}
              onValueChange={(val) => setAnswers({ ...answers, tripPurpose: val })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="escape" id="escape" />
                <Label htmlFor="escape" className="cursor-pointer flex-1">Just need to get away and relax</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="explore" id="explore" />
                <Label htmlFor="explore" className="cursor-pointer flex-1">Want to explore somewhere new</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="experience" id="experience" />
                <Label htmlFor="experience" className="cursor-pointer flex-1">Looking for a specific experience</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="family" id="family" />
                <Label htmlFor="family" className="cursor-pointer flex-1">Quality time with family</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">What type of experience are you looking for? (Pick up to 3)</Label>
            <div className="grid grid-cols-2 gap-2">
              {TRIP_TYPES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleTripType(id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                    answers.tripType.includes(id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">How flexible are you with the destination?</Label>
              <Slider
                value={[answers.flexibility]}
                onValueChange={([val]) => setAnswers({ ...answers, flexibility: val })}
                min={0}
                max={100}
                step={25}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Specific place in mind</span>
                <span>Completely open</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">How far are you willing to travel?</Label>
              <RadioGroup
                value={answers.travelDistance}
                onValueChange={(val) => setAnswers({ ...answers, travelDistance: val })}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="short" id="short" />
                  <Label htmlFor="short" className="cursor-pointer flex-1">Short flight (under 4 hours)</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="cursor-pointer flex-1">Medium distance (4-8 hours)</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="anywhere" id="anywhere" />
                  <Label htmlFor="anywhere" className="cursor-pointer flex-1">Anywhere in the world</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="withKids"
                  checked={answers.travelingWithKids}
                  onCheckedChange={(checked) => setAnswers({ ...answers, travelingWithKids: !!checked })}
                />
                <Label htmlFor="withKids" className="text-base font-medium cursor-pointer">
                  Traveling with children
                </Label>
              </div>
              {answers.travelingWithKids && (
                <div className="ml-6 space-y-2">
                  <Label className="text-sm text-muted-foreground">Select ages (tap to toggle)</Label>
                  <div className="flex flex-wrap gap-2">
                    {[0, 2, 4, 6, 8, 10, 12, 14, 16].map(age => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => {
                          setAnswers(prev => ({
                            ...prev,
                            kidsAges: prev.kidsAges.includes(age)
                              ? prev.kidsAges.filter(a => a !== age)
                              : [...prev.kidsAges, age]
                          }));
                        }}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          answers.kidsAges.includes(age)
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        {age === 0 ? "Infant" : `${age}+`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Preferred pace?</Label>
              <RadioGroup
                value={answers.pace}
                onValueChange={(val) => setAnswers({ ...answers, pace: val })}
                className="flex gap-2"
              >
                {["slow", "moderate", "fast"].map(pace => (
                  <div key={pace} className="flex-1">
                    <RadioGroupItem value={pace} id={`pace-${pace}`} className="sr-only" />
                    <Label
                      htmlFor={`pace-${pace}`}
                      className={`block text-center p-3 rounded-lg border cursor-pointer capitalize ${
                        answers.pace === pace ? "bg-primary text-primary-foreground" : "hover:bg-accent/50"
                      }`}
                    >
                      {pace}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">What's your budget level for this trip?</Label>
            <RadioGroup
              value={answers.budget}
              onValueChange={(val) => setAnswers({ ...answers, budget: val })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="budget" id="budget" />
                <Label htmlFor="budget" className="cursor-pointer flex-1">
                  <span className="font-medium">Budget-friendly</span>
                  <span className="text-sm text-muted-foreground block">Hostels, street food, public transport</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="moderate" id="moderate-budget" />
                <Label htmlFor="moderate-budget" className="cursor-pointer flex-1">
                  <span className="font-medium">Moderate</span>
                  <span className="text-sm text-muted-foreground block">Nice hotels, good restaurants</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="luxury" id="luxury" />
                <Label htmlFor="luxury" className="cursor-pointer flex-1">
                  <span className="font-medium">Luxury</span>
                  <span className="text-sm text-muted-foreground block">Premium experiences, top-tier accommodations</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!answers.tripPurpose;
      case 1: return answers.tripType.length > 0;
      case 2: return !!answers.travelDistance;
      case 3: return true;
      case 4: return !!answers.budget;
      default: return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-yellow-500" />
        <span className="font-medium">Help me find a destination</span>
        <span className="text-xs text-muted-foreground ml-auto">Step {step + 1} of 5</span>
      </div>

      <div className="flex gap-1 mb-4">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      {renderStep()}

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
          {step === 4 ? "Get Recommendations" : "Next"}
          {step < 4 && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
};

export default DiscoveryQuestions;
