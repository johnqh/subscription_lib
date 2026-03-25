/**
 * Maps RevenueCat store identifiers to SubscriptionPlatform values.
 */

import { SubscriptionPlatform } from '@sudobility/types';

/**
 * Map a RevenueCat store string to a SubscriptionPlatform.
 * Returns undefined for promotional, test, or unknown stores.
 */
export function mapStoreToPlatform(
  store?: string
): SubscriptionPlatform | undefined {
  switch (store) {
    case 'app_store':
      return SubscriptionPlatform.iOS;
    case 'mac_app_store':
      return SubscriptionPlatform.macOS;
    case 'play_store':
    case 'amazon':
      return SubscriptionPlatform.Android;
    case 'stripe':
    case 'rc_billing':
    case 'paddle':
      return SubscriptionPlatform.Web;
    default:
      return undefined;
  }
}
