import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Copy, Check, Loader2, AlertCircle, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { diagnoseShareSystem, ShareDiagnostics } from '@/lib/share-tokens';
import { useAuth } from '@/hooks/useAuth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

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
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set(options.filter(opt => opt.defaultChecked).map(opt => opt.id))
  );
  const [shareUrl, setShareUrl] = useState<string>(existingShareUrl || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ShareDiagnostics | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

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

  const handleDiagnose = async () => {
    if (!user) {
      toast.error('You must be logged in to run diagnostics');
      return;
    }

    setIsDiagnosing(true);
    try {
      const diag = await diagnoseShareSystem(user.id);
      setDiagnostics(diag);
      setShowDiagnostics(true);
      
      if (diag.success) {
        toast.success(`Diagnostics: Using ${diag.method} system`);
      } else {
        toast.error(`Diagnostics failed: ${diag.error}`);
      }
    } catch (error: any) {
      console.error('Diagnostics error:', error);
      toast.error(`Diagnostics error: ${error.message}`);
    } finally {
      setIsDiagnosing(false);
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
    } catch (error: any) {
      console.error('Failed to generate share link:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Failed to generate share link: ${errorMessage}`);
      
      // Auto-run diagnostics on error
      if (user && !diagnostics) {
        const diag = await diagnoseShareSystem(user.id);
        setDiagnostics(diag);
        setShowDiagnostics(true);
      }
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

          {/* Diagnostics Section */}
          <Collapsible open={showDiagnostics} onOpenChange={setShowDiagnostics}>
            <div className="pt-4 border-t">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs"
                  onClick={handleDiagnose}
                  disabled={isDiagnosing || !user}
                >
                  <div className="flex items-center gap-2">
                    <Bug className="h-3.5 w-3.5" />
                    <span>Diagnostics</span>
                  </div>
                  {isDiagnosing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="text-muted-foreground">Click to run</span>
                  )}
                </Button>
              </CollapsibleTrigger>
              
              {diagnostics && (
                <CollapsibleContent className="mt-2">
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <span className={cn(
                        diagnostics.success ? 'text-emerald-600' : 'text-destructive'
                      )}>
                        {diagnostics.success ? '✓ Working' : '✗ Failed'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Method:</span>
                      <span className="text-muted-foreground">{diagnostics.method}</span>
                    </div>
                    {diagnostics.tableExists !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">share_links table:</span>
                        <span className={cn(
                          diagnostics.tableExists ? 'text-emerald-600' : 'text-orange-600'
                        )}>
                          {diagnostics.tableExists ? 'Exists' : 'Missing'}
                        </span>
                      </div>
                    )}
                    {diagnostics.token && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Token:</span>
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {diagnostics.token.substring(0, 8)}...
                        </span>
                      </div>
                    )}
                    {diagnostics.url && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">URL:</span>
                        <span className="text-muted-foreground font-mono text-[10px] truncate ml-2">
                          {diagnostics.url}
                        </span>
                      </div>
                    )}
                    {diagnostics.error && (
                      <div className="pt-2 border-t">
                        <div className="flex items-start gap-2 text-destructive">
                          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium">Error:</div>
                            <div className="text-[10px] break-all">{diagnostics.error}</div>
                            {diagnostics.errorDetails && (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-[10px]">Details</summary>
                                <pre className="text-[10px] mt-1 overflow-auto max-h-32">
                                  {JSON.stringify(diagnostics.errorDetails, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground pt-1">
                      {diagnostics.timestamp}
                    </div>
                  </div>
                </CollapsibleContent>
              )}
            </div>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  );
}
