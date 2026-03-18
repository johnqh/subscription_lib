/**
 * useAllOfferings Hook
 *
 * Fetch all subscription offerings sorted by identifier.
 * Offerings (product catalog) don't change with user,
 * so this hook doesn't reload when user changes.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SubscriptionOffer } from '../types/subscription';
import {
  getSubscriptionInstance,
  isSubscriptionInitialized,
} from '../core/singleton';

/**
 * Result of useAllOfferings hook
 */
export interface UseAllOfferingsResult {
  /** All offerings sorted by identifier, empty if loading */
  offerings: SubscriptionOffer[];
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
  /** Manually refetch the data */
  refetch: () => Promise<void>;
}

/**
 * Hook to get all subscription offerings sorted by identifier.
 * Offerings don't change with user, so this hook loads once.
 *
 * @returns All offerings, loading state, and error
 *
 * @example
 * ```typescript
 * const { offerings, isLoading, error } = useAllOfferings();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <div>
 *     {offerings.map(offer => (
 *       <OfferCard key={offer.offerId} offer={offer} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useAllOfferings(): UseAllOfferingsResult {
  const [offerings, setOfferings] = useState<SubscriptionOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (!isSubscriptionInitialized()) {
      setError(new Error('Subscription not initialized'));
      setIsLoading(false);
      return;
    }

    const service = getSubscriptionInstance();

    // If already loaded, use cached data
    if (service.hasLoadedOfferings()) {
      setOfferings(service.getAllOffers());
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await service.loadOfferings();
      setOfferings(service.getAllOffers());
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load offerings')
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      setOfferings(service.getAllOffers());
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load offerings')
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { offerings, isLoading, error, refetch };
}
