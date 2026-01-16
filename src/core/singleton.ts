/**
 * Subscription Singleton
 *
 * Global singleton manager for the SubscriptionService.
 */

import type { SubscriptionAdapter } from '../types/adapter';
import type { FreeTierConfig } from '../types/subscription';
import { SubscriptionService } from './service';

/**
 * Configuration for initializing the subscription singleton
 */
export interface SubscriptionConfig {
  /** RevenueCat adapter implementation */
  adapter: SubscriptionAdapter;
  /** Free tier configuration */
  freeTier: FreeTierConfig;
}

let instance: SubscriptionService | null = null;

/**
 * Initialize the subscription singleton
 *
 * Call this once at app startup with your RevenueCat adapter.
 *
 * @param config Configuration with adapter and free tier info
 *
 * @example
 * ```typescript
 * import { initializeSubscription } from '@sudobility/subscription_lib';
 * import { createWebRevenueCatAdapter } from './adapters/web';
 *
 * initializeSubscription({
 *   adapter: createWebRevenueCatAdapter(purchases),
 *   freeTier: { packageId: 'free', name: 'Free' }
 * });
 * ```
 */
export function initializeSubscription(config: SubscriptionConfig): void {
  instance = new SubscriptionService({
    adapter: config.adapter,
    freeTier: config.freeTier,
  });
}

/**
 * Get the subscription service singleton
 *
 * @throws Error if not initialized
 */
export function getSubscriptionInstance(): SubscriptionService {
  if (!instance) {
    throw new Error(
      'Subscription not initialized. Call initializeSubscription() first.'
    );
  }
  return instance;
}

/**
 * Check if subscription singleton is initialized
 */
export function isSubscriptionInitialized(): boolean {
  return instance !== null;
}

/**
 * Reset the subscription singleton (mainly for testing)
 */
export function resetSubscription(): void {
  instance = null;
}

/**
 * Refresh subscription data (customer info and offerings)
 *
 * Call this after a purchase to ensure subscription state is up to date.
 *
 * @example
 * ```typescript
 * import { refreshSubscription } from '@sudobility/subscription_lib';
 *
 * // After purchase completes
 * await refreshSubscription();
 * ```
 */
export async function refreshSubscription(): Promise<void> {
  if (!instance) {
    return;
  }
  await Promise.all([instance.loadOfferings(), instance.loadCustomerInfo()]);
}
