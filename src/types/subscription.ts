/**
 * Subscription Types
 *
 * Clean abstraction types for subscription data, independent of RevenueCat SDK.
 */

import type { SubscriptionPeriod } from './period';

/**
 * Product pricing and billing information
 */
export interface SubscriptionProduct {
  /** Product ID from the store */
  productId: string;
  /** Product display name */
  name: string;
  /** Product description */
  description?: string;
  /** Numeric price value */
  price: number;
  /** Formatted price string (e.g., "$9.99") */
  priceString: string;
  /** Currency code (e.g., "USD") */
  currency: string;
  /** Parsed subscription period */
  period: SubscriptionPeriod;
  /** Raw ISO 8601 period duration */
  periodDuration: string;
  /** Trial period in ISO 8601 format (e.g., "P7D") */
  trialPeriod?: string;
  /** Introductory price string */
  introPrice?: string;
  /** Introductory price period in ISO 8601 format */
  introPricePeriod?: string;
  /** Number of intro price billing cycles */
  introPriceCycles?: number;
}

/**
 * Package with optional product (undefined for free tier)
 */
export interface SubscriptionPackage {
  /** Package identifier (e.g., "pro_monthly", "free") */
  packageId: string;
  /** Package display name */
  name: string;
  /** Product information, undefined for free tier */
  product?: SubscriptionProduct;
  /** Entitlement identifiers granted by this package */
  entitlements: string[];
}

/**
 * Offer containing packages
 */
export interface SubscriptionOffer {
  /** Offer identifier */
  offerId: string;
  /** Offer metadata from RevenueCat */
  metadata?: Record<string, unknown>;
  /** Packages in this offer */
  packages: SubscriptionPackage[];
}

/**
 * Current subscription status
 */
export interface CurrentSubscription {
  /** Whether user has an active subscription */
  isActive: boolean;
  /** Product identifier of the current subscription */
  productId?: string;
  /** Package identifier of the current subscription */
  packageId?: string;
  /** Active entitlement identifiers */
  entitlements: string[];
  /** Current subscription period */
  period?: SubscriptionPeriod;
  /** Subscription expiration date */
  expirationDate?: Date;
  /** Whether subscription will auto-renew */
  willRenew?: boolean;
}

/**
 * Configuration for the free tier
 */
export interface FreeTierConfig {
  /** Package ID for the free tier */
  packageId: string;
  /** Display name for the free tier */
  name: string;
}

/**
 * Package with calculated level for upgrade eligibility
 */
export interface PackageWithLevel extends SubscriptionPackage {
  /** Calculated entitlement level (0 for free, higher = better) */
  level: number;
}
