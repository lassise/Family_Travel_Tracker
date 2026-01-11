import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Users, Check, X, MapPin, Calendar } from "lucide-react";

interface TripInvite {
  id: string;
  trip_id: string;
  permission: string;
  created_at: string;
  trip: {
    title: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  inviter: {
    full_name: string | null;
    email: string | null;
  };
}

interface PendingInvitesCardProps {
  onAccepted?: () => void;
}

const PendingInvitesCard = ({ onAccepted }: PendingInvitesCardProps) => {
  const { user, profile } = useAuth();
  const [invites, setInvites] = useState<TripInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile?.email) {
      fetchInvites();
    }
  }, [user, profile?.email]);

  const fetchInvites = async () => {
    if (!profile?.email) return;
    
    try {
      const { data, error } = await supabase
        .from("trip_collaborators")
        .select(`
          id,
          trip_id,
          permission,
          created_at,
          trip:trips!trip_collaborators_trip_id_fkey (
            title,
            destination,
            start_date,
            end_date
          ),
          inviter:profiles!trip_collaborators_invited_by_fkey (
            full_name,
            email
          )
        `)
        .eq("status", "pending")
        .or(`user_id.eq.${user?.id},invited_email.eq.${profile.email}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites((data as any) || []);
    } catch (error) {
      console.error("Error fetching invites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setResponding(inviteId);
    try {
      const { error } = await supabase
        .from("trip_collaborators")
        .update({
          status: accept ? "accepted" : "declined",
          accepted_at: accept ? new Date().toISOString() : null,
          user_id: user?.id, // Link to user account if invited by email
        })
        .eq("id", inviteId);

      if (error) throw error;
      
      toast.success(accept ? "Invitation accepted!" : "Invitation declined");
      fetchInvites();
      
      if (accept && onAccepted) {
        onAccepted();
      }
    } catch (error) {
      console.error("Error responding:", error);
      toast.error("Failed to respond to invitation");
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading || invites.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Trip Invitations
        </CardTitle>
        <CardDescription>
          You've been invited to collaborate on {invites.length} trip{invites.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-background rounded-lg border"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{invite.trip?.title}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                {invite.trip?.destination && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {invite.trip.destination}
                  </span>
                )}
                {invite.trip?.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(invite.trip.start_date)}
                    {invite.trip.end_date && ` - ${formatDate(invite.trip.end_date)}`}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From: {invite.inviter?.full_name || invite.inviter?.email}
                <Badge variant="secondary" className="ml-2 text-xs capitalize">
                  {invite.permission} access
                </Badge>
              </p>
            </div>
            
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRespond(invite.id, false)}
                disabled={responding === invite.id}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleRespond(invite.id, true)}
                disabled={responding === invite.id}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PendingInvitesCard;
