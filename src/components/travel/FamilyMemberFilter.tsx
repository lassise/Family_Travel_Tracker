import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

interface FamilyMemberFilterProps {
  familyMembers: FamilyMember[];
  selectedMembers: string[];
  onSelectionChange: (members: string[]) => void;
}

const FamilyMemberFilter = ({ familyMembers, selectedMembers, onSelectionChange }: FamilyMemberFilterProps) => {
  const allSelected = selectedMembers.length === familyMembers.length;

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      onSelectionChange(selectedMembers.filter(id => id !== memberId));
    } else {
      onSelectionChange([...selectedMembers, memberId]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(familyMembers.map(m => m.id));
    }
  };

  if (familyMembers.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
        <Users className="h-4 w-4" />
        <span className="hidden sm:inline">Filter by:</span>
      </div>
      
      <button
        onClick={toggleAll}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
          allSelected
            ? "bg-primary text-primary-foreground"
            : "bg-background border border-border hover:bg-muted"
        )}
      >
        <Checkbox 
          checked={allSelected} 
          className="h-3.5 w-3.5 pointer-events-none" 
        />
        All
      </button>

      {familyMembers.map((member) => {
        const isSelected = selectedMembers.includes(member.id);
        return (
          <button
            key={member.id}
            onClick={() => toggleMember(member.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              isSelected
                ? "text-primary-foreground"
                : "bg-background border border-border hover:bg-muted text-foreground"
            )}
            style={isSelected ? { backgroundColor: member.color } : undefined}
          >
            <Checkbox 
              checked={isSelected} 
              className="h-3.5 w-3.5 pointer-events-none" 
            />
            {member.name.split(' ')[0]}
          </button>
        );
      })}

      {selectedMembers.length > 0 && selectedMembers.length < familyMembers.length && (
        <Badge variant="secondary" className="ml-2">
          {selectedMembers.length} selected
        </Badge>
      )}
    </div>
  );
};

export default FamilyMemberFilter;
