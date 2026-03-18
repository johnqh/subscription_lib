/**
 * useOfferingPackages Hook
 *
 * Get packages for a specific offering, sorted by period (short to long).
 */

import { useMemo } from 'react';
import type { SubscriptionPackage } from '../types/subscription';
import { getPeriodRank } from '../utils/period-parser';
import { useAllOfferings } from './useAllOfferings';

/**
 * Result of useOfferingPackages hook
 */
export interface UseOfferingPackagesResult {
  /** Packages sorted by period (weekly → yearly → lifetime), empty if loading */
  packages: SubscriptionPackage[];
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
}

/**
 * Hook to get packages for a specific offering, sorted by period.
 *
 * @param offerId Offering identifier
 * @returns Packages sorted by period, loading state, and error
 *
 * @example
 * ```typescript
 * const { packages, isLoading } = useOfferingPackages('premium');
 *
 * // packages are sorted: weekly, monthly, quarterly, yearly, lifetime
 * ```
 */
export function useOfferingPackages(
  offerId: string
): UseOfferingPackagesResult {
  const { offerings, isLoading, error } = useAllOfferings();

  const packages = useMemo(() => {
    const offer = offerings.find(o => o.offerId === offerId);
    if (!offer) return [];

    return [...offer.packages].sort((a, b) => {
      const rankA = a.product
        ? getPeriodRank(a.product.period)
        : Number.MAX_SAFE_INTEGER;
      const rankB = b.product
        ? getPeriodRank(b.product.period)
        : Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return a.packageId.localeCompare(b.packageId);
    });
  }, [offerings, offerId]);

  return { packages, isLoading, error };
}
