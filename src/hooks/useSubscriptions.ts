/**
 * useSubscriptions Hook
 *
 * Fetch and manage subscription offer data.
 * Note: Offerings (product catalog) don't change with user,
 * so this hook doesn't reload when user changes.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SubscriptionOffer } from '../types/subscription';
import {
  getSubscriptionInstance,
  isSubscriptionInitialized,
} from '../core/singleton';

/**
 * Result of useSubscriptions hook
 */
export interface UseSubscriptionsResult {
  /** The requested offer, null if not found or loading */
  offer: SubscriptionOffer | null;
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
  /** Manually refetch the data */
  refetch: () => Promise<void>;
}

/**
 * Options for useSubscriptions hook
 * Note: userId is accepted for API consistency but offerings don't change with user.
 */
export interface UseSubscriptionsOptions {
  /** Optional user ID (accepted for API consistency, but offerings don't change with user) */
  userId?: string;
  /** Optional email for the user */
  userEmail?: string;
}

/**
 * Hook to get subscription offer data (product catalog).
 * Note: Offerings don't change with user, so this hook doesn't need userId.
 *
 * @param offerId Offer identifier to fetch
 * @param _options Optional configuration (userId accepted but not used - offerings are user-independent)
 * @returns Offer data, loading state, and error
 *
 * @example
 * ```typescript
 * const { offer, isLoading, error } = useSubscriptions('default');
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <div>
 *     {offer?.packages.map(pkg => (
 *       <SubscriptionTile key={pkg.packageId} package={pkg} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useSubscriptions(
  offerId: string,
  _options?: UseSubscriptionsOptions
): UseSubscriptionsResult {
  const [offer, setOffer] = useState<SubscriptionOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (!isSubscriptionInitialized()) {
      setError(new Error('Subscription not initialized'));
      setIsLoading(false);
      return;
    }

    const service = getSubscriptionInstance();

    // If we already have this offer cached, use it without refetching
    const cachedOffer = service.getOffer(offerId);
    if (cachedOffer) {
      setOffer(cachedOffer);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load offerings only if not already loaded
      if (!service.hasLoadedOfferings()) {
        await service.loadOfferings();
      }

      const loadedOffer = service.getOffer(offerId);
      setOffer(loadedOffer);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load offer'));
    } finally {
      setIsLoading(false);
    }
  }, [offerId]);

  // Load data on mount only - offerings don't change with user
  useEffect(() => {
    loadData();
  }, [loadData]);

  const refetch = useCallback(async () => {
    if (!isSubscriptionInitialized()) return;

    const service = getSubscriptionInstance();
    try {
      setIsLoading(true);
      setError(null);
      await service.loadOfferings();
      const loadedOffer = service.getOffer(offerId);
      setOffer(loadedOffer);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load offer'));
    } finally {
      setIsLoading(false);
    }
  }, [offerId]);

  return { offer, isLoading, error, refetch };
}
