/**
 * Unified price formatting utility for consistent display across the app
 */

export interface PriceFormatOptions {
  showCurrency?: boolean;
  showPerTicket?: boolean;
  showTotal?: boolean;
  currency?: string;
  decimals?: number;
}

/**
 * Format a price value consistently
 */
export const formatPrice = (
  price: number | null | undefined,
  options: PriceFormatOptions = {}
): string => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A';
  }

  const {
    showCurrency = true,
    showPerTicket = false,
    showTotal = false,
    currency = 'USD',
    decimals = 0,
  } = options;

  const formatted = new Intl.NumberFormat('en-US', {
    style: showCurrency ? 'currency' : 'decimal',
    currency: showCurrency ? currency : undefined,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price);

  let result = formatted;

  if (showPerTicket) {
    result += ' per ticket';
  }

  if (showTotal) {
    result += ' total';
  }

  return result;
};

/**
 * Format price per ticket
 */
export const formatPricePerTicket = (
  price: number | null | undefined,
  passengers: number = 1,
  currency: string = 'USD'
): string => {
  if (price === null || price === undefined || isNaN(price) || passengers <= 0) {
    return 'N/A';
  }

  const perTicket = price / passengers;
  return formatPrice(perTicket, { currency, decimals: 0 });
};

/**
 * Format total price
 */
export const formatTotalPrice = (
  price: number | null | undefined,
  currency: string = 'USD'
): string => {
  return formatPrice(price, { currency, decimals: 0, showTotal: true });
};

/**
 * Format price with savings indicator
 */
export const formatPriceWithSavings = (
  price: number,
  originalPrice: number,
  currency: string = 'USD'
): string => {
  const formatted = formatPrice(price, { currency });
  const savings = originalPrice - price;
  
  if (savings > 0) {
    return `${formatted} (Save ${formatPrice(savings, { currency })})`;
  }
  
  return formatted;
};
