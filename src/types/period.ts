/**
 * Subscription Period Types
 *
 * Standard subscription periods and utilities for period comparison.
 */

/**
 * Standard subscription periods
 */
export type SubscriptionPeriod =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'lifetime';

/**
 * Period ranking for comparison (higher = longer)
 */
export const PERIOD_RANKS: Record<SubscriptionPeriod, number> = {
  weekly: 1,
  monthly: 2,
  quarterly: 3,
  yearly: 4,
  lifetime: 5,
};

/**
 * All supported periods in order
 */
export const ALL_PERIODS: SubscriptionPeriod[] = [
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'lifetime',
];
