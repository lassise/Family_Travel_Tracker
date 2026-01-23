/**
 * Airport Timezone Mapping
 * 
 * Maps IATA airport codes to IANA timezone identifiers.
 * Used for accurate duration calculations across timezones.
 * 
 * Fallback strategy: If timezone is unknown, use sum method instead of naive subtraction.
 */

// Major airport timezone mappings
// Format: IATA code -> IANA timezone identifier
export const AIRPORT_TIMEZONES: Record<string, string> = {
  // US Airports
  "ATL": "America/New_York",
  "LAX": "America/Los_Angeles",
  "ORD": "America/Chicago",
  "DFW": "America/Chicago",
  "DEN": "America/Denver",
  "JFK": "America/New_York",
  "SFO": "America/Los_Angeles",
  "SEA": "America/Los_Angeles",
  "LAS": "America/Los_Angeles",
  "MCO": "America/New_York",
  "EWR": "America/New_York",
  "MIA": "America/New_York",
  "PHX": "America/Phoenix",
  "IAH": "America/Chicago",
  "BOS": "America/New_York",
  "MSP": "America/Chicago",
  "FLL": "America/New_York",
  "DTW": "America/New_York",
  "PHL": "America/New_York",
  "LGA": "America/New_York",
  "BWI": "America/New_York",
  "SLC": "America/Denver",
  "DCA": "America/New_York",
  "IAD": "America/New_York",
  "SAN": "America/Los_Angeles",
  "TPA": "America/New_York",
  "PDX": "America/Los_Angeles",
  "AUS": "America/Chicago",
  "BNA": "America/Chicago",
  "STL": "America/Chicago",
  "MDW": "America/Chicago",
  "HOU": "America/Chicago",
  "OAK": "America/Los_Angeles",
  "RDU": "America/New_York",
  "MCI": "America/Chicago",
  "SJC": "America/Los_Angeles",
  "SMF": "America/Los_Angeles",
  "DAL": "America/Chicago",
  "HNL": "Pacific/Honolulu",
  "OGG": "Pacific/Honolulu",
  "KOA": "Pacific/Honolulu",
  "LIH": "Pacific/Honolulu",
  "JAX": "America/New_York",
  "MSY": "America/Chicago",
  "IND": "America/New_York",
  "CMH": "America/New_York",
  "CLE": "America/New_York",
  "PIT": "America/New_York",
  "CVG": "America/New_York",
  "MKE": "America/Chicago",
  "RNO": "America/Los_Angeles",
  "ABQ": "America/Denver",
  "TUL": "America/Chicago",
  "OKC": "America/Chicago",
  "OMA": "America/Chicago",
  "MEM": "America/Chicago",
  "BUF": "America/New_York",
  "RIC": "America/New_York",
  "CHS": "America/New_York",
  "GSP": "America/New_York",
  "PBI": "America/New_York",
  "RSW": "America/New_York",
  "SNA": "America/Los_Angeles",
  
  // Europe
  "LHR": "Europe/London",
  "LGW": "Europe/London",
  "STN": "Europe/London",
  "CDG": "Europe/Paris",
  "ORY": "Europe/Paris",
  "FRA": "Europe/Berlin",
  "MUC": "Europe/Berlin",
  "AMS": "Europe/Amsterdam",
  "BCN": "Europe/Madrid",
  "MAD": "Europe/Madrid",
  "FCO": "Europe/Rome",
  "MXP": "Europe/Rome",
  "ZRH": "Europe/Zurich",
  "VIE": "Europe/Vienna",
  "BRU": "Europe/Brussels",
  "DUB": "Europe/Dublin",
  "CPH": "Europe/Copenhagen",
  "OSL": "Europe/Oslo",
  "ARN": "Europe/Stockholm",
  "HEL": "Europe/Helsinki",
  "WAW": "Europe/Warsaw",
  "PRG": "Europe/Prague",
  "BUD": "Europe/Budapest",
  "ATH": "Europe/Athens",
  "LIS": "Europe/Lisbon",
  "OPO": "Europe/Lisbon",
  "LYS": "Europe/Paris",
  "NCE": "Europe/Paris",
  "TLS": "Europe/Paris",
  "DUS": "Europe/Berlin",
  "HAM": "Europe/Berlin",
  "CGN": "Europe/Berlin",
  "MAN": "Europe/London",
  "EDI": "Europe/London",
  "GLA": "Europe/London",
  "DME": "Europe/Moscow",
  "SVO": "Europe/Moscow",
  "IST": "Europe/Istanbul",
  "SAW": "Europe/Istanbul",
  
  // Middle East & Africa
  "DXB": "Asia/Dubai",
  "AUH": "Asia/Dubai",
  "DOH": "Asia/Qatar",
  "JED": "Asia/Riyadh",
  "RUH": "Asia/Riyadh",
  "CAI": "Africa/Cairo",
  "JNB": "Africa/Johannesburg",
  "CPT": "Africa/Johannesburg",
  
  // Asia Pacific
  "HKG": "Asia/Hong_Kong",
  "NRT": "Asia/Tokyo",
  "HND": "Asia/Tokyo",
  "KIX": "Asia/Tokyo",
  "SIN": "Asia/Singapore",
  "ICN": "Asia/Seoul",
  "GMP": "Asia/Seoul",
  "PEK": "Asia/Shanghai",
  "PVG": "Asia/Shanghai",
  "CAN": "Asia/Shanghai",
  "SZX": "Asia/Shanghai",
  "TPE": "Asia/Taipei",
  "BKK": "Asia/Bangkok",
  "KUL": "Asia/Kuala_Lumpur",
  "CGK": "Asia/Jakarta",
  "MNL": "Asia/Manila",
  "SGN": "Asia/Ho_Chi_Minh",
  "HAN": "Asia/Hanoi",
  "DEL": "Asia/Kolkata",
  "BOM": "Asia/Kolkata",
  "BLR": "Asia/Kolkata",
  "SYD": "Australia/Sydney",
  "MEL": "Australia/Melbourne",
  "BNE": "Australia/Brisbane",
  "PER": "Australia/Perth",
  "AKL": "Pacific/Auckland",
  "WLG": "Pacific/Auckland",
  
  // Americas (non-US)
  "MEX": "America/Mexico_City",
  "CUN": "America/Cancun",
  "GDL": "America/Mexico_City",
  "YYZ": "America/Toronto",
  "YVR": "America/Vancouver",
  "YUL": "America/Montreal",
  "YYC": "America/Edmonton",
  "GRU": "America/Sao_Paulo",
  "GIG": "America/Sao_Paulo",
  "EZE": "America/Argentina/Buenos_Aires",
  "SCL": "America/Santiago",
  "LIM": "America/Lima",
  "BOG": "America/Bogota",
};

/**
 * Get IANA timezone for an airport code
 * @param airportCode - IATA airport code
 * @returns IANA timezone identifier or null if unknown
 */
export function getAirportTimezone(airportCode: string): string | null {
  if (!airportCode) return null;
  return AIRPORT_TIMEZONES[airportCode.toUpperCase()] || null;
}

/**
 * Check if we have timezone data for all airports in a segment list
 * @param segments - Array of segments with departureAirport and arrivalAirport
 * @returns true if all airports have known timezones
 */
export function hasAllTimezones(
  segments: Array<{
    departureAirport?: string;
    arrivalAirport?: string;
  }>
): boolean {
  if (!segments || segments.length === 0) return false;
  
  for (const seg of segments) {
    if (seg.departureAirport && !getAirportTimezone(seg.departureAirport)) {
      return false;
    }
    if (seg.arrivalAirport && !getAirportTimezone(seg.arrivalAirport)) {
      return false;
    }
  }
  
  return true;
}
