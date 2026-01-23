import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Share2, 
  Copy, 
  ExternalLink, 
  Globe, 
  MapPin, 
  Flag,
  Calendar,
  Loader2,
  Check,
  MapPinned
} from "lucide-react";

interface ShareDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShareState {
  token: string | null;
  shareUrl: string | null;
  include_stats: boolean;
  include_countries: boolean;
  include_states: boolean;
  include_timeline: boolean;
}

const shareOptions = [
  { 
    key: "include_stats", 
    label: "Hero Banner", 
    description: "Stats summary & travel progress",
    icon: Globe 
  },
  { 
    key: "include_countries", 
    label: "World Map & Countries", 
    description: "Interactive map of visited countries",
    icon: MapPin 
  },
  { 
    key: "include_states", 
    label: "States/Provinces", 
    description: "US states and other subdivisions visited",
    icon: MapPinned 
  },
  { 
    key: "include_timeline", 
    label: "Timeline & Memories", 
    description: "Photos and travel timeline",
    icon: Calendar 
  },
];

export const ShareDashboardDialog = ({ open, onOpenChange }: ShareDashboardDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareState, setShareState] = useState<ShareState>({
    token: null,
    shareUrl: null,
    include_stats: true,
    include_countries: true,
    include_states: true,
    include_timeline: true,
  });

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      // Reset to defaults when opening
      setShareState({
        token: null,
        shareUrl: null,
        include_stats: true,
        include_countries: true,
        include_states: true,
        include_timeline: true,
      });
      setCopied(false);
    }
  }, [open]);

  const handleToggle = (key: keyof ShareState, value: boolean) => {
    setShareState(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateLink = async () => {
    if (!user) {
      toast.error("You must be logged in to generate a share link");
      return;
    }

    setGenerating(true);

    try {
      console.log("Calling get-or-create-share-link edge function...");
      console.log("Options:", {
        include_countries: shareState.include_countries,
        include_stats: shareState.include_stats,
        include_states: shareState.include_states,
        include_timeline: shareState.include_timeline,
      });

      const { data, error } = await supabase.functions.invoke("get-or-create-share-link", {
        body: {
          include_countries: shareState.include_countries,
          include_stats: shareState.include_stats,
          include_states: shareState.include_states,
          include_timeline: shareState.include_timeline,
        },
      });

      console.log("Edge function response:", { data, error });

      if (error) {
        console.error("Edge function error:", error);
        toast.error("Failed to generate share link: " + error.message);
        return;
      }

      if (!data.ok) {
        console.error("Edge function returned not ok:", data);
        toast.error(data.error || "Failed to generate share link");
        return;
      }

      // Build URL if not returned (fallback)
      const finalUrl = data.url || `${window.location.origin}/share/dashboard/${data.token}`;

      setShareState(prev => ({
        ...prev,
        token: data.token,
        shareUrl: finalUrl,
      }));

      toast.success(data.created ? "Share link created!" : "Share link ready!");
      console.log("SUCCESS! Share URL:", finalUrl);
    } catch (err) {
      console.error("Error generating share link:", err);
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareState.shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareState.shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (!shareState.shareUrl) {
      // Generate link first, then share
      await handleGenerateLink();
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Family Travel Dashboard",
          text: "Check out our family's travel adventures!",
          url: shareState.shareUrl,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleOpenPreview = () => {
    if (shareState.shareUrl) {
      window.open(shareState.shareUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Your Dashboard
          </DialogTitle>
          <DialogDescription>
            Choose what to share with friends and family
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Options - always show */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What to share</Label>
            {shareOptions.map((option) => {
              const Icon = option.icon;
              const isEnabled = shareState[option.key as keyof ShareState] as boolean;
              
              return (
                <div 
                  key={option.key}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(v) => handleToggle(option.key as keyof ShareState, v)}
                    disabled={generating}
                  />
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Share Link - show only after generation */}
          {shareState.shareUrl ? (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Your Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareState.shareUrl}
                    readOnly
                    className="text-xs font-mono bg-muted"
                  />
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={handleOpenPreview}
                    className="shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This link is permanent and will always work (unless you disable sharing).
                </p>
              </div>

              <Button onClick={handleShare} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Dashboard
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleGenerateLink} 
              className="w-full"
              disabled={generating || !user}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Generate Share Link
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDashboardDialog;
