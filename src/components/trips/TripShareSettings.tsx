import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Share2, 
  Link2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff,
  Calendar,
  Shield,
  Trash2,
  AlertTriangle,
  Loader2,
  Globe,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

interface ShareSettings {
  isEnabled: boolean;
  isPublic: boolean;
  shareToken: string;
  expirationDate: string | null;
  permissions: {
    viewItinerary: boolean;
    viewFlights: boolean;
    viewBudget: boolean;
    viewNotes: boolean;
    viewPhotos: boolean;
  };
}

interface TripShareSettingsProps {
  tripId: string;
  tripTitle: string;
  settings: ShareSettings;
  onSettingsChange: (settings: ShareSettings) => Promise<void>;
  onRevokeAccess: () => Promise<void>;
  shareUrl: string;
  isLoading?: boolean;
}

const TripShareSettings = ({
  tripId,
  tripTitle,
  settings,
  onSettingsChange,
  onRevokeAccess,
  shareUrl,
  isLoading = false,
}: TripShareSettingsProps) => {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleToggleShare = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      await onSettingsChange({ ...settings, isEnabled: enabled });
      toast.success(enabled ? 'Sharing enabled' : 'Sharing disabled');
    } catch (err) {
      toast.error('Failed to update sharing settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionChange = async (key: keyof ShareSettings['permissions'], value: boolean) => {
    setIsSaving(true);
    try {
      await onSettingsChange({
        ...settings,
        permissions: { ...settings.permissions, [key]: value },
      });
    } catch (err) {
      toast.error('Failed to update permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpirationChange = async (preset: string) => {
    let expirationDate: string | null = null;
    
    switch (preset) {
      case 'never':
        expirationDate = null;
        break;
      case '1day':
        expirationDate = addDays(new Date(), 1).toISOString();
        break;
      case '1week':
        expirationDate = addWeeks(new Date(), 1).toISOString();
        break;
      case '1month':
        expirationDate = addMonths(new Date(), 1).toISOString();
        break;
      case '3months':
        expirationDate = addMonths(new Date(), 3).toISOString();
        break;
    }
    
    setIsSaving(true);
    try {
      await onSettingsChange({ ...settings, expirationDate });
    } catch (err) {
      toast.error('Failed to update expiration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeAccess = async () => {
    setIsRevoking(true);
    try {
      await onRevokeAccess();
      toast.success('Access revoked. A new share link will be generated.');
    } catch (err) {
      toast.error('Failed to revoke access');
    } finally {
      setIsRevoking(false);
    }
  };

  const getExpirationPreset = () => {
    if (!settings.expirationDate) return 'never';
    const exp = new Date(settings.expirationDate);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return '1day';
    if (diffDays <= 7) return '1week';
    if (diffDays <= 31) return '1month';
    return '3months';
  };

  const permissions = [
    { key: 'viewItinerary', label: 'Itinerary & Activities', description: 'Day-by-day plans and activities' },
    { key: 'viewFlights', label: 'Flight Shortlist', description: 'Saved flight options' },
    { key: 'viewBudget', label: 'Budget & Costs', description: 'Expense estimates and totals' },
    { key: 'viewNotes', label: 'Notes & Tips', description: 'Personal notes and recommendations' },
    { key: 'viewPhotos', label: 'Photos', description: 'Trip photos and images' },
  ] as const;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{tripTitle}"</DialogTitle>
          <DialogDescription>
            Control who can see your trip and what they can access
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enable Sharing Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {settings.isEnabled ? (
                    <Globe className="h-4 w-4 text-primary" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  Enable sharing
                </Label>
                <p className="text-xs text-muted-foreground">
                  {settings.isEnabled 
                    ? 'Anyone with the link can view (based on permissions below)' 
                    : 'Trip is private. Only you can see it.'}
                </p>
              </div>
              <Switch 
                checked={settings.isEnabled} 
                onCheckedChange={handleToggleShare}
                disabled={isSaving}
              />
            </div>

            {settings.isEnabled && (
              <>
                <Separator />

                {/* Share Link */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    Share link
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={shareUrl} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expiration */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Link expires
                  </Label>
                  <Select value={getExpirationPreset()} onValueChange={handleExpirationChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never expires</SelectItem>
                      <SelectItem value="1day">In 24 hours</SelectItem>
                      <SelectItem value="1week">In 1 week</SelectItem>
                      <SelectItem value="1month">In 1 month</SelectItem>
                      <SelectItem value="3months">In 3 months</SelectItem>
                    </SelectContent>
                  </Select>
                  {settings.expirationDate && (
                    <p className="text-xs text-muted-foreground">
                      Expires on {format(new Date(settings.expirationDate), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Permissions */}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    What can viewers see?
                  </Label>
                  
                  <div className="space-y-2">
                    {permissions.map(perm => (
                      <div 
                        key={perm.key} 
                        className={cn(
                          'flex items-center justify-between p-2 rounded-md border transition-colors',
                          settings.permissions[perm.key] ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            {settings.permissions[perm.key] ? (
                              <Eye className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            {perm.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        </div>
                        <Switch
                          checked={settings.permissions[perm.key]}
                          onCheckedChange={(val) => handlePermissionChange(perm.key, val)}
                          disabled={isSaving}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Danger Zone */}
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Revoke access</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will invalidate the current share link. Anyone with the old link will lose access immediately.
                    </p>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleRevokeAccess}
                      disabled={isRevoking}
                      className="w-full"
                    >
                      {isRevoking ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Revoking...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Revoke & Generate New Link
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { TripShareSettings };
export type { ShareSettings, TripShareSettingsProps };