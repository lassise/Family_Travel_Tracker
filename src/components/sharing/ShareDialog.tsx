import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ShareOption {
  id: string;
  label: string;
  description?: string;
  defaultChecked: boolean;
}

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string; // e.g., "Share My Dashboard", "Share This Memory"
  description?: string; // Optional description text
  shareType: 'dashboard' | 'memory' | 'wishlist' | 'trip' | 'highlights';
  shareableItemId?: string; // ID of specific item (memory ID, trip ID, etc.)
  options: ShareOption[]; // Customization checkboxes
  onGenerateLink: (selectedOptions: string[]) => Promise<string>; // Returns share URL
  existingShareUrl?: string; // If a share link already exists, show it
  onRevokeLink?: () => Promise<void>; // Optional: revoke existing link
}

export function ShareDialog({
  open,
  onOpenChange,
  title,
  description,
  shareType,
  shareableItemId,
  options,
  onGenerateLink,
  existingShareUrl,
  onRevokeLink,
}: ShareDialogProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set(options.filter(opt => opt.defaultChecked).map(opt => opt.id))
  );
  const [shareUrl, setShareUrl] = useState<string>(existingShareUrl || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Reset state when dialog opens/closes or existing URL changes
  useEffect(() => {
    if (open) {
      setSelectedOptions(new Set(options.filter(opt => opt.defaultChecked).map(opt => opt.id)));
      setShareUrl(existingShareUrl || '');
      setCopied(false);
    }
  }, [open, existingShareUrl, options]);

  const handleToggleOption = (optionId: string) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelectedOptions(newSelected);
    // Reset share URL when options change (user needs to regenerate)
    if (shareUrl) {
      setShareUrl('');
      setCopied(false);
    }
  };

  const handleGenerateLink = async () => {
    if (selectedOptions.size === 0) {
      toast.error('Please select at least one option to share');
      return;
    }

    setIsGenerating(true);
    try {
      const url = await onGenerateLink(Array.from(selectedOptions));
      setShareUrl(url);
      toast.success('Share link generated!');
    } catch (error) {
      console.error('Failed to generate share link:', error);
      toast.error('Failed to generate share link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleRevokeLink = async () => {
    if (!onRevokeLink) return;

    setIsRevoking(true);
    try {
      await onRevokeLink();
      setShareUrl('');
      toast.success('Share link revoked');
    } catch (error) {
      console.error('Failed to revoke link:', error);
      toast.error('Failed to revoke link');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Options Section */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose what to include in your shared link:
            </p>
            {options.map(option => (
              <div key={option.id} className="flex items-start space-x-2">
                <Checkbox
                  id={option.id}
                  checked={selectedOptions.has(option.id)}
                  onCheckedChange={() => handleToggleOption(option.id)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none flex-1">
                  <Label
                    htmlFor={option.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.label}
                  </Label>
                  {option.description && (
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Generate Button */}
          {!shareUrl && (
            <Button
              onClick={handleGenerateLink}
              disabled={isGenerating || selectedOptions.size === 0}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Share Link'
              )}
            </Button>
          )}

          {/* Share URL Display */}
          {shareUrl && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm outline-none font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can view your {shareType}
              </p>
              {onRevokeLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeLink}
                  disabled={isRevoking}
                  className="w-full text-destructive hover:text-destructive"
                >
                  {isRevoking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    'Revoke Link'
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
