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
  type SubscriptionConfig,
} from './singleton';
