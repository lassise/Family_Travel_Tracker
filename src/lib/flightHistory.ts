/**
 * Flight history / recently viewed flights
 * Uses localStorage to persist across sessions
 */

export interface FlightHistoryEntry {
  id: string;
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  tripType: "oneway" | "roundtrip" | "multicity";
  timestamp: number;
  flightId?: string; // Optional: specific flight that was viewed
  price?: number;
}

const STORAGE_KEY = "flight_history";
const MAX_HISTORY_ENTRIES = 20;

/**
 * Get flight history from localStorage
 */
export const getFlightHistory = (): FlightHistoryEntry[] => {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored) as FlightHistoryEntry[];
    // Sort by most recent first
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error reading flight history:", error);
    return [];
  }
};

/**
 * Add a flight search to history
 */
export const addToFlightHistory = (
  origin: string,
  destination: string,
  date: string,
  tripType: "oneway" | "roundtrip" | "multicity",
  returnDate?: string,
  flightId?: string,
  price?: number
): void => {
  if (typeof window === "undefined") return;
  
  try {
    const history = getFlightHistory();
    
    // Create entry
    const entry: FlightHistoryEntry = {
      id: `${origin}-${destination}-${date}-${Date.now()}`,
      origin,
      destination,
      date,
      returnDate,
      tripType,
      timestamp: Date.now(),
      flightId,
      price,
    };
    
    // Remove duplicates (same origin, destination, date)
    const filtered = history.filter(
      (h) =>
        !(
          h.origin === origin &&
          h.destination === destination &&
          h.date === date &&
          h.tripType === tripType
        )
    );
    
    // Add new entry at the beginning
    const updated = [entry, ...filtered].slice(0, MAX_HISTORY_ENTRIES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving flight history:", error);
  }
};

/**
 * Clear flight history
 */
export const clearFlightHistory = (): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing flight history:", error);
  }
};

/**
 * Remove a specific entry from history
 */
export const removeFromFlightHistory = (id: string): void => {
  if (typeof window === "undefined") return;
  
  try {
    const history = getFlightHistory();
    const filtered = history.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing from flight history:", error);
  }
};

/**
 * Format history entry for display
 */
export const formatHistoryEntry = (entry: FlightHistoryEntry): string => {
  if (entry.tripType === "roundtrip" && entry.returnDate) {
    return `${entry.origin} → ${entry.destination} (${entry.date} - ${entry.returnDate})`;
  } else if (entry.tripType === "multicity") {
    return `${entry.origin} → ${entry.destination} (${entry.date})`;
  }
  return `${entry.origin} → ${entry.destination} (${entry.date})`;
};
