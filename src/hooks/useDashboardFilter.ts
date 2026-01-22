import { useState, useEffect, useMemo, useCallback } from 'react';
import { FamilyMember, Country } from '@/hooks/useFamilyData';
import { VisitDetail } from '@/hooks/useVisitDetails';

const STORAGE_KEY = 'dashboard-member-filter';

interface VisitWithMembers extends VisitDetail {
  memberIds?: string[];
}

interface UseDashboardFilterResult {
  selectedMemberId: string | null; // null means "All"
  setSelectedMemberId: (id: string | null) => void;
  getFilteredCountries: (countries: Country[]) => Country[];
  getFilteredContinents: (countries: Country[]) => number;
  getFilterLabel: (familyMembers: FamilyMember[]) => string;
  getFilteredEarliestYear: (visitDetails: VisitDetail[], visitMemberMap: Map<string, string[]>) => number | null;
}

export const useDashboardFilter = (familyMembers: FamilyMember[]): UseDashboardFilterResult => {
  const allMemberIds = useMemo(() => familyMembers.map(m => m.id), [familyMembers]);
  
  // Initialize from localStorage or default to null (All)
  const [selectedMemberId, setSelectedMemberIdState] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== 'null') {
        return stored;
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  });

  // When family members load/change, validate selected ID still exists
  useEffect(() => {
    if (allMemberIds.length === 0) return;
    
    if (selectedMemberId !== null && !allMemberIds.includes(selectedMemberId)) {
      // Selected member no longer exists, reset to All
      setSelectedMemberIdState(null);
    }
  }, [allMemberIds, selectedMemberId]);

  // Persist to localStorage whenever selection changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedMemberId || 'null');
  }, [selectedMemberId]);

  const setSelectedMemberId = useCallback((id: string | null) => {
    setSelectedMemberIdState(id);
  }, []);

  // Filter countries based on selected member
  const getFilteredCountries = useCallback((countries: Country[]) => {
    if (selectedMemberId === null) {
      // "All" selected - return unfiltered
      return countries;
    }
    
    // Get selected member name
    const selectedMember = familyMembers.find(m => m.id === selectedMemberId);
    if (!selectedMember) return countries;
    
    const selectedName = selectedMember.name;
    
    // Filter countries to only include visits by selected member
    return countries.map(country => ({
      ...country,
      visitedBy: country.visitedBy.filter(name => name === selectedName)
    }));
  }, [selectedMemberId, familyMembers]);

  // Calculate continents from filtered countries
  const getFilteredContinents = useCallback((countries: Country[]) => {
    const filtered = getFilteredCountries(countries);
    return new Set(filtered.filter(c => c.visitedBy.length > 0).map(c => c.continent)).size;
  }, [getFilteredCountries]);

  // Get label for the selected filter option
  const getFilterLabel = useCallback((members: FamilyMember[]) => {
    if (selectedMemberId === null) {
      return 'All';
    }
    
    const member = members.find(m => m.id === selectedMemberId);
    return member?.name.split(' ')[0] || 'All';
  }, [selectedMemberId]);

  // Get filtered earliest year based on selected member
  const getFilteredEarliestYear = useCallback((
    visitDetails: VisitDetail[], 
    visitMemberMap: Map<string, string[]>
  ): number | null => {
    if (!visitDetails || visitDetails.length === 0) return null;
    if (!visitMemberMap || visitMemberMap.size === 0) return null;

    // Filter visits based on selected member
    // Only include visits where the selected member was actually present
    const relevantVisits = selectedMemberId === null
      ? visitDetails
      : visitDetails.filter(visit => {
          if (!visit || !visit.id) return false;
          const memberIds = visitMemberMap.get(visit.id);
          // Only include this visit if the selected member is in the member list for this specific visit
          return memberIds && memberIds.length > 0 && memberIds.includes(selectedMemberId);
        });

    if (relevantVisits.length === 0) return null;

    // Find the earliest year from the filtered visits
    return relevantVisits.reduce((earliest, visit) => {
      if (!visit) return earliest;
      
      let year: number | null = null;
      if (visit.visit_date) {
        const visitDate = new Date(visit.visit_date);
        if (!isNaN(visitDate.getTime())) {
          year = visitDate.getFullYear();
        }
      } else if (visit.approximate_year) {
        year = visit.approximate_year;
      }
      
      if (year && (!earliest || year < earliest)) {
        return year;
      }
      return earliest;
    }, null as number | null);
  }, [selectedMemberId]);

  return {
    selectedMemberId,
    setSelectedMemberId,
    getFilteredCountries,
    getFilteredContinents,
    getFilterLabel,
    getFilteredEarliestYear,
  };
};
