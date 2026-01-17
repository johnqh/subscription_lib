/**
 * useSubscribable Hook
 *
 * Get packages that the user can subscribe to or upgrade to.
 */

import { useMemo } from 'react';
import {
  useSubscriptions,
  type UseSubscriptionsOptions,
} from './useSubscriptions';
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
 * Options for useSubscribable hook
 */
export type UseSubscribableOptions = UseSubscriptionsOptions;

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
 * @param options Optional configuration including userId
 * @returns List of subscribable package IDs
 *
 * @example
 * ```typescript
 * const { subscribablePackageIds } = useSubscribable('default');
 *
 * // With user ID
 * const { subscribablePackageIds } = useSubscribable('default', {
 *   userId: user?.uid,
 * });
 *
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
export function useSubscribable(
  offerId: string,
  options?: UseSubscribableOptions
): UseSubscribableResult {
  const {
    offer,
    isLoading: loadingOffer,
    error: offerError,
  } = useSubscriptions(offerId, options);
  const {
    subscription,
    isLoading: loadingSub,
    error: subError,
  } = useUserSubscription(options);

  const isLoading = loadingOffer || loadingSub;
  const error = offerError || subError;

  const subscribablePackageIds = useMemo(() => {
    console.log('[useSubscribable] Computing subscribablePackageIds:', {
      offerId,
      hasOffer: !!offer,
      offerPackageCount: offer?.packages.length ?? 0,
      offerPackageIds: offer?.packages.map(p => p.packageId),
      subscription,
      isSubscriptionInitialized: isSubscriptionInitialized(),
    });

    if (!offer) {
      console.log('[useSubscribable] No offer, returning empty array');
      return [];
    }

    // Get all packages including free tier
    let allPackages = [...offer.packages];

    // Add free tier if initialized
    if (isSubscriptionInitialized()) {
      const service = getSubscriptionInstance();
      const freeTier = service.getFreeTierPackage();
      console.log('[useSubscribable] Free tier:', freeTier);
      // Only add if not already in the list
      if (!allPackages.some(p => p.packageId === freeTier.packageId)) {
        allPackages = [freeTier, ...allPackages];
      }
    }

    console.log(
      '[useSubscribable] All packages:',
      allPackages.map(p => p.packageId)
    );

    // No subscription or inactive = all packages subscribable
    if (!subscription || !subscription.isActive) {
      const result = allPackages.map(p => p.packageId);
      console.log(
        '[useSubscribable] No active subscription, returning all:',
        result
      );
      return result;
    }

    // Pass both packageId and productId for matching
    const current = {
      packageId: subscription.packageId,
      productId: subscription.productId,
    };

    // If we don't know the current package or product, return all (shouldn't happen)
    if (!current.packageId && !current.productId) {
      const result = allPackages.map(p => p.packageId);
      console.log(
        '[useSubscribable] No current package/product, returning all:',
        result
      );
      return result;
    }

    // Calculate upgradeable packages
    const result = findUpgradeablePackages(current, allPackages);
    console.log('[useSubscribable] Upgradeable packages:', result);
    return result;
  }, [offer, subscription]);

  return { subscribablePackageIds, isLoading, error };
}
