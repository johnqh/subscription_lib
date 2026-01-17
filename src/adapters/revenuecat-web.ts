/**
 * RevenueCat Web Adapter
 *
 * Adapter for RevenueCat web SDK (@revenuecat/purchases-js).
 * Provides lazy loading of the SDK to minimize initial bundle size.
 */

import type {
  AdapterCustomerInfo,
  AdapterOfferings,
  AdapterPurchaseParams,
  AdapterPurchaseResult,
  SubscriptionAdapter,
} from '../types/adapter';

// RevenueCat SDK types (lazy loaded)
type Purchases = import('@revenuecat/purchases-js').Purchases;
type Package = import('@revenuecat/purchases-js').Package;

// Module state
let purchasesInstance: Purchases | null = null;
let currentUserId: string | null = null;
let apiKey: string | null = null;

/**
 * Configure the RevenueCat adapter with API key.
 * Call this before initializing subscription_lib.
 * RevenueCat SDK is lazily loaded when first needed.
 */
export function configureRevenueCatAdapter(revenueCatApiKey: string): void {
  apiKey = revenueCatApiKey;
}

/**
 * Get or create an anonymous user ID for RevenueCat.
 * RevenueCat web SDK requires a user ID, so we generate one for anonymous users.
 */
function getAnonymousUserId(): string {
  const STORAGE_KEY = 'rc_anonymous_user_id';
  let anonId = localStorage.getItem(STORAGE_KEY);
  if (!anonId) {
    anonId = `anon_${globalThis.crypto.randomUUID()}`;
    localStorage.setItem(STORAGE_KEY, anonId);
  }
  return anonId;
}

/**
 * Lazily initialize RevenueCat SDK when first needed.
 * Uses anonymous user ID if no user is logged in.
 */
async function ensureInitialized(): Promise<Purchases> {
  if (!apiKey) {
    throw new Error('RevenueCat not configured');
  }

  if (!purchasesInstance) {
    const SDK = await import('@revenuecat/purchases-js');
    // Use current user ID or anonymous ID - RevenueCat web SDK requires a user ID
    const userId = currentUserId || getAnonymousUserId();
    purchasesInstance = SDK.Purchases.configure({ apiKey, appUserId: userId });
  }

  return purchasesInstance;
}

/**
 * Set the current user for RevenueCat.
 * Call this when user logs in.
 */
export async function setRevenueCatUser(
  userId: string,
  email?: string
): Promise<void> {
  if (!apiKey) {
    console.warn('[subscription] RevenueCat not configured');
    return;
  }

  // Skip if same user
  if (currentUserId === userId && purchasesInstance) {
    return;
  }

  currentUserId = userId;

  const SDK = await import('@revenuecat/purchases-js');

  // Close existing instance
  if (purchasesInstance) {
    purchasesInstance.close();
  }

  // Configure new instance with user
  purchasesInstance = SDK.Purchases.configure({
    apiKey,
    appUserId: userId,
  });

  // Set email attribute
  if (email) {
    try {
      await purchasesInstance.setAttributes({ email });
    } catch {
      // Ignore attribute errors
    }
  }
}

/**
 * Clear the current user (on logout).
 */
export function clearRevenueCatUser(): void {
  if (purchasesInstance) {
    purchasesInstance.close();
    purchasesInstance = null;
  }
  currentUserId = null;
}

/**
 * Check if RevenueCat has a user configured.
 */
export function hasRevenueCatUser(): boolean {
  return currentUserId !== null && purchasesInstance !== null;
}

/**
 * Create the subscription adapter for subscription_lib.
 */
export function createRevenueCatAdapter(): SubscriptionAdapter {
  return {
    async setUserId(userId: string | undefined, email?: string): Promise<void> {
      if (userId) {
        await setRevenueCatUser(userId, email);
      } else {
        clearRevenueCatUser();
      }
    },

    async getOfferings(): Promise<AdapterOfferings> {
      try {
        const purchases = await ensureInitialized();
        const offerings = await purchases.getOfferings();

        console.log('[revenuecat-web] Raw offerings from RevenueCat:', {
          allKeys: Object.keys(offerings.all),
          currentIdentifier: offerings.current?.identifier,
          currentPackageCount: offerings.current?.availablePackages.length,
        });

        const convertPackage = (pkg: Package) => ({
          identifier: pkg.identifier,
          packageType: pkg.packageType,
          product: {
            identifier: pkg.rcBillingProduct.identifier,
            title: pkg.rcBillingProduct.title,
            description: pkg.rcBillingProduct.description || null,
            price: pkg.rcBillingProduct.currentPrice?.amountMicros
              ? pkg.rcBillingProduct.currentPrice.amountMicros / 1_000_000
              : 0,
            priceString:
              pkg.rcBillingProduct.currentPrice?.formattedPrice || '$0',
            currencyCode: pkg.rcBillingProduct.currentPrice?.currency || 'USD',
            normalPeriodDuration:
              pkg.rcBillingProduct.normalPeriodDuration || null,
            subscriptionOptions: pkg.rcBillingProduct.defaultSubscriptionOption
              ? {
                  [pkg.rcBillingProduct.defaultSubscriptionOption.id]: {
                    id: pkg.rcBillingProduct.defaultSubscriptionOption.id,
                    trial: pkg.rcBillingProduct.defaultSubscriptionOption.trial
                      ? {
                          periodDuration:
                            pkg.rcBillingProduct.defaultSubscriptionOption.trial
                              .periodDuration || null,
                          price: pkg.rcBillingProduct.defaultSubscriptionOption
                            .trial.price?.amountMicros
                            ? pkg.rcBillingProduct.defaultSubscriptionOption
                                .trial.price.amountMicros / 1_000_000
                            : 0,
                          priceString:
                            pkg.rcBillingProduct.defaultSubscriptionOption.trial
                              .price?.formattedPrice || '$0',
                          cycleCount:
                            pkg.rcBillingProduct.defaultSubscriptionOption.trial
                              .cycleCount || 1,
                        }
                      : null,
                    introPrice: pkg.rcBillingProduct.defaultSubscriptionOption
                      .introPrice
                      ? {
                          periodDuration:
                            pkg.rcBillingProduct.defaultSubscriptionOption
                              .introPrice.periodDuration || null,
                          price: pkg.rcBillingProduct.defaultSubscriptionOption
                            .introPrice.price?.amountMicros
                            ? pkg.rcBillingProduct.defaultSubscriptionOption
                                .introPrice.price.amountMicros / 1_000_000
                            : 0,
                          priceString:
                            pkg.rcBillingProduct.defaultSubscriptionOption
                              .introPrice.price?.formattedPrice || '$0',
                          cycleCount:
                            pkg.rcBillingProduct.defaultSubscriptionOption
                              .introPrice.cycleCount || 1,
                        }
                      : null,
                  },
                }
              : undefined,
          },
        });

        const all: AdapterOfferings['all'] = {};

        for (const [key, offering] of Object.entries(offerings.all)) {
          all[key] = {
            identifier: offering.identifier,
            metadata: offering.metadata || null,
            availablePackages: offering.availablePackages.map(convertPackage),
          };
        }

        return {
          all,
          current: offerings.current
            ? {
                identifier: offerings.current.identifier,
                metadata: offerings.current.metadata || null,
                availablePackages:
                  offerings.current.availablePackages.map(convertPackage),
              }
            : null,
        };
      } catch (error) {
        console.error('[revenuecat-web] Failed to get offerings:', error);
        return { all: {}, current: null };
      }
    },

    async getCustomerInfo(): Promise<AdapterCustomerInfo> {
      try {
        const purchases = await ensureInitialized();
        const customerInfo = await purchases.getCustomerInfo();

        const active: AdapterCustomerInfo['entitlements']['active'] = {};

        for (const [id, entitlement] of Object.entries(
          customerInfo.entitlements.active
        )) {
          active[id] = {
            identifier: entitlement.identifier,
            productIdentifier: entitlement.productIdentifier,
            expirationDate: entitlement.expirationDate?.toISOString() || null,
            willRenew: entitlement.willRenew,
          };
        }

        // Get management URL from the customer info
        // RevenueCat web SDK provides this for subscription management
        const managementUrl = customerInfo.managementURL ?? undefined;

        return {
          activeSubscriptions: Array.from(customerInfo.activeSubscriptions),
          entitlements: { active },
          managementUrl,
        };
      } catch (error) {
        console.error('[revenuecat-web] Failed to get customer info:', error);
        return { activeSubscriptions: [], entitlements: { active: {} } };
      }
    },

    async purchase(
      params: AdapterPurchaseParams
    ): Promise<AdapterPurchaseResult> {
      const purchases = await ensureInitialized();

      // Find the package across all offerings
      const offerings = await purchases.getOfferings();
      let packageToPurchase: Package | undefined;

      for (const offering of Object.values(offerings.all)) {
        packageToPurchase = offering.availablePackages.find(
          pkg => pkg.identifier === params.packageId
        );
        if (packageToPurchase) break;
      }

      if (!packageToPurchase) {
        throw new Error(`Package not found: ${params.packageId}`);
      }

      const result = await purchases.purchase({
        rcPackage: packageToPurchase,
      });

      // Convert customer info
      const active: AdapterCustomerInfo['entitlements']['active'] = {};
      for (const [id, entitlement] of Object.entries(
        result.customerInfo.entitlements.active
      )) {
        active[id] = {
          identifier: entitlement.identifier,
          productIdentifier: entitlement.productIdentifier,
          expirationDate: entitlement.expirationDate?.toISOString() || null,
          willRenew: entitlement.willRenew,
        };
      }

      return {
        customerInfo: {
          activeSubscriptions: Array.from(
            result.customerInfo.activeSubscriptions
          ),
          entitlements: { active },
        },
      };
    },
  };
}
