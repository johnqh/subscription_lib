/**
 * Adapter Exports
 *
 * Platform-specific adapters for RevenueCat SDK integration.
 */

// Web adapter (uses @revenuecat/purchases-js)
export {
  configureRevenueCatAdapter,
  createRevenueCatAdapter,
  setRevenueCatUser,
  clearRevenueCatUser,
  hasRevenueCatUser,
} from './revenuecat-web.js';

// React Native adapter (uses react-native-purchases)
export {
  configureRevenueCatRNAdapter,
  createRevenueCatRNAdapter,
  setRevenueCatRNUser,
  clearRevenueCatRNUser,
  hasRevenueCatRNUser,
} from './revenuecat-rn.js';
