/**
 * useSubscribable Hook
 *
 * Get packages that the user can subscribe to or upgrade to.
 */

import { useMemo } from 'react';
import { useSubscriptions } from './useSubscriptions';
import { useUserSubscription } from './useUserSubscription';
import { findUpgradeablePackages } from '../utils/level-calculator';
import {
  getSubscriptionInstance,
  isSubscriptionInitialized,
} from '../core/singleton';

/**
 * Result of useSubscribable hook
 */
export interface UseSubscribableResult {
  /** Package IDs that the user can subscribe/upgrade to */
  subscribablePackageIds: string[];
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
}

/**
 * Hook to get packages that the user can subscribe to or upgrade to
 *
 * Upgrade eligibility rules:
 * - If no current subscription: all packages are subscribable
 * - If on free tier: all paid packages are subscribable
 * - If has subscription:
 *   - Package period must be >= current period (monthly → yearly OK, yearly → monthly NOT OK)
 *   - Package level must be >= current level (basic → pro OK, pro → basic NOT OK)
 *   - Level is determined by price comparison within the same period
 *
 * @param offerId Offer identifier
 * @returns List of subscribable package IDs
 *
 * @example
 * ```typescript
 * const { subscribablePackageIds } = useSubscribable('default');
 * const { packages } = useSubscriptionForPeriod('default', 'monthly');
 *
 * return (
 *   <div>
 *     {packages.map(pkg => (
 *       <SubscriptionTile
 *         key={pkg.packageId}
 *         enabled={subscribablePackageIds.includes(pkg.packageId)}
 *         {...pkg}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useSubscribable(offerId: string): UseSubscribableResult {
  const {
    offer,
    isLoading: loadingOffer,
    error: offerError,
  } = useSubscriptions(offerId);
  const {
    subscription,
    isLoading: loadingSub,
    error: subError,
  } = useUserSubscription();

  const isLoading = loadingOffer || loadingSub;
  const error = offerError || subError;

  const subscribablePackageIds = useMemo(() => {
    if (!offer) {
      return [];
    }

    // Get all packages including free tier
    let allPackages = [...offer.packages];

    // Add free tier if initialized
    if (isSubscriptionInitialized()) {
      const service = getSubscriptionInstance();
      const freeTier = service.getFreeTierPackage();
      // Only add if not already in the list
      if (!allPackages.some(p => p.packageId === freeTier.packageId)) {
        allPackages = [freeTier, ...allPackages];
      }
    }

    // No subscription or inactive = all packages subscribable
    if (!subscription || !subscription.isActive) {
      return allPackages.map(p => p.packageId);
    }

    // Pass both packageId and productId for matching
    const current = {
      packageId: subscription.packageId,
      productId: subscription.productId,
    };

    // If we don't know the current package or product, return all (shouldn't happen)
    if (!current.packageId && !current.productId) {
      return allPackages.map(p => p.packageId);
    }

    // Calculate upgradeable packages
    return findUpgradeablePackages(current, allPackages);
  }, [offer, subscription]);

  return { subscribablePackageIds, isLoading, error };
}
