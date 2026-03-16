/**
 * useEntitlements Hook
 *
 * Returns the current user's active entitlement IDs as a string array.
 * Thin wrapper around useUserSubscription for convenience.
 */

import { useMemo } from 'react';
import { useUserSubscription } from './useUserSubscription';
import type { UseUserSubscriptionOptions } from './useUserSubscription';

/**
 * Result of useEntitlements hook
 */
export interface UseEntitlementsResult {
  /** Active entitlement identifiers (e.g., ['blue_belt', 'red_belt']) */
  entitlements: string[];
  /** Whether subscription data is still loading */
  isLoading: boolean;
}

/**
 * Hook that returns the current user's active entitlement IDs.
 *
 * Cross-platform: works with both web and React Native RevenueCat adapters.
 *
 * @param options Optional user ID / email for subscription lookup
 * @returns Active entitlements array and loading state
 *
 * @example
 * ```tsx
 * const { entitlements } = useEntitlements();
 * // entitlements = ['blue_belt']
 *
 * const hasAccess = entitlements.includes('red_belt');
 * ```
 */
export function useEntitlements(
  options?: UseUserSubscriptionOptions
): UseEntitlementsResult {
  const { subscription, isLoading } = useUserSubscription(options);

  const entitlements = useMemo(
    () => subscription?.entitlements ?? [],
    [subscription?.entitlements]
  );

  return { entitlements, isLoading };
}
