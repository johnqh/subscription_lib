/**
 * useSubscriptionAuth Hook
 *
 * Centralizes auth state → subscription user ID synchronization.
 * Call once at app root to keep subscription_lib's singleton in sync
 * with the current authenticated user.
 */

import { useEffect, useRef, useState } from 'react';
import {
  getSubscriptionInstance,
  isSubscriptionInitialized,
  onSubscriptionRefresh,
  setSubscriptionUserId,
} from '../core/singleton';

/**
 * Options for useSubscriptionAuth hook
 */
export interface UseSubscriptionAuthOptions {
  /** Firebase UID or equivalent. undefined = anonymous / logged out. */
  userId: string | undefined;
  /** Optional email for RevenueCat attributes */
  userEmail?: string;
  /** True while the auth provider is still loading */
  isAuthLoading: boolean;
}

/**
 * Result of useSubscriptionAuth hook
 */
export interface UseSubscriptionAuthResult {
  /** True once the subscription user is synced and customer info loaded */
  isReady: boolean;
  /** Active entitlement identifiers (empty when not ready) */
  entitlements: string[];
}

/**
 * Hook that synchronizes auth state with subscription_lib's singleton.
 *
 * - `isAuthLoading=true` → no-op, returns `isReady: false`
 * - `userId=undefined` (anonymous/logout) → clears the subscription user
 * - `userId="abc"` → sets the user, loads customer info, returns entitlements
 *
 * @example
 * ```tsx
 * function SubscriptionInitializer({ children }) {
 *   const { user, loading } = useAuthStatus();
 *   const { isReady, entitlements } = useSubscriptionAuth({
 *     userId: (!loading && user && !user.isAnonymous) ? user.uid : undefined,
 *     userEmail: user?.email ?? undefined,
 *     isAuthLoading: loading,
 *   });
 *   return <EntitlementProvider entitlements={entitlements}>{children}</EntitlementProvider>;
 * }
 * ```
 */
export function useSubscriptionAuth(
  options: UseSubscriptionAuthOptions
): UseSubscriptionAuthResult {
  const { userId, userEmail, isAuthLoading } = options;
  const [isReady, setIsReady] = useState(false);
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const syncIdRef = useRef(0);

  // Sync user ID with subscription_lib singleton
  useEffect(() => {
    if (isAuthLoading) return;

    let cancelled = false;
    const currentSyncId = ++syncIdRef.current;

    async function syncUser() {
      if (!isSubscriptionInitialized()) {
        return;
      }

      try {
        // Set or clear user
        await setSubscriptionUserId(userId, userEmail);

        if (cancelled || currentSyncId !== syncIdRef.current) return;

        if (userId) {
          // Load customer info for authenticated user
          const service = getSubscriptionInstance();
          await service.loadCustomerInfo();

          if (cancelled || currentSyncId !== syncIdRef.current) return;

          const sub = service.getCurrentSubscription();
          setEntitlements(sub?.entitlements ?? []);
          setIsReady(true);
        } else {
          // Anonymous / logged out
          setEntitlements([]);
          setIsReady(false);
        }
      } catch (err) {
        console.error('[useSubscriptionAuth] Failed to sync user:', err);
        if (!cancelled && currentSyncId === syncIdRef.current) {
          setEntitlements([]);
          setIsReady(false);
        }
      }
    }

    syncUser();

    return () => {
      cancelled = true;
    };
  }, [userId, userEmail, isAuthLoading]);

  // Keep entitlements in sync after purchases / refreshes
  useEffect(() => {
    const unsubscribe = onSubscriptionRefresh(() => {
      if (isSubscriptionInitialized()) {
        const service = getSubscriptionInstance();
        const sub = service.getCurrentSubscription();
        setEntitlements(sub?.entitlements ?? []);
        setIsReady(!!userId);
      }
    });
    return unsubscribe;
  }, [userId]);

  return { isReady, entitlements };
}
