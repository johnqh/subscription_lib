/**
 * @sudobility/subscription_lib
 *
 * Cross-platform subscription management library with RevenueCat adapter pattern.
 * Works with both React (web) and React Native.
 */

// Core
export {
  initializeSubscription,
  getSubscriptionInstance,
  isSubscriptionInitialized,
  resetSubscription,
  refreshSubscription,
  setSubscriptionUserId,
  getSubscriptionUserId,
  onSubscriptionUserIdChange,
  SubscriptionService,
  type SubscriptionConfig,
  type SubscriptionServiceConfig,
} from './core';

// Hooks
export {
  useSubscriptions,
  useUserSubscription,
  useSubscriptionPeriods,
  useSubscriptionForPeriod,
  useSubscribable,
  type UseSubscriptionsResult,
  type UseSubscriptionsOptions,
  type UseUserSubscriptionResult,
  type UseUserSubscriptionOptions,
  type UseSubscriptionPeriodsResult,
  type UseSubscriptionForPeriodResult,
  type UseSubscribableResult,
  type UseSubscribableOptions,
} from './hooks';

// Types
export type {
  // Adapter types
  SubscriptionAdapter,
  AdapterOfferings,
  AdapterOffering,
  AdapterPackage,
  AdapterProduct,
  AdapterSubscriptionOption,
  AdapterPricingPhase,
  AdapterCustomerInfo,
  AdapterEntitlementInfo,
  AdapterPurchaseParams,
  AdapterPurchaseResult,
  // Subscription types
  SubscriptionProduct,
  SubscriptionPackage,
  SubscriptionOffer,
  CurrentSubscription,
  FreeTierConfig,
  PackageWithLevel,
  // Period types
  SubscriptionPeriod,
} from './types';

export { PERIOD_RANKS, ALL_PERIODS } from './types';

// Utils
export {
  parseISO8601Period,
  getPeriodRank,
  comparePeriods,
  isPeriodGreaterOrEqual,
  calculatePackageLevels,
  addLevelsToPackages,
  getPackageLevel,
  findUpgradeablePackages,
} from './utils';
