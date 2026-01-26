/**
 * Centralized logging utility
 * - Development: All logs are shown
 * - Production: Only errors are shown (for debugging)
 * - Future: Can integrate with error tracking services (Sentry, etc.)
 */

export const logger = {
  /**
   * Log informational messages (dev only)
   */
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },

  /**
   * Log error messages (always shown, even in production)
   * This is important for debugging production issues
   */
  error: (...args: any[]) => {
    console.error(...args);
    // Future: Could send to error tracking service here
    // if (import.meta.env.PROD) {
    //   errorTrackingService.captureException(...args);
    // }
  },

  /**
   * Log warning messages (dev only)
   */
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },

  /**
   * Log info messages (dev only)
   */
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },
};
