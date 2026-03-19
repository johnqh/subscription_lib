import type { SubscriptionPlatform } from '@sudobility/types';

/**
 * Result from the backend subscription endpoint.
 * Represents server-verified subscription state (via RevenueCat server API),
 * as opposed to client-side RevenueCat SDK state.
 */
export interface BackendSubscriptionResult {
  hasSubscription: boolean;
  entitlements: string[];
  platform: SubscriptionPlatform | null;
  subscriptionStartedAt: string | null;
}
