/**
 * Flight search error categorization and user-friendly messages
 */

export interface FlightError {
  type: 'network' | 'api' | 'validation' | 'rate_limit' | 'auth' | 'server' | 'unknown';
  message: string;
  userMessage: string;
  canRetry: boolean;
  originalError?: any;
}

/**
 * Categorize and create user-friendly error messages
 */
export const categorizeFlightError = (error: any, context?: string): FlightError => {
  const errorMessage = error?.message || String(error || 'Unknown error');
  const errorString = errorMessage.toLowerCase();

  // Network errors
  if (
    errorString.includes('network') ||
    errorString.includes('fetch') ||
    errorString.includes('connection') ||
    errorString.includes('timeout') ||
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ETIMEDOUT'
  ) {
    return {
      type: 'network',
      message: errorMessage,
      userMessage: 'Connection issue. Please check your internet connection and try again.',
      canRetry: true,
      originalError: error,
    };
  }

  // Rate limiting
  if (
    errorString.includes('rate limit') ||
    errorString.includes('too many requests') ||
    error?.status === 429 ||
    error?.code === 'RATE_LIMITED'
  ) {
    return {
      type: 'rate_limit',
      message: errorMessage,
      userMessage: 'Too many requests. Please wait a moment and try again.',
      canRetry: true,
      originalError: error,
    };
  }

  // Authentication errors
  if (
    errorString.includes('auth') ||
    errorString.includes('unauthorized') ||
    errorString.includes('permission') ||
    error?.status === 401 ||
    error?.status === 403
  ) {
    return {
      type: 'auth',
      message: errorMessage,
      userMessage: 'Authentication error. Please sign in again.',
      canRetry: false,
      originalError: error,
    };
  }

  // Server errors (5xx)
  if (error?.status >= 500 || errorString.includes('server error')) {
    return {
      type: 'server',
      message: errorMessage,
      userMessage: 'Server error. Please try again in a few moments.',
      canRetry: true,
      originalError: error,
    };
  }

  // API-specific errors
  if (
    errorString.includes('no_api_key') ||
    errorString.includes('api key') ||
    errorString.includes('not configured') ||
    error?.code === 'NO_API_KEY'
  ) {
    return {
      type: 'api',
      message: errorMessage,
      userMessage: 'Flight search is temporarily unavailable. Please try again later.',
      canRetry: true,
      originalError: error,
    };
  }

  // Validation errors
  if (
    errorString.includes('invalid') ||
    errorString.includes('validation') ||
    errorString.includes('required') ||
    error?.code === 'VALIDATION_ERROR'
  ) {
    return {
      type: 'validation',
      message: errorMessage,
      userMessage: context 
        ? `Invalid search: ${context}. Please check your inputs and try again.`
        : 'Invalid search parameters. Please check your inputs and try again.',
      canRetry: false,
      originalError: error,
    };
  }

  // Request cancelled (not really an error, but handle gracefully)
  if (errorString.includes('cancelled') || errorString.includes('aborted')) {
    return {
      type: 'unknown',
      message: errorMessage,
      userMessage: '', // Don't show message for cancelled requests
      canRetry: false,
      originalError: error,
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again.',
    canRetry: true,
    originalError: error,
  };
};
