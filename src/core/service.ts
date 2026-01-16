/**
 * Subscription Service
 *
 * Core service for managing subscription data with clean abstractions.
 */

import type {
  AdapterOffering,
  AdapterPackage,
  AdapterPurchaseParams,
  AdapterPurchaseResult,
  SubscriptionAdapter,
} from '../types/adapter';
import type {
  CurrentSubscription,
  FreeTierConfig,
  SubscriptionOffer,
  SubscriptionPackage,
  SubscriptionProduct,
} from '../types/subscription';
import { parseISO8601Period } from '../utils/period-parser';

/**
 * Configuration for SubscriptionService
 */
export interface SubscriptionServiceConfig {
  /** RevenueCat adapter implementation */
  adapter: SubscriptionAdapter;
  /** Free tier configuration */
  freeTier: FreeTierConfig;
}

/**
 * Service for managing subscription data with clean abstractions.
 */
export class SubscriptionService {
  private adapter: SubscriptionAdapter;
  private freeTier: FreeTierConfig;
  private offersCache: Map<string, SubscriptionOffer> = new Map();
  private currentSubscription: CurrentSubscription | null = null;
  private isLoadingOfferings = false;
  private isLoadingCustomerInfo = false;

  constructor(config: SubscriptionServiceConfig) {
    this.adapter = config.adapter;
    this.freeTier = config.freeTier;
  }

  // ---------------------------------------------------------------------------
  // Data Loading
  // ---------------------------------------------------------------------------

  /**
   * Load offerings from RevenueCat
   */
  async loadOfferings(params?: { currency?: string }): Promise<void> {
    if (this.isLoadingOfferings) return;

    this.isLoadingOfferings = true;
    try {
      const offerings = await this.adapter.getOfferings(params);
      this.offersCache.clear();

      for (const [offerId, offering] of Object.entries(offerings.all)) {
        const parsedOffer = this.parseOffering(offerId, offering);
        this.offersCache.set(offerId, parsedOffer);
      }

      // Also add current offering as 'default' if available
      if (offerings.current && !this.offersCache.has('default')) {
        const parsedOffer = this.parseOffering('default', offerings.current);
        this.offersCache.set('default', parsedOffer);
      }
    } finally {
      this.isLoadingOfferings = false;
    }
  }

  /**
   * Load customer info from RevenueCat
   */
  async loadCustomerInfo(): Promise<void> {
    if (this.isLoadingCustomerInfo) return;

    this.isLoadingCustomerInfo = true;
    try {
      // Ensure offerings are loaded first so we can match packageId
      if (!this.hasLoadedOfferings()) {
        await this.loadOfferings();
      }

      const customerInfo = await this.adapter.getCustomerInfo();
      const activeEntitlementIds = Object.keys(
        customerInfo.entitlements.active
      );

      if (activeEntitlementIds.length === 0) {
        this.currentSubscription = {
          isActive: false,
          entitlements: [],
        };
        return;
      }

      const firstEntitlement =
        customerInfo.entitlements.active[activeEntitlementIds[0]];

      // Find the package for this product
      let packageId: string | undefined;
      let period: CurrentSubscription['period'];

      for (const offer of this.offersCache.values()) {
        const pkg = offer.packages.find(
          p => p.product?.productId === firstEntitlement.productIdentifier
        );
        if (pkg) {
          packageId = pkg.packageId;
          period = pkg.product?.period;
          break;
        }
      }

      this.currentSubscription = {
        isActive: true,
        productId: firstEntitlement.productIdentifier,
        packageId,
        entitlements: activeEntitlementIds,
        period,
        expirationDate: firstEntitlement.expirationDate
          ? new Date(firstEntitlement.expirationDate)
          : undefined,
        willRenew: firstEntitlement.willRenew,
      };
    } finally {
      this.isLoadingCustomerInfo = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Get offer by ID with complete hierarchy
   */
  getOffer(offerId: string): SubscriptionOffer | null {
    return this.offersCache.get(offerId) ?? null;
  }

  /**
   * Get all offer IDs
   */
  getOfferIds(): string[] {
    return Array.from(this.offersCache.keys());
  }

  /**
   * Get current subscription info
   */
  getCurrentSubscription(): CurrentSubscription | null {
    return this.currentSubscription;
  }

  /**
   * Get free tier as a SubscriptionPackage
   */
  getFreeTierPackage(): SubscriptionPackage {
    return {
      packageId: this.freeTier.packageId,
      name: this.freeTier.name,
      product: undefined,
      entitlements: [],
    };
  }

  /**
   * Get free tier config
   */
  getFreeTierConfig(): FreeTierConfig {
    return this.freeTier;
  }

  /**
   * Make a purchase
   */
  async purchase(
    params: AdapterPurchaseParams
  ): Promise<AdapterPurchaseResult> {
    const result = await this.adapter.purchase(params);

    // Reload customer info after purchase
    await this.loadCustomerInfo();

    return result;
  }

  /**
   * Check if offerings are loaded
   */
  hasLoadedOfferings(): boolean {
    return this.offersCache.size > 0;
  }

  /**
   * Check if customer info is loaded
   */
  hasLoadedCustomerInfo(): boolean {
    return this.currentSubscription !== null;
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private parseOffering(
    offerId: string,
    offering: AdapterOffering
  ): SubscriptionOffer {
    const packages: SubscriptionPackage[] = [];

    // Extract entitlements from metadata if available
    const metadataEntitlements = this.extractEntitlementsFromMetadata(
      offering.metadata
    );

    for (const pkg of offering.availablePackages) {
      packages.push(this.parsePackage(pkg, metadataEntitlements));
    }

    return {
      offerId,
      metadata: offering.metadata ?? undefined,
      packages,
    };
  }

  private parsePackage(
    pkg: AdapterPackage,
    metadataEntitlements: string[]
  ): SubscriptionPackage {
    const product = pkg.product;
    const defaultOption = product.subscriptionOptions
      ? Object.values(product.subscriptionOptions)[0]
      : undefined;

    const parsedProduct: SubscriptionProduct = {
      productId: product.identifier,
      name: product.title,
      description: product.description ?? undefined,
      price: product.price,
      priceString: product.priceString,
      currency: product.currencyCode,
      period: parseISO8601Period(product.normalPeriodDuration),
      periodDuration: product.normalPeriodDuration ?? '',
      trialPeriod: defaultOption?.trial?.periodDuration ?? undefined,
      introPrice: defaultOption?.introPrice?.priceString ?? undefined,
      introPricePeriod: defaultOption?.introPrice?.periodDuration ?? undefined,
      introPriceCycles: defaultOption?.introPrice?.cycleCount,
    };

    return {
      packageId: pkg.identifier,
      name: product.title,
      product: parsedProduct,
      entitlements: metadataEntitlements,
    };
  }

  private extractEntitlementsFromMetadata(
    metadata: Record<string, unknown> | null
  ): string[] {
    if (!metadata) return [];

    const entitlements: string[] = [];

    // Single entitlement in metadata
    if (metadata.entitlement && typeof metadata.entitlement === 'string') {
      entitlements.push(metadata.entitlement);
    }

    // Array of entitlements in metadata
    if (Array.isArray(metadata.entitlements)) {
      for (const ent of metadata.entitlements) {
        if (typeof ent === 'string') {
          entitlements.push(ent);
        } else if (
          typeof ent === 'object' &&
          ent !== null &&
          typeof (ent as { identifier?: string }).identifier === 'string'
        ) {
          entitlements.push((ent as { identifier: string }).identifier);
        }
      }
    }

    return entitlements;
  }
}
