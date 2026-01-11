import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Users, UserPlus, Trash2, Mail, Clock, Check, X, Eye, MessageSquare, Edit } from "lucide-react";

interface Collaborator {
  id: string;
  trip_id: string;
  user_id: string | null;
  invited_email: string | null;
  permission: "view" | "comment" | "edit";
  status: "pending" | "accepted" | "declined";
  created_at: string;
  accepted_at: string | null;
  invited_by: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

interface TripCollaboratorsDialogProps {
  tripId: string;
  tripTitle: string;
}

const permissionLabels = {
  view: { label: "View only", icon: Eye, description: "Can view itinerary and details" },
  comment: { label: "Comment", icon: MessageSquare, description: "Can view and add comments" },
  edit: { label: "Edit", icon: Edit, description: "Can modify the itinerary" },
};

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-600",
  accepted: "bg-green-500/10 text-green-600",
  declined: "bg-red-500/10 text-red-600",
};

const TripCollaboratorsDialog = ({ tripId, tripTitle }: TripCollaboratorsDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState<"view" | "comment" | "edit">("view");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCollaborators();
    }
  }, [open, tripId]);

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trip_collaborators")
        .select(`
          *,
          profile:profiles!trip_collaborators_user_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCollaborators((data as any) || []);
    } catch (error) {
      console.error("Error fetching collaborators:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setInviting(true);
    try {
      // Check if user exists with this email
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", inviteEmail.toLowerCase())
        .single();

      const { error } = await supabase.from("trip_collaborators").insert({
        trip_id: tripId,
        user_id: existingUser?.id || null,
        invited_email: inviteEmail.toLowerCase(),
        permission: invitePermission,
        invited_by: user.id,
        status: "pending",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("This person has already been invited");
        } else {
          throw error;
        }
      } else {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
        fetchCollaborators();
      }
    } catch (error) {
      console.error("Error inviting:", error);
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    try {
      const { error } = await supabase
        .from("trip_collaborators")
        .delete()
        .eq("id", collaboratorId);

      if (error) throw error;
      toast.success("Collaborator removed");
      fetchCollaborators();
    } catch (error) {
      console.error("Error removing:", error);
      toast.error("Failed to remove collaborator");
    }
  };

  const handleUpdatePermission = async (collaboratorId: string, newPermission: string) => {
    try {
      const { error } = await supabase
        .from("trip_collaborators")
        .update({ permission: newPermission })
        .eq("id", collaboratorId);

      if (error) throw error;
      toast.success("Permission updated");
      fetchCollaborators();
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update permission");
    }
  };

  const PermissionIcon = ({ permission }: { permission: string }) => {
    const config = permissionLabels[permission as keyof typeof permissionLabels];
    const Icon = config?.icon || Eye;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Share
          {collaborators.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
              {collaborators.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share "{tripTitle}"
          </DialogTitle>
          <DialogDescription>
            Invite friends to view or collaborate on this trip.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite Form */}
          <div className="space-y-3">
            <Label>Invite by email</Label>
            <div className="flex gap-2">
              <Input
                placeholder="friend@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                type="email"
                className="flex-1"
              />
              <Select
                value={invitePermission}
                onValueChange={(v) => setInvitePermission(v as typeof invitePermission)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(permissionLabels).map(([key, { label, description }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {permissionLabels[invitePermission].description}
            </p>
          </div>

          {/* Collaborators List */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Collaborators</span>
              <span className="text-xs text-muted-foreground">
                {collaborators.length} invited
              </span>
            </Label>
            
            <ScrollArea className="h-64 border rounded-lg">
              {collaborators.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No collaborators yet</p>
                  <p className="text-xs text-muted-foreground">Invite friends to share this trip</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">
                            {collab.profile?.full_name || collab.invited_email}
                          </p>
                          {collab.profile?.full_name && collab.invited_email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {collab.invited_email}
                            </p>
                          )}
                          <Badge 
                            variant="secondary" 
                            className={`text-xs mt-1 ${statusColors[collab.status]}`}
                          >
                            {collab.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                            {collab.status === "accepted" && <Check className="h-3 w-3 mr-1" />}
                            {collab.status === "declined" && <X className="h-3 w-3 mr-1" />}
                            {collab.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={collab.permission}
                          onValueChange={(v) => handleUpdatePermission(collab.id, v)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(permissionLabels).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(collab.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripCollaboratorsDialog;
