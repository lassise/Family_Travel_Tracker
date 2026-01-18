import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Bell, 
  BellOff, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  DollarSign,
  Clock,
  Mail,
  Save,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PriceHistoryPoint {
  date: string;
  price: number;
}

interface PriceTrackingSettingsProps {
  currentPrice: number;
  targetPrice: number;
  onTargetPriceChange: (price: number) => void;
  alertEnabled: boolean;
  onAlertEnabledChange: (enabled: boolean) => void;
  alertEmail: string;
  onAlertEmailChange: (email: string) => void;
  alertFrequency: 'any_drop' | 'below_target' | 'significant_drop';
  onAlertFrequencyChange: (freq: 'any_drop' | 'below_target' | 'significant_drop') => void;
  quietHoursEnabled: boolean;
  onQuietHoursEnabledChange: (enabled: boolean) => void;
  quietHoursStart: string;
  onQuietHoursStartChange: (time: string) => void;
  quietHoursEnd: string;
  onQuietHoursEndChange: (time: string) => void;
  priceHistory?: PriceHistoryPoint[];
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

const PriceTrackingSettings = ({
  currentPrice,
  targetPrice,
  onTargetPriceChange,
  alertEnabled,
  onAlertEnabledChange,
  alertEmail,
  onAlertEmailChange,
  alertFrequency,
  onAlertFrequencyChange,
  quietHoursEnabled,
  onQuietHoursEnabledChange,
  quietHoursStart,
  onQuietHoursStartChange,
  quietHoursEnd,
  onQuietHoursEndChange,
  priceHistory = [],
  onSave,
  isSaving = false,
}: PriceTrackingSettingsProps) => {
  // Calculate price trend
  const getPriceTrend = () => {
    if (priceHistory.length < 2) return 'stable';
    const recent = priceHistory[priceHistory.length - 1].price;
    const previous = priceHistory[priceHistory.length - 2].price;
    const diff = recent - previous;
    const percentChange = (diff / previous) * 100;
    
    if (percentChange < -5) return 'dropping';
    if (percentChange > 5) return 'rising';
    return 'stable';
  };

  const priceTrend = getPriceTrend();

  // Calculate price statistics
  const priceStats = {
    min: priceHistory.length > 0 ? Math.min(...priceHistory.map(p => p.price)) : currentPrice,
    max: priceHistory.length > 0 ? Math.max(...priceHistory.map(p => p.price)) : currentPrice,
    avg: priceHistory.length > 0 
      ? Math.round(priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length) 
      : currentPrice,
  };

  const pricePosition = priceStats.max !== priceStats.min
    ? ((currentPrice - priceStats.min) / (priceStats.max - priceStats.min)) * 100
    : 50;

  return (
    <div className="space-y-4">
      {/* Price History Chart */}
      {priceHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Price History</CardTitle>
              <Badge 
                variant="outline"
                className={cn(
                  priceTrend === 'dropping' && 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400',
                  priceTrend === 'rising' && 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
                  priceTrend === 'stable' && 'bg-muted'
                )}
              >
                {priceTrend === 'dropping' && <TrendingDown className="h-3 w-3 mr-1" />}
                {priceTrend === 'rising' && <TrendingUp className="h-3 w-3 mr-1" />}
                {priceTrend === 'stable' && <Minus className="h-3 w-3 mr-1" />}
                {priceTrend === 'dropping' ? 'Price dropping' : priceTrend === 'rising' ? 'Price rising' : 'Stable'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `$${val}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value}`, 'Price']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <ReferenceLine y={targetPrice} stroke="hsl(var(--primary))" strokeDasharray="5 5" />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Price stats */}
            <div className="flex justify-between mt-3 pt-3 border-t text-xs">
              <div>
                <span className="text-muted-foreground">Low:</span>{' '}
                <span className="font-medium text-emerald-600">${priceStats.min}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg:</span>{' '}
                <span className="font-medium">${priceStats.avg}</span>
              </div>
              <div>
                <span className="text-muted-foreground">High:</span>{' '}
                <span className="font-medium text-red-500">${priceStats.max}</span>
              </div>
            </div>
            
            {/* Current price position indicator */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Low</span>
                <span>High</span>
              </div>
              <div className="relative h-2 bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 rounded-full">
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-foreground rounded-full shadow"
                  style={{ left: `${pricePosition}%`, marginLeft: '-6px' }}
                />
              </div>
              <p className="text-xs text-center mt-1 text-muted-foreground">
                Current: ${currentPrice}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {alertEnabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
              Price Alerts
            </CardTitle>
            <Switch checked={alertEnabled} onCheckedChange={onAlertEnabledChange} />
          </div>
        </CardHeader>
        
        {alertEnabled && (
          <CardContent className="space-y-4">
            {/* Email */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Alert email
              </Label>
              <Input
                type="email"
                value={alertEmail}
                onChange={(e) => onAlertEmailChange(e.target.value)}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>
            
            {/* Alert Frequency */}
            <div>
              <Label className="text-xs text-muted-foreground">When to alert</Label>
              <Select value={alertFrequency} onValueChange={(v) => onAlertFrequencyChange(v as typeof alertFrequency)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any_drop">Any price drop</SelectItem>
                  <SelectItem value="below_target">Below target price</SelectItem>
                  <SelectItem value="significant_drop">Significant drop (10%+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Target Price */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Target price
                </Label>
                <span className="text-sm font-medium">${targetPrice}</span>
              </div>
              <div className="mt-2 space-y-2">
                <Slider
                  value={[targetPrice]}
                  onValueChange={([val]) => onTargetPriceChange(val)}
                  min={Math.round(currentPrice * 0.5)}
                  max={Math.round(currentPrice * 1.2)}
                  step={10}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>${Math.round(currentPrice * 0.5)}</span>
                  <span>Current: ${currentPrice}</span>
                  <span>${Math.round(currentPrice * 1.2)}</span>
                </div>
              </div>
            </div>
            
            {/* Quiet Hours */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Quiet hours (no alerts during)
                </Label>
                <Switch checked={quietHoursEnabled} onCheckedChange={onQuietHoursEnabledChange} />
              </div>
              
              {quietHoursEnabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => onQuietHoursStartChange(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => onQuietHoursEndChange(e.target.value)}
                    className="flex-1"
                  />
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <Button onClick={onSave} disabled={isSaving} className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Price Alert
          </>
        )}
      </Button>
    </div>
  );
};

export { PriceTrackingSettings };
export type { PriceHistoryPoint, PriceTrackingSettingsProps };