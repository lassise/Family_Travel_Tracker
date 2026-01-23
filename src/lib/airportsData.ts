import { getAllCountries } from './countriesData';

// Airport data with IATA codes
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  state?: string; // US state name (only for US airports)
  lat?: number;
  lon?: number;
}

// Helper to get country name from code
const getCountryName = (code: string): string => {
  const allCountries = getAllCountries();
  const country = allCountries.find(c => c.code === code);
  return country?.name || code;
};

// Major US airports - commonly used
export const US_AIRPORTS: Airport[] = [
  { code: "ATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta", country: "US", state: "Georgia" },
  { code: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "US", state: "California" },
  { code: "ORD", name: "O'Hare International", city: "Chicago", country: "US", state: "Illinois" },
  { code: "DFW", name: "Dallas/Fort Worth International", city: "Dallas", country: "US", state: "Texas" },
  { code: "DEN", name: "Denver International", city: "Denver", country: "US", state: "Colorado" },
  { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "US", state: "New York" },
  { code: "SFO", name: "San Francisco International", city: "San Francisco", country: "US", state: "California" },
  { code: "SEA", name: "Seattle-Tacoma International", city: "Seattle", country: "US", state: "Washington" },
  { code: "LAS", name: "Harry Reid International", city: "Las Vegas", country: "US", state: "Nevada" },
  { code: "MCO", name: "Orlando International", city: "Orlando", country: "US", state: "Florida" },
  { code: "EWR", name: "Newark Liberty International", city: "Newark", country: "US", state: "New Jersey" },
  { code: "MIA", name: "Miami International", city: "Miami", country: "US", state: "Florida" },
  { code: "PHX", name: "Phoenix Sky Harbor International", city: "Phoenix", country: "US", state: "Arizona" },
  { code: "IAH", name: "George Bush Intercontinental", city: "Houston", country: "US", state: "Texas" },
  { code: "BOS", name: "Boston Logan International", city: "Boston", country: "US", state: "Massachusetts" },
  { code: "MSP", name: "Minneapolis-St. Paul International", city: "Minneapolis", country: "US", state: "Minnesota" },
  { code: "FLL", name: "Fort Lauderdale-Hollywood International", city: "Fort Lauderdale", country: "US", state: "Florida" },
  { code: "DTW", name: "Detroit Metropolitan Wayne County", city: "Detroit", country: "US", state: "Michigan" },
  { code: "PHL", name: "Philadelphia International", city: "Philadelphia", country: "US", state: "Pennsylvania" },
  { code: "LGA", name: "LaGuardia", city: "New York", country: "US", state: "New York" },
  { code: "BWI", name: "Baltimore/Washington International", city: "Baltimore", country: "US", state: "Maryland" },
  { code: "SLC", name: "Salt Lake City International", city: "Salt Lake City", country: "US", state: "Utah" },
  { code: "DCA", name: "Ronald Reagan Washington National", city: "Washington", country: "US", state: "Virginia" },
  { code: "IAD", name: "Washington Dulles International", city: "Washington", country: "US", state: "Virginia" },
  { code: "SAN", name: "San Diego International", city: "San Diego", country: "US", state: "California" },
  { code: "TPA", name: "Tampa International", city: "Tampa", country: "US", state: "Florida" },
  { code: "PDX", name: "Portland International", city: "Portland", country: "US", state: "Oregon" },
  { code: "AUS", name: "Austin-Bergstrom International", city: "Austin", country: "US", state: "Texas" },
  { code: "BNA", name: "Nashville International", city: "Nashville", country: "US", state: "Tennessee" },
  { code: "HNL", name: "Daniel K. Inouye International", city: "Honolulu", country: "US", state: "Hawaii" },
  { code: "STL", name: "St. Louis Lambert International", city: "St. Louis", country: "US", state: "Missouri" },
  { code: "RDU", name: "Raleigh-Durham International", city: "Raleigh", country: "US", state: "North Carolina" },
  { code: "MCI", name: "Kansas City International", city: "Kansas City", country: "US", state: "Missouri" },
  { code: "CLE", name: "Cleveland Hopkins International", city: "Cleveland", country: "US", state: "Ohio" },
  { code: "SMF", name: "Sacramento International", city: "Sacramento", country: "US", state: "California" },
  { code: "SJC", name: "San Jose Mineta International", city: "San Jose", country: "US", state: "California" },
  { code: "OAK", name: "Oakland International", city: "Oakland", country: "US", state: "California" },
  { code: "PBI", name: "Palm Beach International", city: "West Palm Beach", country: "US", state: "Florida" },
  { code: "RSW", name: "Southwest Florida International", city: "Fort Myers", country: "US", state: "Florida" },
  { code: "SNA", name: "John Wayne Airport", city: "Santa Ana", country: "US", state: "California" },
  { code: "MSY", name: "Louis Armstrong New Orleans International", city: "New Orleans", country: "US", state: "Louisiana" },
];

// International major airports
export const INTERNATIONAL_AIRPORTS: Airport[] = [
  // Europe
  { code: "LHR", name: "Heathrow", city: "London", country: "GB" },
  { code: "LGW", name: "Gatwick", city: "London", country: "GB" },
  { code: "STN", name: "Stansted", city: "London", country: "GB" },
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "FR" },
  { code: "ORY", name: "Orly", city: "Paris", country: "FR" },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "DE" },
  { code: "MUC", name: "Munich Airport", city: "Munich", country: "DE" },
  { code: "AMS", name: "Schiphol", city: "Amsterdam", country: "NL" },
  { code: "BCN", name: "Barcelona El Prat", city: "Barcelona", country: "ES" },
  { code: "MAD", name: "Adolfo Suárez Madrid-Barajas", city: "Madrid", country: "ES" },
  { code: "FCO", name: "Leonardo da Vinci-Fiumicino", city: "Rome", country: "IT" },
  { code: "MXP", name: "Malpensa", city: "Milan", country: "IT" },
  { code: "ZRH", name: "Zurich Airport", city: "Zurich", country: "CH" },
  { code: "VIE", name: "Vienna International", city: "Vienna", country: "AT" },
  { code: "BRU", name: "Brussels Airport", city: "Brussels", country: "BE" },
  { code: "DUB", name: "Dublin Airport", city: "Dublin", country: "IE" },
  { code: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "DK" },
  { code: "OSL", name: "Oslo Gardermoen", city: "Oslo", country: "NO" },
  { code: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "SE" },
  { code: "HEL", name: "Helsinki-Vantaa", city: "Helsinki", country: "FI" },
  { code: "WAW", name: "Warsaw Chopin", city: "Warsaw", country: "PL" },
  { code: "PRG", name: "Václav Havel Prague", city: "Prague", country: "CZ" },
  { code: "BUD", name: "Budapest Ferenc Liszt", city: "Budapest", country: "HU" },
  { code: "ATH", name: "Athens International", city: "Athens", country: "GR" },
  { code: "LIS", name: "Humberto Delgado Airport", city: "Lisbon", country: "PT" },
  { code: "OPO", name: "Francisco Sá Carneiro", city: "Porto", country: "PT" },
  { code: "LYS", name: "Lyon-Saint Exupéry", city: "Lyon", country: "FR" },
  { code: "NCE", name: "Nice Côte d'Azur", city: "Nice", country: "FR" },
  { code: "TLS", name: "Toulouse-Blagnac", city: "Toulouse", country: "FR" },
  { code: "DUS", name: "Düsseldorf", city: "Düsseldorf", country: "DE" },
  { code: "HAM", name: "Hamburg", city: "Hamburg", country: "DE" },
  { code: "CGN", name: "Cologne Bonn", city: "Cologne", country: "DE" },
  { code: "MAN", name: "Manchester", city: "Manchester", country: "GB" },
  { code: "EDI", name: "Edinburgh", city: "Edinburgh", country: "GB" },
  { code: "GLA", name: "Glasgow", city: "Glasgow", country: "GB" },
  { code: "DME", name: "Domodedovo", city: "Moscow", country: "RU" },
  { code: "SVO", name: "Sheremetyevo", city: "Moscow", country: "RU" },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "TR" },
  { code: "SAW", name: "Sabiha Gökçen", city: "Istanbul", country: "TR" },
  // Middle East & Africa
  { code: "DXB", name: "Dubai International", city: "Dubai", country: "AE" },
  { code: "AUH", name: "Abu Dhabi International", city: "Abu Dhabi", country: "AE" },
  { code: "DOH", name: "Hamad International", city: "Doha", country: "QA" },
  { code: "JED", name: "King Abdulaziz International", city: "Jeddah", country: "SA" },
  { code: "RUH", name: "King Khalid International", city: "Riyadh", country: "SA" },
  { code: "CAI", name: "Cairo International", city: "Cairo", country: "EG" },
  { code: "JNB", name: "O.R. Tambo International", city: "Johannesburg", country: "ZA" },
  { code: "CPT", name: "Cape Town International", city: "Cape Town", country: "ZA" },
  // Asia Pacific
  { code: "HKG", name: "Hong Kong International", city: "Hong Kong", country: "HK" },
  { code: "NRT", name: "Narita International", city: "Tokyo", country: "JP" },
  { code: "HND", name: "Haneda", city: "Tokyo", country: "JP" },
  { code: "KIX", name: "Kansai International", city: "Osaka", country: "JP" },
  { code: "SIN", name: "Singapore Changi", city: "Singapore", country: "SG" },
  { code: "ICN", name: "Incheon International", city: "Seoul", country: "KR" },
  { code: "GMP", name: "Gimpo International", city: "Seoul", country: "KR" },
  { code: "PEK", name: "Beijing Capital", city: "Beijing", country: "CN" },
  { code: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "CN" },
  { code: "CAN", name: "Guangzhou Baiyun", city: "Guangzhou", country: "CN" },
  { code: "SZX", name: "Shenzhen Bao'an", city: "Shenzhen", country: "CN" },
  { code: "TPE", name: "Taiwan Taoyuan", city: "Taipei", country: "TW" },
  { code: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "TH" },
  { code: "KUL", name: "Kuala Lumpur International", city: "Kuala Lumpur", country: "MY" },
  { code: "CGK", name: "Soekarno-Hatta", city: "Jakarta", country: "ID" },
  { code: "MNL", name: "Ninoy Aquino International", city: "Manila", country: "PH" },
  { code: "SGN", name: "Tan Son Nhat International", city: "Ho Chi Minh City", country: "VN" },
  { code: "HAN", name: "Noi Bai International", city: "Hanoi", country: "VN" },
  { code: "DEL", name: "Indira Gandhi International", city: "New Delhi", country: "IN" },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", country: "IN" },
  { code: "BLR", name: "Kempegowda International", city: "Bangalore", country: "IN" },
  { code: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "AU" },
  { code: "MEL", name: "Melbourne", city: "Melbourne", country: "AU" },
  { code: "BNE", name: "Brisbane", city: "Brisbane", country: "AU" },
  { code: "PER", name: "Perth", city: "Perth", country: "AU" },
  { code: "AKL", name: "Auckland", city: "Auckland", country: "NZ" },
  { code: "WLG", name: "Wellington", city: "Wellington", country: "NZ" },
  // Americas (non-US)
  { code: "MEX", name: "Mexico City International", city: "Mexico City", country: "MX" },
  { code: "CUN", name: "Cancún International", city: "Cancún", country: "MX" },
  { code: "GDL", name: "Guadalajara", city: "Guadalajara", country: "MX" },
  { code: "YYZ", name: "Toronto Pearson International", city: "Toronto", country: "CA" },
  { code: "YVR", name: "Vancouver International", city: "Vancouver", country: "CA" },
  { code: "YUL", name: "Montréal-Trudeau", city: "Montreal", country: "CA" },
  { code: "YYC", name: "Calgary International", city: "Calgary", country: "CA" },
  { code: "GRU", name: "São Paulo-Guarulhos", city: "São Paulo", country: "BR" },
  { code: "GIG", name: "Rio de Janeiro-Galeão", city: "Rio de Janeiro", country: "BR" },
  { code: "EZE", name: "Ministro Pistarini", city: "Buenos Aires", country: "AR" },
  { code: "SCL", name: "Arturo Merino Benítez", city: "Santiago", country: "CL" },
  { code: "LIM", name: "Jorge Chávez International", city: "Lima", country: "PE" },
  { code: "BOG", name: "El Dorado International", city: "Bogotá", country: "CO" },
];

export const ALL_AIRPORTS: Airport[] = [...US_AIRPORTS, ...INTERNATIONAL_AIRPORTS];

// Airline data
export interface Airline {
  code: string;
  name: string;
  alliance?: string;
  reliability: number; // 0-100 score
  region?: 'us' | 'international';
}

// Major US Airlines (shown first)
export const MAJOR_US_AIRLINES: Airline[] = [
  { code: "AA", name: "American Airlines", alliance: "Oneworld", reliability: 78, region: 'us' },
  { code: "DL", name: "Delta Air Lines", alliance: "SkyTeam", reliability: 85, region: 'us' },
  { code: "UA", name: "United Airlines", alliance: "Star Alliance", reliability: 80, region: 'us' },
  { code: "WN", name: "Southwest Airlines", reliability: 82, region: 'us' },
  { code: "B6", name: "JetBlue Airways", reliability: 75, region: 'us' },
  { code: "AS", name: "Alaska Airlines", alliance: "Oneworld", reliability: 83, region: 'us' },
  { code: "NK", name: "Spirit Airlines", reliability: 65, region: 'us' },
  { code: "F9", name: "Frontier Airlines", reliability: 68, region: 'us' },
  { code: "HA", name: "Hawaiian Airlines", reliability: 80, region: 'us' },
  { code: "SY", name: "Sun Country Airlines", reliability: 72, region: 'us' },
  { code: "G4", name: "Allegiant Air", reliability: 67, region: 'us' },
  { code: "MX", name: "Breeze Airways", reliability: 74, region: 'us' },
  { code: "VX", name: "Avelo Airlines", reliability: 70, region: 'us' },
];

// International Airlines (shown in "more" section)
export const INTERNATIONAL_AIRLINES: Airline[] = [
  // Europe
  { code: "BA", name: "British Airways", alliance: "Oneworld", reliability: 82, region: 'international' },
  { code: "AF", name: "Air France", alliance: "SkyTeam", reliability: 79, region: 'international' },
  { code: "LH", name: "Lufthansa", alliance: "Star Alliance", reliability: 84, region: 'international' },
  { code: "KL", name: "KLM", alliance: "SkyTeam", reliability: 81, region: 'international' },
  { code: "IB", name: "Iberia", alliance: "Oneworld", reliability: 76, region: 'international' },
  { code: "AZ", name: "ITA Airways", alliance: "SkyTeam", reliability: 72, region: 'international' },
  { code: "LX", name: "Swiss International", alliance: "Star Alliance", reliability: 86, region: 'international' },
  { code: "OS", name: "Austrian Airlines", alliance: "Star Alliance", reliability: 78, region: 'international' },
  { code: "SK", name: "SAS Scandinavian", alliance: "SkyTeam", reliability: 77, region: 'international' },
  { code: "AY", name: "Finnair", alliance: "Oneworld", reliability: 83, region: 'international' },
  { code: "TP", name: "TAP Air Portugal", alliance: "Star Alliance", reliability: 74, region: 'international' },
  { code: "EI", name: "Aer Lingus", reliability: 79, region: 'international' },
  { code: "VS", name: "Virgin Atlantic", reliability: 81, region: 'international' },
  { code: "FR", name: "Ryanair", reliability: 70, region: 'international' },
  { code: "U2", name: "easyJet", reliability: 72, region: 'international' },
  { code: "VY", name: "Vueling", reliability: 71, region: 'international' },
  { code: "W6", name: "Wizz Air", reliability: 68, region: 'international' },
  { code: "TK", name: "Turkish Airlines", alliance: "Star Alliance", reliability: 80, region: 'international' },
  // Middle East & Africa
  { code: "EK", name: "Emirates", reliability: 88, region: 'international' },
  { code: "QR", name: "Qatar Airways", alliance: "Oneworld", reliability: 87, region: 'international' },
  { code: "EY", name: "Etihad Airways", reliability: 85, region: 'international' },
  { code: "SV", name: "Saudia", alliance: "SkyTeam", reliability: 75, region: 'international' },
  { code: "RJ", name: "Royal Jordanian", alliance: "Oneworld", reliability: 73, region: 'international' },
  { code: "SA", name: "South African Airways", alliance: "Star Alliance", reliability: 70, region: 'international' },
  { code: "ET", name: "Ethiopian Airlines", alliance: "Star Alliance", reliability: 76, region: 'international' },
  // Asia Pacific
  { code: "SQ", name: "Singapore Airlines", alliance: "Star Alliance", reliability: 91, region: 'international' },
  { code: "CX", name: "Cathay Pacific", alliance: "Oneworld", reliability: 84, region: 'international' },
  { code: "NH", name: "ANA (All Nippon Airways)", alliance: "Star Alliance", reliability: 90, region: 'international' },
  { code: "JL", name: "Japan Airlines", alliance: "Oneworld", reliability: 89, region: 'international' },
  { code: "KE", name: "Korean Air", alliance: "SkyTeam", reliability: 83, region: 'international' },
  { code: "OZ", name: "Asiana Airlines", alliance: "Star Alliance", reliability: 81, region: 'international' },
  { code: "TG", name: "Thai Airways", alliance: "Star Alliance", reliability: 78, region: 'international' },
  { code: "MH", name: "Malaysia Airlines", alliance: "Oneworld", reliability: 76, region: 'international' },
  { code: "GA", name: "Garuda Indonesia", alliance: "SkyTeam", reliability: 74, region: 'international' },
  { code: "PR", name: "Philippine Airlines", reliability: 72, region: 'international' },
  { code: "VN", name: "Vietnam Airlines", alliance: "SkyTeam", reliability: 75, region: 'international' },
  { code: "CI", name: "China Airlines", alliance: "SkyTeam", reliability: 77, region: 'international' },
  { code: "BR", name: "EVA Air", alliance: "Star Alliance", reliability: 85, region: 'international' },
  { code: "CA", name: "Air China", alliance: "Star Alliance", reliability: 73, region: 'international' },
  { code: "MU", name: "China Eastern", alliance: "SkyTeam", reliability: 72, region: 'international' },
  { code: "CZ", name: "China Southern", alliance: "SkyTeam", reliability: 73, region: 'international' },
  { code: "HU", name: "Hainan Airlines", reliability: 78, region: 'international' },
  { code: "AI", name: "Air India", alliance: "Star Alliance", reliability: 68, region: 'international' },
  { code: "QF", name: "Qantas", alliance: "Oneworld", reliability: 86, region: 'international' },
  { code: "NZ", name: "Air New Zealand", alliance: "Star Alliance", reliability: 85, region: 'international' },
  // Americas (non-US)
  { code: "AC", name: "Air Canada", alliance: "Star Alliance", reliability: 79, region: 'international' },
  { code: "WS", name: "WestJet", reliability: 77, region: 'international' },
  { code: "AM", name: "Aeromexico", alliance: "SkyTeam", reliability: 74, region: 'international' },
  { code: "LA", name: "LATAM Airlines", alliance: "Oneworld", reliability: 76, region: 'international' },
  { code: "AV", name: "Avianca", alliance: "Star Alliance", reliability: 73, region: 'international' },
  { code: "CM", name: "Copa Airlines", alliance: "Star Alliance", reliability: 80, region: 'international' },
  { code: "JJ", name: "LATAM Brasil", alliance: "Oneworld", reliability: 74, region: 'international' },
  { code: "G3", name: "GOL Linhas Aéreas", reliability: 71, region: 'international' },
];

// Combined list for backward compatibility
export const AIRLINES: Airline[] = [...MAJOR_US_AIRLINES, ...INTERNATIONAL_AIRLINES];

export const ALLIANCES = ["Star Alliance", "Oneworld", "SkyTeam"];

// Search airports by code, name, city, country name, or state
// Note: SerpAPI doesn't provide airport autocomplete, so we use a comprehensive hardcoded list
// This includes major international airports including LIS (Lisbon)
export const searchAirports = (query: string): Airport[] => {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  
  // Get country names for all airports to enable country name searching
  const countryNameMap = new Map<string, string>();
  ALL_AIRPORTS.forEach(a => {
    if (!countryNameMap.has(a.country)) {
      countryNameMap.set(a.country, getCountryName(a.country).toLowerCase());
    }
  });
  
  // Prioritize exact code matches, then code starts with, then name/city/country/state matches
  const results = ALL_AIRPORTS.filter(
    a => {
      const codeMatch = a.code.toLowerCase() === q;
      const codeStartsWith = a.code.toLowerCase().startsWith(q);
      const nameMatch = a.name.toLowerCase().includes(q);
      const cityMatch = a.city.toLowerCase().includes(q);
      const countryCodeMatch = a.country.toLowerCase().includes(q);
      const countryName = countryNameMap.get(a.country) || '';
      const countryNameMatch = countryName.includes(q);
      const stateMatch = a.state?.toLowerCase().includes(q) || false;
      
      return codeMatch || codeStartsWith || nameMatch || cityMatch || countryCodeMatch || countryNameMatch || stateMatch;
    }
  );
  
  // Sort: exact code matches first, then code starts with, then name/city matches
  results.sort((a, b) => {
    const aCode = a.code.toLowerCase();
    const bCode = b.code.toLowerCase();
    const aExact = aCode === q;
    const bExact = bCode === q;
    const aStarts = aCode.startsWith(q);
    const bStarts = bCode.startsWith(q);
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });
  
  return results.slice(0, 15); // Increased from 10 to show more results
};

// Get nearby airports (simplified - in production you'd use real distance calculations)
export const getNearbyAirports = (code: string): Airport[] => {
  const nearbyMap: Record<string, string[]> = {
    "PBI": ["FLL", "MIA"],
    "FLL": ["PBI", "MIA"],
    "MIA": ["PBI", "FLL"],
    "JFK": ["LGA", "EWR"],
    "LGA": ["JFK", "EWR"],
    "EWR": ["JFK", "LGA"],
    "SFO": ["OAK", "SJC"],
    "OAK": ["SFO", "SJC"],
    "SJC": ["SFO", "OAK"],
    "LAX": ["SNA", "BUR", "LGB"],
    "DCA": ["IAD", "BWI"],
    "IAD": ["DCA", "BWI"],
    "BWI": ["DCA", "IAD"],
  };
  
  const nearbyCodes = nearbyMap[code] || [];
  return ALL_AIRPORTS.filter(a => nearbyCodes.includes(a.code));
};

// Airport quality ratings for layovers
export const AIRPORT_QUALITY: Record<string, { score: number; notes: string }> = {
  "SIN": { score: 95, notes: "World's best airport - excellent facilities, transit hotel" },
  "ICN": { score: 92, notes: "Excellent amenities, free city tours for long layovers" },
  "HND": { score: 90, notes: "Modern, efficient, great food options" },
  "DXB": { score: 88, notes: "Massive duty-free, lounges, sleeping pods" },
  "AMS": { score: 85, notes: "Compact, easy connections, museum" },
  "DEN": { score: 82, notes: "Modern, good food court, natural light" },
  "ATL": { score: 75, notes: "Large but efficient, plane train between terminals" },
  "ORD": { score: 68, notes: "Large, can be congested, allow extra connection time" },
  "LAX": { score: 65, notes: "Under renovation, terminal changes require planning" },
  "JFK": { score: 70, notes: "Varies by terminal, international connections improved" },
  "MIA": { score: 72, notes: "Improved recently, can be confusing for first-timers" },
  "EWR": { score: 60, notes: "Avoid tight connections, construction ongoing" },
  "LGA": { score: 58, notes: "Small, delays common, limited amenities" },
  "PHL": { score: 62, notes: "Older terminals, allow buffer time" },
};

export const getAirportQuality = (code: string): { score: number; notes: string } => {
  return AIRPORT_QUALITY[code] || { score: 70, notes: "Standard airport" };
};