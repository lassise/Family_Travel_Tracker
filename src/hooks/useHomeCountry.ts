import { useMemo } from "react";
import { getAllCountries, searchCountries } from "@/lib/countriesData";
import { countriesWithStates, countryNameToCode } from "@/lib/statesData";

// ISO3 to ISO2 mapping
const iso3ToIso2: Record<string, string> = {
  'USA': 'US', 'CAN': 'CA', 'AUS': 'AU', 'BRA': 'BR', 'MEX': 'MX',
  'IND': 'IN', 'DEU': 'DE', 'GBR': 'GB', 'FRA': 'FR', 'ITA': 'IT',
  'ESP': 'ES', 'JPN': 'JP', 'CHN': 'CN',
};

// ISO2 to ISO3 mapping
const iso2ToIso3: Record<string, string> = Object.fromEntries(
  Object.entries(iso3ToIso2).map(([iso3, iso2]) => [iso2, iso3])
);

// Country name to ISO3
const countryToISO3: Record<string, string> = {
  'United States': 'USA', 'Canada': 'CAN', 'Australia': 'AUS', 'Brazil': 'BRA',
  'Mexico': 'MEX', 'India': 'IND', 'Germany': 'DEU', 'United Kingdom': 'GBR',
  'France': 'FRA', 'Italy': 'ITA', 'Spain': 'ESP', 'Japan': 'JPN', 'China': 'CHN',
};

export interface ResolvedHomeCountry {
  name: string | null;
  iso2: string | null;
  iso3: string | null;
  hasStateTracking: boolean;
}

/**
 * Resolves home country string to standardized format with ISO codes
 */
export const resolveHomeCountry = (homeCountry: string | null | undefined): ResolvedHomeCountry => {
  if (!homeCountry) {
    return { name: null, iso2: null, iso3: null, hasStateTracking: false };
  }

  const raw = homeCountry.trim();
  const upper = raw.toUpperCase();

  // Handle ISO2 input (e.g., "US")
  if (upper.length === 2) {
    const match = getAllCountries().find(c => c.code === upper);
    const iso2 = upper;
    const iso3 = iso2ToIso3[upper] ?? null;
    return {
      name: match?.name ?? raw,
      iso2,
      iso3,
      hasStateTracking: countriesWithStates.includes(iso2),
    };
  }

  // Handle ISO3 input (e.g., "USA")
  if (upper.length === 3 && iso3ToIso2[upper]) {
    const iso2 = iso3ToIso2[upper];
    const match = getAllCountries().find(c => c.code === iso2);
    return {
      name: match?.name ?? raw,
      iso2,
      iso3: upper,
      hasStateTracking: countriesWithStates.includes(iso2),
    };
  }

  // Handle full country name
  const matchBySearch = searchCountries(raw)[0];
  const canonicalName = matchBySearch?.name ?? raw;
  const iso2 = matchBySearch?.code ?? countryNameToCode[canonicalName] ?? null;
  const iso3 = countryToISO3[canonicalName] ?? (iso2 ? iso2ToIso3[iso2] : null) ?? null;

  return {
    name: canonicalName,
    iso2,
    iso3,
    hasStateTracking: iso2 ? countriesWithStates.includes(iso2) : false,
  };
};

/**
 * Check if a country name matches the home country
 */
export const isHomeCountry = (
  countryName: string,
  homeCountry: ResolvedHomeCountry
): boolean => {
  if (!homeCountry.name) return false;
  
  const normalizedInput = countryName.toLowerCase().trim();
  const normalizedHome = homeCountry.name.toLowerCase().trim();
  
  // Direct match
  if (normalizedInput === normalizedHome) return true;
  
  // Check against ISO codes
  const inputCode = countryNameToCode[countryName];
  if (inputCode && homeCountry.iso2 && inputCode === homeCountry.iso2) return true;
  
  // Check against common aliases
  const aliases: Record<string, string[]> = {
    'united states': ['usa', 'us', 'america', 'united states of america'],
    'united kingdom': ['uk', 'great britain', 'britain', 'england'],
  };
  
  const homeAliases = aliases[normalizedHome] || [];
  if (homeAliases.includes(normalizedInput)) return true;
  
  return false;
};

/**
 * Hook to get home country utilities
 */
export const useHomeCountry = (homeCountryInput: string | null | undefined) => {
  const resolved = useMemo(
    () => resolveHomeCountry(homeCountryInput),
    [homeCountryInput]
  );

  const checkIsHomeCountry = useMemo(
    () => (countryName: string) => isHomeCountry(countryName, resolved),
    [resolved]
  );

  return {
    ...resolved,
    isHomeCountry: checkIsHomeCountry,
  };
};
