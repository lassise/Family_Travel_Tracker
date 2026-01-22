import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe, ArrowRight, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HeroSummaryCard from "@/components/travel/HeroSummaryCard";
import InteractiveWorldMap from "@/components/travel/InteractiveWorldMap";
import TravelMilestones from "@/components/travel/TravelMilestones";
import PublicPhotoGallery from "@/components/travel/PublicPhotoGallery";

// Types for the Edge Function response
interface DebugInfo {
  token_normalized: string;
  token_found: boolean;
  token_source: string;
  owner_user_id: string | null;
  owner_found: boolean;
  blocked_by_rls: boolean;
  query_steps: string[];
  query_counts: {
    visitedCountries: number;
    visitedContinents: number;
    visitedStates: number;
    wishlistCountries: number;
    memories: number;
  };
  failures: string[];
}

interface ShareSettings {
  show_stats: boolean;
  show_map: boolean;
  show_countries: boolean;
  show_photos: boolean;
  show_timeline: boolean;
  show_family_members: boolean;
  show_achievements: boolean;
  show_wishlist: boolean;
}

interface OwnerInfo {
  displayName: string;
  avatarUrl: string | null;
  homeCountry: string | null;
}

interface Country {
  id: string;
  name: string;
  flag: string;
  continent: string;
  visitedBy: string[];
}

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  color: string;
  countriesVisited: number;
}

interface VisitDetail {
  id: string;
  country_id: string;
  visit_date: string | null;
  approximate_year: number | null;
  approximate_month: number | null;
  is_approximate: boolean | null;
  trip_name: string | null;
  highlight: string | null;
}

interface StateVisit {
  id: string;
  country_id: string;
  country_code: string;
  state_code: string;
  state_name: string;
  family_member_id: string;
  created_at: string;
}

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  country_id: string | null;
  taken_at: string | null;
}

interface Stats {
  visitedCountriesCount: number;
  visitedContinentsCount: number;
  visitedStatesCount: number;
  wishlistCountriesCount: number;
  memoriesCount: number;
  earliestYear: number | null;
}

interface DashboardData {
  shareSettings: ShareSettings;
  owner: OwnerInfo;
  countries: Country[];
  familyMembers: FamilyMember[];
  visitDetails: VisitDetail[];
  visitMembers: { visit_id: string; family_member_id: string }[];
  stateVisits: StateVisit[];
  wishlist: string[];
  photos: Photo[];
  stats: Stats;
}

interface EdgeFunctionResponse {
  ok: boolean;
  error?: string;
  debug: DebugInfo;
  data?: DashboardData;
}

const PublicDashboard = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const showDebug = searchParams.get("debug") === "1";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Invalid dashboard link");
        setLoading(false);
        return;
      }

      try {
        // Make exactly ONE request to the Edge Function
        const { data: response, error: invokeError } = await supabase.functions.invoke<EdgeFunctionResponse>(
          "get-public-dashboard",
          { body: { token } }
        );

        if (invokeError) {
          console.error("PublicDashboard: Edge function invoke error", invokeError);
          setError("Failed to load dashboard");
          setLoading(false);
          return;
        }

        if (!response) {
          console.error("PublicDashboard: No response from edge function");
          setError("Failed to load dashboard");
          setLoading(false);
          return;
        }

        // Always capture debug info
        setDebug(response.debug);

        if (!response.ok) {
          console.error("PublicDashboard: Edge function returned error", {
            error: response.error,
            debug: response.debug,
          });
          setError(response.error || "Dashboard not found or is private");
          setLoading(false);
          return;
        }

        if (!response.data) {
          console.error("PublicDashboard: Edge function returned ok=true but no data");
          setError("Dashboard data unavailable");
          setLoading(false);
          return;
        }

        setData(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error("PublicDashboard: Unexpected error", err);
        setError("Failed to load dashboard");
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Build visit member map for HeroSummaryCard
  const visitMemberMap = useMemo(() => {
    if (!data) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    data.visitMembers.forEach((item) => {
      if (item.visit_id && item.family_member_id) {
        const existing = map.get(item.visit_id) || [];
        if (!existing.includes(item.family_member_id)) {
          existing.push(item.family_member_id);
          map.set(item.visit_id, existing);
        }
      }
    });
    return map;
  }, [data]);

  // Calculate visited countries (those with visitedBy.length > 0)
  const visitedCountries = useMemo(() => {
    if (!data) return [];
    return data.countries.filter((c) => c.visitedBy.length > 0);
  }, [data]);

  // Calculate total continents
  const totalContinents = useMemo(() => {
    return new Set(visitedCountries.map((c) => c.continent)).size;
  }, [visitedCountries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Oops!</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Want to track your family's adventures?
              </p>
              <Link to="/auth">
                <Button className="w-full">
                  Sign up for Family Travel Tracker — it's free!
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Debug panel on error */}
        {showDebug && debug && (
          <Card className="max-w-2xl w-full mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Debug Information</h3>
              </div>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(debug, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { shareSettings, owner, countries, familyMembers, visitDetails, stateVisits, photos, stats } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* CTA Banner for non-users */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-medium text-foreground">
                Want to track your family's adventures?
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Sign up for Family Travel Tracker for free
              </p>
            </div>
            <Link to="/auth">
              <Button size="sm" className="whitespace-nowrap">
                Sign Up Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {owner.displayName}'s Travel Dashboard
          </h1>
          <p className="text-muted-foreground">
            Explore their family's adventures and travel statistics.
          </p>
        </div>

        {/* Hero Summary - Countries Visited Overview */}
        {shareSettings.show_stats && (
          <div className="mb-8">
            <HeroSummaryCard
              countries={countries}
              familyMembers={familyMembers}
              totalContinents={totalContinents}
              homeCountry={owner.homeCountry}
              earliestYear={stats.earliestYear}
              visitMemberMap={visitMemberMap}
              selectedMemberId={null}
              filterComponent={
                familyMembers.length > 1 ? (
                  <div className="text-sm text-muted-foreground">
                    Viewing all members
                  </div>
                ) : undefined
              }
            />
          </div>
        )}

        {/* Interactive World Map */}
        {shareSettings.show_map && (
          <div className="mb-8">
            <InteractiveWorldMap
              countries={countries}
              wishlist={data.wishlist}
              homeCountry={owner.homeCountry}
              onRefetch={() => {}}
              selectedMemberId={null}
              readOnly
              stateVisitsOverride={stateVisits}
            />
          </div>
        )}

        {/* Travel Milestones */}
        {shareSettings.show_achievements && (
          <div className="mb-8">
            <TravelMilestones
              countries={countries}
              familyMembers={familyMembers}
              totalContinents={totalContinents}
            />
          </div>
        )}

        {/* Memories Section - Timeline and Photos */}
        {(shareSettings.show_timeline || shareSettings.show_photos) && (
          <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-semibold">Memories</h2>

            {/* Public Timeline (read-only) */}
            {shareSettings.show_timeline && visitDetails.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {visitDetails.slice(0, 25).map((v) => {
                      const country = countries.find((c) => c.id === v.country_id);
                      const title = country?.name || "Unknown";
                      const dateLabel = v.visit_date
                        ? new Date(v.visit_date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                          })
                        : v.approximate_year
                          ? `${v.approximate_month ? `${v.approximate_month}/` : ""}${v.approximate_year}`
                          : "";

                      return (
                        <div
                          key={v.id}
                          className="flex items-start justify-between gap-4 border-b last:border-b-0 pb-3 last:pb-0"
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">{title}</p>
                            {v.trip_name && (
                              <p className="text-sm text-muted-foreground truncate">
                                {v.trip_name}
                              </p>
                            )}
                            {v.highlight && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {v.highlight}
                              </p>
                            )}
                          </div>
                          {dateLabel && (
                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                              {dateLabel}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {visitDetails.length > 25 && (
                      <p className="text-xs text-muted-foreground">
                        Showing the latest 25 visits.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Photo Gallery */}
            {shareSettings.show_photos && (
              <PublicPhotoGallery countries={countries} photos={photos} />
            )}
          </div>
        )}

        {/* Bottom CTA */}
        <Card className="bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-primary/20">
          <CardContent className="py-8 text-center">
            <Globe className="h-10 w-10 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Start Your Own Travel Journey
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Track your family's adventures, discover new destinations, and
              create lasting memories together.
            </p>
            <Link to="/auth">
              <Button size="lg">
                Sign Up for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Debug panel */}
        {showDebug && debug && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Debug Information</h3>
              </div>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(debug, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicDashboard;
