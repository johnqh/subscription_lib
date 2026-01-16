/**
 * useSubscriptionForPeriod Hook
 *
 * Get packages filtered by billing period, sorted by price.
 */

import { useMemo } from 'react';
import type { SubscriptionPackage } from '../types/subscription';
import type { SubscriptionPeriod } from '../types/period';
import { useSubscriptions } from './useSubscriptions';
import {
  getSubscriptionInstance,
  isSubscriptionInitialized,
} from '../core/singleton';

/**
 * Result of useSubscriptionForPeriod hook
 */
export interface UseSubscriptionForPeriodResult {
  /** Packages for the period, sorted by price (ascending), includes free tier first */
  packages: SubscriptionPackage[];
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
}

/**
 * Hook to get packages filtered by billing period
 *
 * Returns packages sorted by price (ascending):
 * - Free tier first (if configured)
 * - Then paid packages from lowest to highest price
 *
 * @param offerId Offer identifier
 * @param period Billing period to filter by
 * @returns Filtered and sorted packages
 *
 * @example
 * ```typescript
 * const { packages, isLoading } = useSubscriptionForPeriod('default', 'monthly');
 *
 * return (
 *   <div className="grid">
 *     {packages.map(pkg => (
 *       <SubscriptionTile
 *         key={pkg.packageId}
 *         title={pkg.name}
 *         price={pkg.product?.priceString ?? 'Free'}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useSubscriptionForPeriod(
  offerId: string,
  period: SubscriptionPeriod
): UseSubscriptionForPeriodResult {
  const { offer, isLoading, error } = useSubscriptions(offerId);

  const packages = useMemo(() => {
    if (!offer) return [];

    // Filter packages by period
    const periodPackages = offer.packages.filter(
      pkg => pkg.product && pkg.product.period === period
    );

    // Sort by price ascending
    periodPackages.sort((a, b) => {
      const priceA = a.product?.price ?? 0;
      const priceB = b.product?.price ?? 0;
      return priceA - priceB;
    });

    // Add free tier at the beginning if subscription is initialized
    if (isSubscriptionInitialized()) {
      const service = getSubscriptionInstance();
      const freeTier = service.getFreeTierPackage();
      return [freeTier, ...periodPackages];
    }

    return periodPackages;
  }, [offer, period]);

  return { packages, isLoading, error };
}
