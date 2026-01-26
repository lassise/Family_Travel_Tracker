/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> & { shouldRetry: (error: any) => boolean } = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors and 5xx server errors
    const errorString = String(error?.message || error || '').toLowerCase();
    return (
      errorString.includes('network') ||
      errorString.includes('timeout') ||
      errorString.includes('connection') ||
      error?.status >= 500 ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ETIMEDOUT'
    );
  },
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === opts.maxAttempts - 1) {
        throw error;
      }

      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
};
