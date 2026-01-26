import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTrips } from "@/hooks/useTrips";
import { useTripCountries } from "@/hooks/useTripCountries";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { TripBasicsStep } from "./wizard/TripBasicsStep";
import { KidsStep } from "./wizard/KidsStep";
import { InterestsStep } from "./wizard/InterestsStep";
import { PreferencesStep } from "./wizard/PreferencesStep";
import { ReviewStep } from "./wizard/ReviewStep";
import { PlannerModeStep, type ClientInfo } from "./wizard/PlannerModeStep";
import { ContextStep } from "./wizard/ContextStep";
import { useTravelProfiles } from "@/hooks/useTravelProfiles";
import type { CountryOption } from "@/lib/countriesData";

export interface TripFormData {
  title: string;
  destination: string;
  countries: CountryOption[]; // NEW: Multi-country support
  startDate: string;
  endDate: string;
  hasDates: boolean;
  hasLodging: boolean;
  travelingWithKids: boolean;
  kidsAges: number[];
  interests: string[];
  pacePreference: string;
  budgetLevel: string;
  lodgingLocation: string;
  napSchedule: string;
  strollerNeeds: boolean;
  tripPurpose: string; // "leisure" | "business" | "mixed"
  // New fields for planner mode
  plannerMode: 'personal' | 'planner';
  clientInfo: ClientInfo;
  extraContext: string;
  // Booking preferences
  providerPreferences: string[];
  // Accessibility
  needsWheelchairAccess: boolean;
  hasStroller: boolean;
  // Pre-selected member IDs from Quick Add
  preselectedMemberIds?: string[];
}

const STEPS = [
  { id: 1, title: "Mode", description: "Who's this for?" },
  { id: 2, title: "Basics", description: "Where & when" },
  { id: 3, title: "Kids", description: "Ages & needs" },
  { id: 4, title: "Interests", description: "What you love" },
  { id: 5, title: "Preferences", description: "Your style" },
  { id: 6, title: "Context", description: "Extra details" },
  { id: 7, title: "Generate", description: "Create itinerary" },
];

const TripWizard = () => {
  const navigate = useNavigate();
  const { createTrip } = useTrips();
  const { addTripCountries } = useTripCountries();
  const { profiles, activeProfile } = useTravelProfiles();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  // AbortController to cancel hanging requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [formData, setFormData] = useState<TripFormData>({
    title: "",
    destination: "",
    countries: [], // NEW: Initialize empty
    startDate: "",
    endDate: "",
    hasDates: true,
    hasLodging: false,
    travelingWithKids: true,
    kidsAges: [],
    interests: [],
    pacePreference: "moderate",
    budgetLevel: "moderate",
    lodgingLocation: "",
    napSchedule: "",
    strollerNeeds: false,
    tripPurpose: "leisure",
    // New fields
    plannerMode: 'personal',
    clientInfo: {
      numAdults: 2,
      numKids: 0,
      kidsAges: [],
      homeAirport: '',
      budgetRange: 'moderate',
      profileId: null,
    },
    extraContext: "",
    providerPreferences: [],
    // Accessibility
    needsWheelchairAccess: false,
    hasStroller: false,
  });

  // Check for pre-selected country from AddCountryModal
  useEffect(() => {
    const stored = sessionStorage.getItem('tripPreselectedCountry');
    if (stored) {
      try {
        const { country, memberIds } = JSON.parse(stored);
        if (country) {
          setFormData(prev => ({
            ...prev,
            countries: [country],
            destination: country.name,
            preselectedMemberIds: memberIds || [],
          }));
        }
        sessionStorage.removeItem('tripPreselectedCountry');
      } catch (e) {
        console.error('Error parsing preselected country:', e);
      }
    }
  }, []);

  const updateFormData = (updates: Partial<TripFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const progress = (currentStep / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Mode step - always can proceed
        return true;
      case 2:
        // Destination required, dates only if they said they have them
        if (!formData.destination) return false;
        if (formData.hasDates && (!formData.startDate || !formData.endDate)) return false;
        return true;
      case 3:
        // Kids ages only required if traveling with kids
        if (formData.travelingWithKids && formData.kidsAges.length === 0) return false;
        return true;
      case 4:
        return formData.interests.length > 0;
      case 5:
        return formData.pacePreference && formData.budgetLevel;
      case 6:
        // Context step is optional
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    // Prevent double-submit
    if (isGenerating) {
      return;
    }
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setIsGenerating(true);
    
    try {
      // Generate title if not provided
      const countryNames = formData.countries.length > 0 
        ? formData.countries.map(c => c.name).join(" & ") 
        : formData.destination;
      const tripTitle = formData.title || `${countryNames} Family Trip`;
      
      // Determine kids ages based on mode
      const effectiveKidsAges = formData.plannerMode === 'planner' 
        ? formData.clientInfo.kidsAges 
        : formData.kidsAges;
      
      const effectiveBudget = formData.plannerMode === 'planner'
        ? formData.clientInfo.budgetRange
        : formData.budgetLevel;
      
      // Get active profile preferences if available
      const selectedProfile = formData.plannerMode === 'planner' && formData.clientInfo.profileId
        ? profiles.find(p => p.id === formData.clientInfo.profileId)
        : activeProfile;
      
      // First create the trip in the database
      const { data: trip, error: tripError } = await createTrip({
        title: tripTitle,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        kids_ages: effectiveKidsAges,
        interests: formData.interests,
        pace_preference: formData.pacePreference,
        status: 'planning',
        has_lodging_booked: formData.hasLodging,
        provider_preferences: formData.providerPreferences,
        needs_wheelchair_access: formData.needsWheelchairAccess,
        has_stroller: formData.hasStroller || formData.strollerNeeds,
      });

      if (tripError || !trip) {
        throw new Error(tripError?.message || 'Failed to create trip');
      }

      // Save trip countries to trip_countries table
      if (formData.countries.length > 0) {
        const { error: countriesError } = await addTripCountries(trip.id, formData.countries);
        if (countriesError) {
          logger.error('Error saving trip countries:', countriesError);
          // Non-critical error, continue
        }

        // Also ensure each country exists in the countries table for the user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const country of formData.countries) {
            // Check if country exists
            const { data: existingCountry } = await supabase
              .from("countries")
              .select("id")
              .eq("user_id", user.id)
              .eq("name", country.name)
              .maybeSingle();

            if (!existingCountry) {
              // Create the country
              await supabase
                .from("countries")
                .insert({
                  name: country.name,
                  flag: country.code,
                  continent: country.continent,
                  user_id: user.id
                });
            }
          }
        }
      }

      toast.info("Generating your personalized itinerary...");

      // Create timeout (2 minutes for AI generation)
      const TIMEOUT_MS = 120000; // 2 minutes
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      const timeoutPromise = new Promise<{ data: null; error: { message: string; code: string } }>((_, reject) => {
        timeoutId = setTimeout(() => {
          abortController.abort(); // Abort the request
          reject(new Error(JSON.stringify({ 
            error: 'Request timed out. The itinerary generation is taking longer than expected. Please try again.',
            code: 'TIMEOUT' 
          })));
        }, TIMEOUT_MS);
        timeoutRef.current = timeoutId;
      });

      // Call the edge function to generate itinerary with enhanced data
      // Race against timeout to prevent hanging
      const invokePromise = supabase.functions.invoke('generate-itinerary', {
        body: {
          destination: formData.destination,
          startDate: formData.startDate,
          endDate: formData.endDate,
          kidsAges: formData.travelingWithKids ? effectiveKidsAges : [],
          interests: formData.interests,
          pacePreference: selectedProfile?.pace || formData.pacePreference,
          budgetLevel: effectiveBudget,
          lodgingLocation: formData.lodgingLocation,
          napSchedule: formData.travelingWithKids ? formData.napSchedule : "",
          strollerNeeds: formData.travelingWithKids ? formData.strollerNeeds : false,
          tripPurpose: formData.tripPurpose,
          hasKids: (formData.travelingWithKids && effectiveKidsAges.length > 0) || 
                   (formData.plannerMode === 'planner' && formData.clientInfo.numKids > 0),
          // New fields
          plannerMode: formData.plannerMode,
          extraContext: formData.extraContext,
          clientInfo: formData.plannerMode === 'planner' ? formData.clientInfo : null,
          profilePreferences: selectedProfile ? {
            pace: selectedProfile.pace,
            budgetLevel: selectedProfile.budget_level,
            kidFriendlyPriority: selectedProfile.kid_friendly_priority,
            preferNonstop: selectedProfile.prefer_nonstop,
            maxStops: selectedProfile.max_stops,
          } : null,
          // Booking preferences
          hasLodgingBooked: formData.hasLodging,
          providerPreferences: formData.providerPreferences,
          // Accessibility preferences
          needsWheelchairAccess: formData.needsWheelchairAccess,
          hasStroller: formData.hasStroller || formData.strollerNeeds,
        },
      });

      const { data: itineraryData, error: itineraryError } = await Promise.race([
        invokePromise,
        timeoutPromise
      ]).catch((error) => {
        // Handle timeout or other promise rejections
        if (error?.message?.includes('TIMEOUT') || error?.message?.includes('timed out')) {
          return { 
            data: null, 
            error: { 
              message: JSON.stringify({ error: 'Request timed out. Please try again.', code: 'TIMEOUT' }),
              code: 'TIMEOUT'
            } 
          };
        }
        throw error;
      }) as { data: any; error: any };

      // Clear timeout if request completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutRef.current = null;
      }

      // Check if request was aborted
      if (abortController.signal.aborted) {
        throw new Error(JSON.stringify({ 
          error: 'Request was cancelled.', 
          code: 'ABORTED' 
        }));
      }

      if (itineraryError) {
        // Handle specific error codes with user-friendly messages
        let errorData: any = {};
        let errorCode: string | undefined;
        
        try {
          errorData = itineraryError.message ? JSON.parse(itineraryError.message) : {};
          errorCode = errorData.code;
        } catch (parseError) {
          // If parsing fails, use raw error message
          errorData = { error: itineraryError.message || 'Unknown error' };
        }
        
        switch (errorCode) {
          case 'TIMEOUT':
            toast.error("Request timed out. The itinerary generation is taking longer than expected. Please try again.");
            break;
          case 'RATE_LIMITED':
          case 'AI_RATE_LIMITED':
            toast.error("You're making requests too quickly. Please wait a moment and try again.");
            break;
          case 'CREDITS_EXHAUSTED':
            toast.error("AI credits are exhausted. Please add credits to continue.");
            break;
          case 'VALIDATION_ERROR':
            toast.error("Please check your trip details: " + (errorData.details?.[0] || "Invalid input"));
            break;
          default:
            // Check for HTTP status codes
            if (itineraryError.status === 401 || itineraryError.status === 403) {
              toast.error("Authentication error. Please sign in again.");
            } else if (itineraryError.status === 429) {
              toast.error("Too many requests. Please wait a moment and try again.");
            } else if (itineraryError.status >= 500) {
              toast.error("Server error. Please try again in a few moments.");
            } else {
              toast.error(errorData.error || "Failed to generate itinerary. Please try again.");
            }
        }
        throw new Error(errorData.error || 'Generation failed');
      }

      // Guard against undefined/null data
      if (!itineraryData || !itineraryData.itinerary) {
        throw new Error('Invalid response from server. Please try again.');
      }

      const { itinerary, meta } = itineraryData;
      
      // Guard against invalid itinerary structure
      if (!itinerary || typeof itinerary !== 'object') {
        throw new Error('Invalid itinerary data received from server.');
      }
      
      // Check if any days need regeneration
      if (meta?.daysNeedingRegeneration?.length > 0) {
        toast.warning(`Generated itinerary with ${meta.daysNeedingRegeneration.length} day(s) that may need regeneration.`);
      }

      // Save the itinerary days and items to the database
      // Use exact dates from formData to ensure date integrity
      if (itinerary?.days && Array.isArray(itinerary.days) && itinerary.days.length > 0) {
        // Guard against invalid start date
        if (!formData.startDate || typeof formData.startDate !== 'string') {
          throw new Error('Invalid trip start date. Please check your dates.');
        }
        
        for (const day of itinerary.days) {
          // Guard against invalid day data
          if (!day || typeof day !== 'object' || typeof day.dayNumber !== 'number') {
            logger.warn('Skipping invalid day data:', day);
            continue;
          }

          // Calculate exact date based on user's start date
          const dayDate = new Date(formData.startDate);
          if (isNaN(dayDate.getTime())) {
            logger.error('Invalid start date:', formData.startDate);
            throw new Error('Invalid trip start date. Please check your dates.');
          }
          dayDate.setDate(dayDate.getDate() + day.dayNumber - 1);
          const exactDate = dayDate.toISOString().split('T')[0];

          const { data: savedDay, error: dayError } = await supabase
            .from('itinerary_days')
            .insert({
              trip_id: trip.id,
              day_number: day.dayNumber,
              date: exactDate, // Always use calculated date, never AI's date
              title: day.title,
              notes: day.notes,
              weather_notes: day.weather_notes,
              plan_b: day.planB,
            })
            .select()
            .single();

          if (dayError) {
            logger.error('Error saving day:', dayError);
            // Continue with next day instead of failing entire generation
            continue;
          }

          // Save activities for this day with new booking fields
          if (day.activities && Array.isArray(day.activities) && savedDay) {
            const itemsToInsert = day.activities
              .filter((activity: any) => activity && activity.title) // Filter out invalid activities
              .map((activity: any, index: number) => ({
              itinerary_day_id: savedDay.id,
              sort_order: index,
              time_slot: activity.timeSlot,
              start_time: activity.startTime,
              end_time: activity.endTime,
              title: activity.title,
              description: activity.description,
              location_name: activity.locationName,
              location_address: activity.locationAddress,
              category: activity.category,
              duration_minutes: activity.durationMinutes,
              cost_estimate: activity.costEstimate,
              is_kid_friendly: activity.isKidFriendly,
              is_stroller_friendly: activity.isStrollerFriendly,
              requires_reservation: activity.requiresReservation,
              reservation_info: activity.reservationInfo,
              // New booking fields
              rating: activity.rating,
              review_count: activity.reviewCount,
              booking_url: activity.bookingUrl,
              provider_type: activity.providerType,
              why_it_fits: activity.whyItFits,
              best_time_to_visit: activity.bestTimeToVisit,
              crowd_level: activity.crowdLevel,
              seasonal_notes: activity.seasonalNotes,
              transport_mode: activity.transportMode,
              transport_booking_url: activity.transportBookingUrl,
              transport_station_notes: activity.transportStationNotes,
              latitude: activity.latitude,
              longitude: activity.longitude,
              // Distance and accessibility fields
              distance_from_previous: activity.distanceFromPrevious,
              distance_unit: activity.distanceUnit || 'km',
              travel_time_minutes: activity.travelTimeMinutes,
              recommended_transit_mode: activity.recommendedTransitMode,
              transit_details: activity.transitDetails,
              accessibility_notes: activity.accessibilityNotes,
              is_wheelchair_accessible: activity.isWheelchairAccessible,
              stroller_notes: activity.strollerNotes,
            }));

            const { error: itemsError } = await supabase
              .from('itinerary_items')
              .insert(itemsToInsert);

            if (itemsError) {
              logger.error('Error saving items:', itemsError);
              // Non-critical, continue with other days
            }
          }
        }
      }

      // Save lodging suggestions if provided and lodging not booked
      if (itinerary?.lodgingSuggestions && Array.isArray(itinerary.lodgingSuggestions) && !formData.hasLodging) {
        const lodgingToInsert = itinerary.lodgingSuggestions
          .filter((lodging: any) => lodging && lodging.name) // Filter out invalid lodging
          .map((lodging: any) => ({
          trip_id: trip.id,
          name: lodging.name,
          lodging_type: lodging.lodgingType,
          address: lodging.address,
          description: lodging.description,
          price_per_night: lodging.pricePerNight,
          currency: lodging.currency,
          rating: lodging.rating,
          review_count: lodging.reviewCount,
          booking_url: lodging.bookingUrl,
          is_kid_friendly: lodging.isKidFriendly,
          amenities: lodging.amenities,
          distance_from_center: lodging.distanceFromCenter,
          why_recommended: lodging.whyRecommended,
          latitude: lodging.latitude,
          longitude: lodging.longitude,
        }));

        const { error: lodgingError } = await supabase
          .from('trip_lodging_suggestions')
          .insert(lodgingToInsert);

        if (lodgingError) {
          logger.error('Error saving lodging suggestions:', lodgingError);
          // Non-critical, continue
        }
      }

      // Save train segments if provided
      if (itinerary?.trainSegments && Array.isArray(itinerary.trainSegments)) {
        const trainToInsert = itinerary.trainSegments
          .filter((train: any) => train && train.originCity && train.destinationCity) // Filter out invalid segments
          .map((train: any) => ({
          trip_id: trip.id,
          origin_city: train.originCity,
          origin_station: train.originStation,
          origin_station_alternatives: train.originStationAlternatives,
          destination_city: train.destinationCity,
          destination_station: train.destinationStation,
          destination_station_alternatives: train.destinationStationAlternatives,
          departure_date: train.departureDate,
          departure_time: train.departureTime,
          arrival_time: train.arrivalTime,
          duration_minutes: train.durationMinutes,
          train_type: train.trainType,
          booking_url: train.bookingUrl,
          price_estimate: train.priceEstimate,
          currency: train.currency,
          station_guidance: train.stationGuidance,
          station_warning: train.stationWarning,
          itinerary_day_id: train.itineraryDayId,
        }));

        const { error: trainError } = await supabase
          .from('trip_train_segments')
          .insert(trainToInsert);

        if (trainError) {
          logger.error('Error saving train segments:', trainError);
          // Non-critical, continue
        }
      }

      toast.success("Itinerary generated successfully!");
      navigate(`/trips/${trip.id}`);
      
    } catch (error: any) {
      logger.error('Error generating itinerary:', error);
      
      // Error already shown via toast above for known errors
      if (!error?.message?.includes('Generation failed') && !error?.message?.includes('TIMEOUT')) {
        // Only show generic error if we haven't shown a specific one
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        if (!errorMessage.includes('timed out') && !errorMessage.includes('RATE_LIMITED') && 
            !errorMessage.includes('CREDITS_EXHAUSTED') && !errorMessage.includes('VALIDATION_ERROR')) {
          toast.error("Something went wrong. Please try again.");
        }
      }
    } finally {
      // Always ensure loading state is cleared
      setIsGenerating(false);
      
      // Clean up timeout and abort controller
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      abortControllerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PlannerModeStep 
            mode={formData.plannerMode}
            clientInfo={formData.clientInfo}
            onModeChange={(mode) => updateFormData({ plannerMode: mode })}
            onClientInfoChange={(clientInfo) => updateFormData({ clientInfo })}
          />
        );
      case 2:
        return <TripBasicsStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <KidsStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <InterestsStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <PreferencesStep formData={formData} updateFormData={updateFormData} />;
      case 6:
        return (
          <ContextStep 
            extraContext={formData.extraContext}
            onChange={(value) => updateFormData({ extraContext: value })}
          />
        );
      case 7:
        return <ReviewStep formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`text-center flex-1 ${
                step.id === currentStep
                  ? "text-primary font-medium"
                  : step.id < currentStep
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
              }`}
            >
              <div className="text-xs sm:text-sm">{step.title}</div>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? () => navigate("/trips") : handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Itinerary
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TripWizard;