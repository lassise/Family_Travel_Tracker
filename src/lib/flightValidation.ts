/**
 * Flight search parameter validation
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate airport code format (3-letter IATA code)
 */
const isValidAirportCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(trimmed);
};

/**
 * Validate date format and range
 */
const isValidDate = (date: string, minDate?: Date): ValidationResult => {
  if (!date || typeof date !== 'string') {
    return { valid: false, errors: ['Date is required'] };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, errors: ['Invalid date format'] };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(dateObj);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate < today) {
    return { valid: false, errors: ['Departure date cannot be in the past'] };
  }

  // Check if date is too far in the future (e.g., 1 year)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  if (checkDate > maxDate) {
    return { valid: false, errors: ['Departure date cannot be more than 1 year in the future'] };
  }

  if (minDate && checkDate < minDate) {
    return { valid: false, errors: ['Return date must be after departure date'] };
  }

  return { valid: true, errors: [] };
};

/**
 * Validate passenger counts
 */
const isValidPassengerCount = (
  adults: number,
  children: number,
  infantsInSeat: number,
  infantsOnLap: number
): ValidationResult => {
  const errors: string[] = [];

  if (adults < 1) {
    errors.push('At least 1 adult is required');
  }
  if (adults > 9) {
    errors.push('Maximum 9 adults allowed');
  }
  if (children < 0 || children > 8) {
    errors.push('Children must be between 0 and 8');
  }
  if (infantsInSeat < 0 || infantsInSeat > 4) {
    errors.push('Infants in seat must be between 0 and 4');
  }
  if (infantsOnLap < 0 || infantsOnLap > 4) {
    errors.push('Infants on lap must be between 0 and 4');
  }

  const total = adults + children + infantsInSeat + infantsOnLap;
  if (total > 9) {
    errors.push('Total passengers cannot exceed 9');
  }

  // Infants on lap should not exceed adults
  if (infantsOnLap > adults) {
    errors.push('Infants on lap cannot exceed number of adults');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate one-way flight search parameters
 */
export const validateOneWaySearch = (
  origin: string,
  destination: string,
  departDate: string,
  adults: number,
  children: number,
  infantsInSeat: number,
  infantsOnLap: number
): ValidationResult => {
  const errors: string[] = [];

  if (!origin || !isValidAirportCode(origin)) {
    errors.push('Valid origin airport code is required (3 letters, e.g., JFK)');
  }

  if (!destination || !isValidAirportCode(destination)) {
    errors.push('Valid destination airport code is required (3 letters, e.g., LAX)');
  }

  if (origin && destination && origin.toUpperCase() === destination.toUpperCase()) {
    errors.push('Origin and destination cannot be the same');
  }

  const dateValidation = isValidDate(departDate);
  if (!dateValidation.valid) {
    errors.push(...dateValidation.errors);
  }

  const passengerValidation = isValidPassengerCount(adults, children, infantsInSeat, infantsOnLap);
  if (!passengerValidation.valid) {
    errors.push(...passengerValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate round-trip flight search parameters
 */
export const validateRoundTripSearch = (
  origin: string,
  destination: string,
  departDate: string,
  returnDate: string,
  adults: number,
  children: number,
  infantsInSeat: number,
  infantsOnLap: number
): ValidationResult => {
  const errors: string[] = [];

  // Validate one-way parameters first
  const oneWayValidation = validateOneWaySearch(origin, destination, departDate, adults, children, infantsInSeat, infantsOnLap);
  if (!oneWayValidation.valid) {
    errors.push(...oneWayValidation.errors);
  }

  // Validate return date
  if (!returnDate) {
    errors.push('Return date is required for round-trip flights');
  } else {
    const departDateObj = new Date(departDate);
    const returnDateValidation = isValidDate(returnDate, departDateObj);
    if (!returnDateValidation.valid) {
      errors.push(...returnDateValidation.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate multi-city flight search parameters
 */
export const validateMultiCitySearch = (
  segments: Array<{ origin: string; destination: string; date: string }>,
  adults: number,
  children: number,
  infantsInSeat: number,
  infantsOnLap: number
): ValidationResult => {
  const errors: string[] = [];

  if (!segments || segments.length < 2) {
    errors.push('At least 2 flight segments are required for multi-city trips');
  }

  if (segments.length > 6) {
    errors.push('Maximum 6 flight segments allowed');
  }

  // Validate passenger counts
  const passengerValidation = isValidPassengerCount(adults, children, infantsInSeat, infantsOnLap);
  if (!passengerValidation.valid) {
    errors.push(...passengerValidation.errors);
  }

  // Validate each segment
  segments.forEach((segment, index) => {
    if (!segment.origin || !isValidAirportCode(segment.origin)) {
      errors.push(`Segment ${index + 1}: Valid origin airport code is required`);
    }

    if (!segment.destination || !isValidAirportCode(segment.destination)) {
      errors.push(`Segment ${index + 1}: Valid destination airport code is required`);
    }

    if (segment.origin && segment.destination && 
        segment.origin.toUpperCase() === segment.destination.toUpperCase()) {
      errors.push(`Segment ${index + 1}: Origin and destination cannot be the same`);
    }

    if (!segment.date) {
      errors.push(`Segment ${index + 1}: Date is required`);
    } else {
      // For segments after the first, date must be after previous segment's date
      const minDate = index > 0 ? new Date(segments[index - 1].date) : undefined;
      const dateValidation = isValidDate(segment.date, minDate);
      if (!dateValidation.valid) {
        errors.push(`Segment ${index + 1}: ${dateValidation.errors.join(', ')}`);
      }
    }

    // Check continuity: previous destination should match current origin (optional, can be different)
    if (index > 0 && segments[index - 1].destination && segment.origin) {
      const prevDest = segments[index - 1].destination.toUpperCase();
      const currOrigin = segment.origin.toUpperCase();
      if (prevDest !== currOrigin) {
        // This is a warning, not an error - user might want to add ground transport
        // But we'll note it for user awareness
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};
