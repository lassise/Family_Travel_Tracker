import { useState, useEffect, useMemo, useCallback } from 'react';
import { FamilyMember, Country } from '@/hooks/useFamilyData';

const STORAGE_KEY = 'dashboard-member-filter';

interface UseDashboardFilterResult {
  selectedMemberId: string | null; // null means "All"
  setSelectedMemberId: (id: string | null) => void;
  getFilteredCountries: (countries: Country[]) => Country[];
  getFilteredContinents: (countries: Country[]) => number;
  getFilterLabel: (familyMembers: FamilyMember[]) => string;
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

  return {
    selectedMemberId,
    setSelectedMemberId,
    getFilteredCountries,
    getFilteredContinents,
    getFilterLabel,
  };
};
