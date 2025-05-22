// src/utils/formatNumber.ts

/**
 * Format a number with abbreviated suffixes (K, M, B, T)
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted string with abbreviation
 */
export interface FormatNumberOptions {
  /** Maximum number of decimal places to show (default: 1) */
  decimals?: number;
  /** Whether to include currency symbol (default: false) */
  currency?: boolean;
  /** Currency symbol to use (default: '$') */
  currencySymbol?: string;
  /** Whether to force showing decimals even for whole numbers (default: false) */
  forceDecimals?: boolean;
  /** Minimum value to start abbreviating (default: 1000) */
  threshold?: number;
}

export function formatNumberAbbreviated(
  value: number,
  options: FormatNumberOptions = {}
): string {
  const {
    decimals = 1,
    currency = false,
    currencySymbol = "$",
    forceDecimals = false,
    threshold = 1000,
  } = options;

  // Handle edge cases
  if (value === 0) return currency ? `${currencySymbol}0` : "0";
  if (!isFinite(value)) return currency ? `${currencySymbol}0` : "0";

  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  // Don't abbreviate if below threshold
  if (absValue < threshold) {
    const formatted = forceDecimals
      ? absValue.toFixed(decimals)
      : absValue.toString();
    return `${sign}${currency ? currencySymbol : ""}${formatted}`;
  }

  // Define abbreviation tiers
  const tiers = [
    { value: 1e12, suffix: "T" }, // Trillion
    { value: 1e9, suffix: "B" }, // Billion
    { value: 1e6, suffix: "M" }, // Million
    { value: 1e3, suffix: "K" }, // Thousand
  ];

  // Find the appropriate tier
  for (const tier of tiers) {
    if (absValue >= tier.value) {
      const scaled = absValue / tier.value;

      // Format the number with appropriate decimal places
      let formatted: string;
      if (scaled % 1 === 0 && !forceDecimals) {
        // Whole number, no decimals needed
        formatted = scaled.toString();
      } else {
        // Has decimal places or force decimals is true
        formatted = scaled.toFixed(decimals);

        // Remove trailing zeros unless forceDecimals is true
        if (!forceDecimals) {
          formatted = parseFloat(formatted).toString();
        }
      }

      return `${sign}${currency ? currencySymbol : ""}${formatted}${
        tier.suffix
      }`;
    }
  }

  // Fallback (shouldn't reach here due to threshold check)
  const formatted = forceDecimals
    ? absValue.toFixed(decimals)
    : absValue.toString();
  return `${sign}${currency ? currencySymbol : ""}${formatted}`;
}

/**
 * Convenience function for formatting currency values
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted currency string with abbreviation
 */
export function formatCurrencyAbbreviated(
  value: number,
  decimals: number = 1
): string {
  return formatNumberAbbreviated(value, {
    currency: true,
    decimals,
  });
}

/**
 * Convenience function for formatting TVL specifically
 * @param value - The TVL value to format
 * @returns Formatted TVL string
 */
export function formatTVL(value: number): string {
  return formatCurrencyAbbreviated(value, 1);
}

// Example usage and test cases
export const examples = {
  basic: {
    input: 100000,
    output: formatNumberAbbreviated(100000), // "100K"
  },
  currency: {
    input: 100000,
    output: formatCurrencyAbbreviated(100000), // "$100K"
  },
  withDecimals: {
    input: 150500,
    output: formatCurrencyAbbreviated(150500), // "$150.5K"
  },
  millions: {
    input: 2500000,
    output: formatCurrencyAbbreviated(2500000), // "$2.5M"
  },
  billions: {
    input: 1200000000,
    output: formatCurrencyAbbreviated(1200000000), // "$1.2B"
  },
  wholeNumbers: {
    input: 5000000,
    output: formatCurrencyAbbreviated(5000000), // "$5M"
  },
  smallNumbers: {
    input: 500,
    output: formatCurrencyAbbreviated(500), // "$500"
  },
  zero: {
    input: 0,
    output: formatCurrencyAbbreviated(0), // "$0"
  },
  negative: {
    input: -100000,
    output: formatCurrencyAbbreviated(-100000), // "-$100K"
  },
};
