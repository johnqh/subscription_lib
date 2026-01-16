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
  type SubscriptionConfig,
} from './singleton';
