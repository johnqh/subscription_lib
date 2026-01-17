/**
 * Core Exports
 */

export { SubscriptionService, type SubscriptionServiceConfig } from './service';

export {
  initializeSubscription,
  getSubscriptionInstance,
  isSubscriptionInitialized,
  resetSubscription,
  refreshSubscription,
  setSubscriptionUserId,
  getSubscriptionUserId,
  onSubscriptionUserIdChange,
  onSubscriptionRefresh,
  type SubscriptionConfig,
} from './singleton';
