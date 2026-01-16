/**
 * useSubscriptionPeriods Hook
 *
 * Extract unique billing periods from an offer's packages.
 */

import { useMemo } from 'react';
import type { SubscriptionPeriod } from '../types/period';
import { ALL_PERIODS } from '../types/period';
import { useSubscriptions } from './useSubscriptions';

/**
 * Result of useSubscriptionPeriods hook
 */
export interface UseSubscriptionPeriodsResult {
  /** Available periods sorted (weekly → monthly → quarterly → yearly → lifetime) */
  periods: SubscriptionPeriod[];
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
}

/**
 * Hook to get available billing periods from an offer
 *
 * @param offerId Offer identifier
 * @returns Available periods, sorted from shortest to longest
 *
 * @example
 * ```typescript
 * const { periods, isLoading } = useSubscriptionPeriods('default');
 *
 * return (
 *   <SegmentedControl
 *     options={periods.map(p => ({ value: p, label: capitalize(p) }))}
 *     value={selectedPeriod}
 *     onChange={setSelectedPeriod}
 *   />
 * );
 * ```
 */
export function useSubscriptionPeriods(
  offerId: string
): UseSubscriptionPeriodsResult {
  const { offer, isLoading, error } = useSubscriptions(offerId);

  const periods = useMemo(() => {
    if (!offer) return [];

    // Collect unique periods from packages that have products
    const periodSet = new Set<SubscriptionPeriod>();

    for (const pkg of offer.packages) {
      if (pkg.product) {
        periodSet.add(pkg.product.period);
      }
    }

    // Sort by the standard order
    return ALL_PERIODS.filter(p => periodSet.has(p));
  }, [offer]);

  return { periods, isLoading, error };
}
