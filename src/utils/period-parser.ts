/**
 * Period Parser Utilities
 *
 * Parse ISO 8601 duration strings to standard subscription periods.
 */

import type { SubscriptionPeriod } from '../types/period';
import { PERIOD_RANKS } from '../types/period';

/**
 * Parse ISO 8601 duration string to SubscriptionPeriod
 *
 * @param duration ISO 8601 duration (e.g., "P1M", "P1Y", "P7D", "P1W")
 * @returns Parsed SubscriptionPeriod
 *
 * @example
 * parseISO8601Period("P1M")  // "monthly"
 * parseISO8601Period("P1Y")  // "yearly"
 * parseISO8601Period("P7D")  // "weekly"
 * parseISO8601Period("P1W")  // "weekly"
 * parseISO8601Period("P3M")  // "quarterly"
 * parseISO8601Period(null)   // "lifetime"
 */
export function parseISO8601Period(
  duration: string | null | undefined
): SubscriptionPeriod {
  if (!duration) {
    return 'lifetime';
  }

  const normalized = duration.toUpperCase();

  // Weekly: P1W or P7D
  if (normalized === 'P1W' || normalized === 'P7D') {
    return 'weekly';
  }

  // Monthly: P1M
  if (normalized === 'P1M') {
    return 'monthly';
  }

  // Quarterly: P3M
  if (normalized === 'P3M') {
    return 'quarterly';
  }

  // Yearly: P1Y or P12M
  if (normalized === 'P1Y' || normalized === 'P12M') {
    return 'yearly';
  }

  // Try to parse more complex durations
  const match = normalized.match(/^P(\d+)([DWMY])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'D':
        if (value === 7) return 'weekly';
        if (value >= 28 && value <= 31) return 'monthly';
        if (value >= 84 && value <= 93) return 'quarterly';
        if (value >= 365) return 'yearly';
        break;
      case 'W':
        if (value === 1) return 'weekly';
        if (value === 4 || value === 5) return 'monthly';
        if (value === 13) return 'quarterly';
        if (value === 52) return 'yearly';
        break;
      case 'M':
        if (value === 1) return 'monthly';
        if (value === 3) return 'quarterly';
        if (value === 6) return 'quarterly'; // Treat 6 months as quarterly for simplicity
        if (value === 12) return 'yearly';
        break;
      case 'Y':
        return 'yearly';
    }
  }

  // Default to monthly for unrecognized patterns
  return 'monthly';
}

/**
 * Get numeric rank for a period (higher = longer)
 *
 * @param period SubscriptionPeriod
 * @returns Numeric rank (1-5)
 */
export function getPeriodRank(period: SubscriptionPeriod): number {
  return PERIOD_RANKS[period];
}

/**
 * Compare two periods
 *
 * @param a First period
 * @param b Second period
 * @returns Negative if a < b, 0 if equal, positive if a > b
 */
export function comparePeriods(
  a: SubscriptionPeriod,
  b: SubscriptionPeriod
): number {
  return getPeriodRank(a) - getPeriodRank(b);
}

/**
 * Check if period A is greater than or equal to period B
 *
 * @param a Period to check
 * @param b Period to compare against
 * @returns true if a >= b
 */
export function isPeriodGreaterOrEqual(
  a: SubscriptionPeriod,
  b: SubscriptionPeriod
): boolean {
  return getPeriodRank(a) >= getPeriodRank(b);
}
