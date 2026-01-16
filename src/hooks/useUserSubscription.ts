/**
 * useUserSubscription Hook
 *
 * Fetch and manage current user's subscription status.
 */

import { useCallback, useEffect, useState } from 'react';
import type { CurrentSubscription } from '../types/subscription';
import {
  getSubscriptionInstance,
  isSubscriptionInitialized,
} from '../core/singleton';

/**
 * Result of useUserSubscription hook
 */
export interface UseUserSubscriptionResult {
  /** Current subscription info, null if loading */
  subscription: CurrentSubscription | null;
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
  /** Manually refetch the data */
  refetch: () => Promise<void>;
}

/**
 * Hook to get current user's subscription status
 *
 * @returns Current subscription data, loading state, and error
 *
 * @example
 * ```typescript
 * const { subscription, isLoading } = useUserSubscription();
 *
 * if (isLoading) return <Spinner />;
 *
 * if (subscription?.isActive) {
 *   return <div>Your plan: {subscription.entitlements.join(', ')}</div>;
 * } else {
 *   return <div>No active subscription</div>;
 * }
 * ```
 */
export function useUserSubscription(): UseUserSubscriptionResult {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(
    null
  );
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

      // Load customer info if not already loaded
      if (!service.hasLoadedCustomerInfo()) {
        await service.loadCustomerInfo();
      }

      const currentSub = service.getCurrentSubscription();
      setSubscription(currentSub);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load subscription')
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refetch = useCallback(async () => {
    if (!isSubscriptionInitialized()) return;

    const service = getSubscriptionInstance();
    try {
      setIsLoading(true);
      setError(null);
      await service.loadCustomerInfo();
      const currentSub = service.getCurrentSubscription();
      setSubscription(currentSub);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load subscription')
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { subscription, isLoading, error, refetch };
}
