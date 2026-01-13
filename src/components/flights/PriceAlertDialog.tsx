import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Loader2, Mail, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface PriceAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  currentPrice: number;
  passengers: number;
}

export const PriceAlertDialog = ({
  open,
  onOpenChange,
  origin,
  destination,
  departureDate,
  returnDate,
  currentPrice,
  passengers,
}: PriceAlertDialogProps) => {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [targetPrice, setTargetPrice] = useState(Math.round(currentPrice * 0.9)); // Default 10% less
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [email, setEmail] = useState(profile?.email || "");

  const handleSave = async () => {
    if (!user) {
      toast.error("Please log in to save price alerts");
      return;
    }

    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("saved_flights").insert({
        user_id: user.id,
        origin,
        destination,
        outbound_date: departureDate,
        return_date: returnDate || null,
        trip_type: returnDate ? "roundtrip" : "oneway",
        passengers,
        last_price: currentPrice,
        target_price: targetPrice,
        price_alert_enabled: alertEnabled,
        alert_email: email,
      });

      if (error) throw error;

      toast.success("Price alert saved! We'll email you when prices drop.");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save price alert:", error);
      toast.error("Failed to save price alert");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Set Price Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when prices drop for {origin} → {destination}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Flight Summary */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{origin} → {destination}</p>
                <p className="text-sm text-muted-foreground">
                  {departureDate}{returnDate ? ` - ${returnDate}` : " (One-way)"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">${currentPrice}</p>
                <p className="text-xs text-muted-foreground">Current price</p>
              </div>
            </div>
          </div>

          {/* Target Price */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Alert me when price drops to
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="targetPrice"
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="pl-7"
                min={1}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {targetPrice < currentPrice 
                ? `That's ${Math.round(((currentPrice - targetPrice) / currentPrice) * 100)}% below current price`
                : "Set a price below the current price to get alerted"}
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Email for alerts
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="alertEnabled" className="cursor-pointer">
              Enable price alerts
            </Label>
            <Switch
              id="alertEnabled"
              checked={alertEnabled}
              onCheckedChange={setAlertEnabled}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !email} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : "Set Alert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
