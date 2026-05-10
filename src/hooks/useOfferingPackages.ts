/**
 * useOfferingPackages Hook
 *
 * Get packages for a specific offering, sorted by period (short to long).
 */

import { useMemo } from 'react';
import type {
  SubscriptionOffer,
  SubscriptionPackage,
} from '../types/subscription';
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
 * @param offerings Optional pre-loaded offerings array. When provided, packages
 *   are derived from this data instead of an internal useAllOfferings() call.
 *   Use this when the caller already has offerings loaded to avoid a stale
 *   duplicate hook instance (e.g. when useAllOfferings was refetched after
 *   the RevenueCat user was set).
 * @returns Packages sorted by period, loading state, and error
 *
 * @example
 * ```typescript
 * // Standalone usage (fetches offerings internally)
 * const { packages, isLoading } = useOfferingPackages('premium');
 *
 * // With pre-loaded offerings (avoids duplicate fetch)
 * const { offerings } = useAllOfferings();
 * const { packages } = useOfferingPackages('premium', offerings);
 * ```
 */
export function useOfferingPackages(
  offerId: string,
  offerings?: SubscriptionOffer[]
): UseOfferingPackagesResult {
  const {
    offerings: fetchedOfferings,
    isLoading: fetchIsLoading,
    error: fetchError,
  } = useAllOfferings();

  const resolvedOfferings = offerings ?? fetchedOfferings;
  const isLoading = offerings ? false : fetchIsLoading;
  const error = offerings ? null : fetchError;

  const packages = useMemo(() => {
    const offer = resolvedOfferings.find(o => o.offerId === offerId);
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
  }, [resolvedOfferings, offerId]);

  return { packages, isLoading, error };
}
