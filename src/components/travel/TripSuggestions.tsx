import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Country } from '@/hooks/useFamilyData';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, MapPin, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TripSuggestionsProps {
  countries: Country[];
  wishlist: string[];
}

interface Suggestion {
  country: string;
  reason: string;
  highlights: string[];
}

const TripSuggestions = ({ countries, wishlist }: TripSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const visitedCountries = countries.filter(c => c.visitedBy.length > 0);
  const wishlistCountries = countries.filter(c => wishlist.includes(c.id));

  const generateSuggestions = async () => {
    setIsLoading(true);
    
    try {
      const visitedNames = visitedCountries.map(c => c.name);
      const wishlistNames = wishlistCountries.map(c => c.name);
      const visitedContinents = [...new Set(visitedCountries.map(c => c.continent))];

      const response = await supabase.functions.invoke('generate-trip-suggestions', {
        body: {
          visitedCountries: visitedNames,
          wishlistCountries: wishlistNames,
          visitedContinents,
        },
      });

      if (response.data?.suggestions) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback suggestions based on wishlist
      if (wishlistCountries.length > 0) {
        setSuggestions(wishlistCountries.slice(0, 3).map(c => ({
          country: c.name,
          reason: 'On your wishlist!',
          highlights: ['Rich culture', 'Unique experiences', 'Beautiful landscapes'],
        })));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Generate initial suggestions based on wishlist
    if (wishlistCountries.length > 0) {
      setSuggestions(wishlistCountries.slice(0, 3).map(c => ({
        country: `${c.flag} ${c.name}`,
        reason: "You've added this to your travel wishlist",
        highlights: ['Explore local culture', 'Try local cuisine', 'Visit famous landmarks'],
      })));
    }
  }, [wishlist]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          Trip Suggestions
        </CardTitle>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={generateSuggestions}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-1" />
              Get AI Suggestions
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Add countries to your wishlist to get personalized suggestions!</p>
            <p className="text-sm mt-2">Or click "Get AI Suggestions" for smart recommendations.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="bg-muted/50 rounded-lg p-4 hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-foreground">{suggestion.country}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{suggestion.reason}</p>
                <div className="space-y-1 mb-4">
                  {suggestion.highlights.map((highlight, i) => (
                    <span 
                      key={i}
                      className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded mr-1"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                  onClick={() => navigate('/trips/new')}
                >
                  Plan Trip
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TripSuggestions;
