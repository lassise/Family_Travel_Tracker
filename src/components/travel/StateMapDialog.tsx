import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { useStateVisits } from '@/hooks/useStateVisits';
import { useFamilyData, Country } from '@/hooks/useFamilyData';
import { getStatesForCountry, countryNameToCode } from '@/lib/statesData';
import StateGridSelector from './StateGridSelector';

interface StateMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  country: Country | null;
}

const StateMapDialog = ({ open, onOpenChange, country }: StateMapDialogProps) => {
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const { familyMembers } = useFamilyData();
  const countryCode = country ? countryNameToCode[country.name] : null;
  const { stateVisits, toggleStateVisit, refetch } = useStateVisits(countryCode || undefined);

  const states = useMemo(() => {
    if (!countryCode) return null;
    return getStatesForCountry(countryCode);
  }, [countryCode]);

  const visitedStateCodes = useMemo(() => {
    return new Set(stateVisits.map(sv => sv.state_code));
  }, [stateVisits]);

  // Initialize selected states from visits
  useEffect(() => {
    setSelectedStates(visitedStateCodes);
  }, [visitedStateCodes]);

  const handleStateToggle = (stateCode: string) => {
    setSelectedStates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stateCode)) {
        newSet.delete(stateCode);
      } else {
        newSet.add(stateCode);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!country || !countryCode || !states) return;
    
    setIsSaving(true);
    
    // Get the first family member (or could show a selector)
    const primaryMember = familyMembers[0];
    if (!primaryMember) {
      setIsSaving(false);
      return;
    }

    try {
      // Find states to add (in selected but not in visited)
      const statesToAdd = Array.from(selectedStates).filter(sc => !visitedStateCodes.has(sc));
      // Find states to remove (in visited but not in selected)
      const statesToRemove = Array.from(visitedStateCodes).filter(sc => !selectedStates.has(sc));

      for (const stateCode of statesToAdd) {
        const stateName = states[stateCode] || stateCode;
        await toggleStateVisit(country.id, countryCode, stateCode, stateName, primaryMember.id);
      }

      for (const stateCode of statesToRemove) {
        const stateName = states[stateCode] || stateCode;
        await toggleStateVisit(country.id, countryCode, stateCode, stateName, primaryMember.id);
      }

      await refetch();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving state visits:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = () => {
    if (states) {
      setSelectedStates(new Set(Object.keys(states)));
    }
  };

  const handleClearAll = () => {
    setSelectedStates(new Set());
  };

  if (!country || !countryCode || !states) {
    return null;
  }

  const stateEntries = Object.entries(states);
  const visitedCount = selectedStates.size;
  const totalCount = stateEntries.length;
  const progressPercent = Math.round((visitedCount / totalCount) * 100);

  const regionLabel = countryCode === 'US' ? 'States' : 'Regions';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{country.flag}</span>
                <span>{country.name}</span>
              </div>
              <p className="text-sm text-muted-foreground font-normal mt-0.5">
                Select the {regionLabel.toLowerCase()} you've visited
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          {/* Stats Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge 
                variant="default" 
                className="text-sm px-3 py-1 bg-emerald-500 hover:bg-emerald-600"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                {visitedCount} / {totalCount} {regionLabel}
              </Badge>
              
              {/* Progress Bar */}
              <div className="hidden sm:flex items-center gap-2 min-w-[200px]">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-10">
                  {progressPercent}%
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs"
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
            </div>
          </div>

          {/* State Grid */}
          <ScrollArea className="h-[calc(90vh-280px)] min-h-[300px]">
            <div className="pr-4">
              <StateGridSelector
                states={states}
                selectedStates={selectedStates}
                onStateToggle={handleStateToggle}
                countryCode={countryCode}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Click on a {regionLabel.toLowerCase().slice(0, -1)} to toggle visited status
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              size="lg" 
              className="px-8 bg-emerald-500 hover:bg-emerald-600"
            >
              {isSaving ? 'Saving...' : `Save ${regionLabel}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StateMapDialog;
