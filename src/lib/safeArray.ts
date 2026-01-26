/**
 * Safe array utility to prevent crashes from null/undefined arrays
 * Returns empty array if input is null, undefined, or not an array
 */
export const safeArray = <T>(arr: T[] | null | undefined): T[] => {
  return Array.isArray(arr) ? arr : [];
};
