import { countries, getEmojiFlag, type TCountryCode } from 'countries-list';

export interface CountryOption {
  name: string;
  flag: string;
  continent: string;
  code: string;
}

// Map of continent codes to full names
const continentNames: Record<string, string> = {
  AF: 'Africa',
  AN: 'Antarctica',
  AS: 'Asia',
  EU: 'Europe',
  NA: 'North America',
  OC: 'Oceania',
  SA: 'South America',
};

// Get all countries as options
export const getAllCountries = (): CountryOption[] => {
  return Object.entries(countries).map(([code, data]) => ({
    name: data.name,
    flag: getEmojiFlag(code as TCountryCode),
    continent: continentNames[data.continent] || data.continent,
    code,
  })).sort((a, b) => a.name.localeCompare(b.name));
};

// Search countries by name
export const searchCountries = (query: string): CountryOption[] => {
  const lowercaseQuery = query.toLowerCase();
  return getAllCountries().filter(country => 
    country.name.toLowerCase().includes(lowercaseQuery)
  );
};
