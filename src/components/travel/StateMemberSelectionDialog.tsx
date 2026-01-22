import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MapPin } from 'lucide-react';
import { useStateVisits } from '@/hooks/useStateVisits';
import { useFamilyData } from '@/hooks/useFamilyData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StateMemberSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countryId: string;
  countryCode: string;
  stateCode: string;
  stateName: string;
  onSave?: () => void;
}

const StateMemberSelectionDialog = ({
  open,
  onOpenChange,
  countryId,
  countryCode,
  stateCode,
  stateName,
  onSave
}: StateMemberSelectionDialogProps) => {
  const { user } = useAuth();
  const { familyMembers } = useFamilyData();
  const { stateVisits, refetch } = useStateVisits(countryCode);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Get current members who have visited this state
  const currentMemberIds = useMemo(() => {
    return new Set(
      stateVisits
        .filter(sv => sv.state_code === stateCode && sv.country_code === countryCode)
        .map(sv => sv.family_member_id)
    );
  }, [stateVisits, stateCode, countryCode]);

  // Initialize selected members when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedMemberIds(new Set(currentMemberIds));
    }
  }, [open, currentMemberIds]);

  const handleMemberToggle = (memberId: string) => {
    setSelectedMemberIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to save state visits');
      return;
    }

    // Validation: require at least one member selected
    if (selectedMemberIds.size === 0) {
      toast.error('Please select at least one family member who has visited this state');
      return;
    }

    setIsSaving(true);

    try {
      // Determine which members to add and which to remove
      const membersToAdd = Array.from(selectedMemberIds).filter(id => !currentMemberIds.has(id));
      const membersToRemove = Array.from(currentMemberIds).filter(id => !selectedMemberIds.has(id));

      // Add visits for newly selected members
      if (membersToAdd.length > 0) {
        const inserts = membersToAdd.map(memberId => ({
          country_id: countryId,
          country_code: countryCode,
          state_code: stateCode,
          state_name: stateName,
          family_member_id: memberId,
          user_id: user.id,
        }));

        // Use upsert with the unique constraint columns
        const { error: insertError } = await supabase
          .from('state_visits')
          .upsert(inserts, { 
            onConflict: 'state_code,family_member_id',
            ignoreDuplicates: false 
          });

        if (insertError) throw insertError;
      }

      // Remove visits for unselected members
      if (membersToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('state_visits')
          .delete()
          .eq('state_code', stateCode)
          .eq('country_code', countryCode)
          .in('family_member_id', membersToRemove)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      }

      // Refresh state visits
      await refetch();

      toast.success(`Updated ${stateName} visits for selected family members`);
      onOpenChange(false);
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving state member visits:', error);
      toast.error('Failed to save state visits. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restore original selection
    setSelectedMemberIds(new Set(currentMemberIds));
    onOpenChange(false);
  };

  if (familyMembers.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Family Members</DialogTitle>
            <DialogDescription>
              Please add family members before tracking state visits.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            {stateName}
          </DialogTitle>
          <DialogDescription>
            Select all family members who have visited this state/region
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3 py-2">
            {familyMembers.map((member) => {
              const isSelected = selectedMemberIds.has(member.id);
              return (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMemberToggle(member.id)}
                  />
                  <Label
                    htmlFor={`member-${member.id}`}
                    className="flex-1 cursor-pointer flex items-center gap-2"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{member.name}</span>
                  </Label>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedMemberIds.size} of {familyMembers.length} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || selectedMemberIds.size === 0}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StateMemberSelectionDialog;
