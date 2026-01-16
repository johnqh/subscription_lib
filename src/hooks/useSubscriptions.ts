/**
 * useSubscriptions Hook
 *
 * Fetch and manage subscription offer data.
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
 * Hook to get subscription offer data
 *
 * @param offerId Offer identifier to fetch
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
export function useSubscriptions(offerId: string): UseSubscriptionsResult {
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

    try {
      setIsLoading(true);
      setError(null);

      // Load offerings if not already loaded
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
