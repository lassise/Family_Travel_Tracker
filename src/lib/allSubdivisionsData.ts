// Comprehensive subdivision data for all countries using iso-3166-2
import iso3166 from 'iso-3166-2';

export interface SubdivisionInfo {
  type: string;
  name: string;
}

// Get all subdivisions for a country by its ISO 2 code
export const getSubdivisionsForCountry = (countryCode: string): Record<string, string> | null => {
  const country = iso3166.country(countryCode);
  if (!country || !country.sub || Object.keys(country.sub).length === 0) {
    return null;
  }
  
  // Convert to a simple code -> name map
  const result: Record<string, string> = {};
  for (const [code, info] of Object.entries(country.sub)) {
    result[code] = (info as SubdivisionInfo).name;
  }
  return result;
};

// Get subdivision type label for a country (e.g., "States", "Provinces", etc.)
export const getSubdivisionLabel = (countryCode: string): string => {
  const country = iso3166.country(countryCode);
  if (!country || !country.sub) return 'Regions';
  
  // Get the first subdivision to determine the type
  const firstSub = Object.values(country.sub)[0] as SubdivisionInfo | undefined;
  if (!firstSub) return 'Regions';
  
  // Normalize common types
  const type = firstSub.type.toLowerCase();
  
  // Map to user-friendly labels
  const typeMapping: Record<string, string> = {
    'state': 'States',
    'province': 'Provinces',
    'region': 'Regions',
    'county': 'Counties',
    'prefecture': 'Prefectures',
    'department': 'Departments',
    'territory': 'Territories',
    'district': 'Districts',
    'canton': 'Cantons',
    'emirate': 'Emirates',
    'voivodeship': 'Voivodeships',
    'autonomous community': 'Communities',
    'municipality': 'Municipalities',
    'parish': 'Parishes',
    'governorate': 'Governorates',
    'division': 'Divisions',
    'oblast': 'Oblasts',
    'autonomous region': 'Regions',
    'autonomous province': 'Provinces',
    'commune': 'Communes',
    'island': 'Islands',
    'country': 'Countries', // For UK
  };
  
  for (const [key, label] of Object.entries(typeMapping)) {
    if (type.includes(key)) {
      return label;
    }
  }
  
  // Capitalize the type if no mapping found
  return firstSub.type.charAt(0).toUpperCase() + firstSub.type.slice(1) + 's';
};

// Check if a country has subdivisions
export const countryHasSubdivisions = (countryCode: string): boolean => {
  const country = iso3166.country(countryCode);
  return !!(country && country.sub && Object.keys(country.sub).length > 0);
};

// Complete ISO3 to ISO2 mapping (iso-3166-2 doesn't provide this directly)
export const iso3ToIso2All: Record<string, string> = {
  'AFG': 'AF', 'ALB': 'AL', 'DZA': 'DZ', 'ASM': 'AS', 'AND': 'AD',
  'AGO': 'AO', 'AIA': 'AI', 'ATA': 'AQ', 'ATG': 'AG', 'ARG': 'AR',
  'ARM': 'AM', 'ABW': 'AW', 'AUS': 'AU', 'AUT': 'AT', 'AZE': 'AZ',
  'BHS': 'BS', 'BHR': 'BH', 'BGD': 'BD', 'BRB': 'BB', 'BLR': 'BY',
  'BEL': 'BE', 'BLZ': 'BZ', 'BEN': 'BJ', 'BMU': 'BM', 'BTN': 'BT',
  'BOL': 'BO', 'BIH': 'BA', 'BWA': 'BW', 'BRA': 'BR', 'VGB': 'VG',
  'BRN': 'BN', 'BGR': 'BG', 'BFA': 'BF', 'BDI': 'BI', 'CPV': 'CV',
  'KHM': 'KH', 'CMR': 'CM', 'CAN': 'CA', 'CYM': 'KY', 'CAF': 'CF',
  'TCD': 'TD', 'CHL': 'CL', 'CHN': 'CN', 'COL': 'CO', 'COM': 'KM',
  'COG': 'CG', 'COD': 'CD', 'CRI': 'CR', 'CIV': 'CI', 'HRV': 'HR',
  'CUB': 'CU', 'CYP': 'CY', 'CZE': 'CZ', 'DNK': 'DK', 'DJI': 'DJ',
  'DMA': 'DM', 'DOM': 'DO', 'ECU': 'EC', 'EGY': 'EG', 'SLV': 'SV',
  'GNQ': 'GQ', 'ERI': 'ER', 'EST': 'EE', 'SWZ': 'SZ', 'ETH': 'ET',
  'FJI': 'FJ', 'FIN': 'FI', 'FRA': 'FR', 'GUF': 'GF', 'PYF': 'PF',
  'GAB': 'GA', 'GMB': 'GM', 'GEO': 'GE', 'DEU': 'DE', 'GHA': 'GH',
  'GIB': 'GI', 'GRC': 'GR', 'GRL': 'GL', 'GRD': 'GD', 'GLP': 'GP',
  'GUM': 'GU', 'GTM': 'GT', 'GGY': 'GG', 'GIN': 'GN', 'GNB': 'GW',
  'GUY': 'GY', 'HTI': 'HT', 'HND': 'HN', 'HKG': 'HK', 'HUN': 'HU',
  'ISL': 'IS', 'IND': 'IN', 'IDN': 'ID', 'IRN': 'IR', 'IRQ': 'IQ',
  'IRL': 'IE', 'IMN': 'IM', 'ISR': 'IL', 'ITA': 'IT', 'JAM': 'JM',
  'JPN': 'JP', 'JEY': 'JE', 'JOR': 'JO', 'KAZ': 'KZ', 'KEN': 'KE',
  'KIR': 'KI', 'PRK': 'KP', 'KOR': 'KR', 'KWT': 'KW', 'KGZ': 'KG',
  'LAO': 'LA', 'LVA': 'LV', 'LBN': 'LB', 'LSO': 'LS', 'LBR': 'LR',
  'LBY': 'LY', 'LIE': 'LI', 'LTU': 'LT', 'LUX': 'LU', 'MAC': 'MO',
  'MDG': 'MG', 'MWI': 'MW', 'MYS': 'MY', 'MDV': 'MV', 'MLI': 'ML',
  'MLT': 'MT', 'MHL': 'MH', 'MTQ': 'MQ', 'MRT': 'MR', 'MUS': 'MU',
  'MYT': 'YT', 'MEX': 'MX', 'FSM': 'FM', 'MDA': 'MD', 'MCO': 'MC',
  'MNG': 'MN', 'MNE': 'ME', 'MSR': 'MS', 'MAR': 'MA', 'MOZ': 'MZ',
  'MMR': 'MM', 'NAM': 'NA', 'NRU': 'NR', 'NPL': 'NP', 'NLD': 'NL',
  'NCL': 'NC', 'NZL': 'NZ', 'NIC': 'NI', 'NER': 'NE', 'NGA': 'NG',
  'NIU': 'NU', 'NFK': 'NF', 'MKD': 'MK', 'MNP': 'MP', 'NOR': 'NO',
  'OMN': 'OM', 'PAK': 'PK', 'PLW': 'PW', 'PSE': 'PS', 'PAN': 'PA',
  'PNG': 'PG', 'PRY': 'PY', 'PER': 'PE', 'PHL': 'PH', 'PCN': 'PN',
  'POL': 'PL', 'PRT': 'PT', 'PRI': 'PR', 'QAT': 'QA', 'REU': 'RE',
  'ROU': 'RO', 'RUS': 'RU', 'RWA': 'RW', 'BLM': 'BL', 'SHN': 'SH',
  'KNA': 'KN', 'LCA': 'LC', 'MAF': 'MF', 'SPM': 'PM', 'VCT': 'VC',
  'WSM': 'WS', 'SMR': 'SM', 'STP': 'ST', 'SAU': 'SA', 'SEN': 'SN',
  'SRB': 'RS', 'SYC': 'SC', 'SLE': 'SL', 'SGP': 'SG', 'SXM': 'SX',
  'SVK': 'SK', 'SVN': 'SI', 'SLB': 'SB', 'SOM': 'SO', 'ZAF': 'ZA',
  'SSD': 'SS', 'ESP': 'ES', 'LKA': 'LK', 'SDN': 'SD', 'SUR': 'SR',
  'SWE': 'SE', 'CHE': 'CH', 'SYR': 'SY', 'TWN': 'TW', 'TJK': 'TJ',
  'TZA': 'TZ', 'THA': 'TH', 'TLS': 'TL', 'TGO': 'TG', 'TKL': 'TK',
  'TON': 'TO', 'TTO': 'TT', 'TUN': 'TN', 'TUR': 'TR', 'TKM': 'TM',
  'TCA': 'TC', 'TUV': 'TV', 'UGA': 'UG', 'UKR': 'UA', 'ARE': 'AE',
  'GBR': 'GB', 'USA': 'US', 'URY': 'UY', 'UZB': 'UZ', 'VUT': 'VU',
  'VEN': 'VE', 'VNM': 'VN', 'VIR': 'VI', 'WLF': 'WF', 'ESH': 'EH',
  'YEM': 'YE', 'ZMB': 'ZM', 'ZWE': 'ZW', 'XKX': 'XK',
};

// Create ISO2 to ISO3 mapping (inverse)
export const iso2ToIso3All: Record<string, string> = Object.fromEntries(
  Object.entries(iso3ToIso2All).map(([iso3, iso2]) => [iso2, iso3])
);

// Export the raw data for advanced usage
export const iso3166Data = iso3166.data;

// Get country name from code
export const getCountryNameFromCode = (code: string): string | null => {
  const country = iso3166.country(code);
  return country?.name || null;
};
