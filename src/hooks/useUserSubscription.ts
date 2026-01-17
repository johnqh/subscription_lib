/**
 * useUserSubscription Hook
 *
 * Fetch and manage current user's subscription status.
 */

import { useCallback, useEffect, useState } from 'react';
import type { CurrentSubscription } from '../types/subscription';
import {
  getSubscriptionInstance,
  getSubscriptionUserId,
  isSubscriptionInitialized,
  onSubscriptionUserIdChange,
  setSubscriptionUserId,
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
 * Options for useUserSubscription hook
 */
export interface UseUserSubscriptionOptions {
  /** Optional user ID. When provided, sets the subscription user and reloads on change. */
  userId?: string;
  /** Optional email for the user */
  userEmail?: string;
}

/**
 * Hook to get current user's subscription status
 *
 * @param options Optional configuration including userId
 * @returns Current subscription data, loading state, and error
 *
 * @example
 * ```typescript
 * // Without user ID (anonymous or use existing)
 * const { subscription, isLoading } = useUserSubscription();
 *
 * // With user ID (will re-initialize when user changes)
 * const { subscription, isLoading } = useUserSubscription({
 *   userId: user?.uid,
 *   userEmail: user?.email,
 * });
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
export function useUserSubscription(
  options?: UseUserSubscriptionOptions
): UseUserSubscriptionResult {
  const { userId, userEmail } = options ?? {};
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Handle user ID changes
  useEffect(() => {
    const currentLibUserId = getSubscriptionUserId();
    // Only update if userId is explicitly provided and different
    if (userId !== undefined && userId !== currentLibUserId) {
      console.log(
        '[useUserSubscription] User ID changed, updating subscription user:',
        {
          from: currentLibUserId,
          to: userId,
        }
      );
      setSubscriptionUserId(userId, userEmail);
    }
  }, [userId, userEmail]);

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

  // Load data on mount and when userId changes
  useEffect(() => {
    loadData();

    // Subscribe to user ID changes to reload
    const unsubscribe = onSubscriptionUserIdChange(() => {
      console.log('[useUserSubscription] User ID changed, reloading...');
      loadData();
    });

    return unsubscribe;
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
