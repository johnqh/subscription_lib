import { describe, expect, it } from 'vitest';
import { SubscriptionService } from './service';
import type { SubscriptionAdapter } from '../types/adapter';

function createMockAdapter(
  offerings: Record<
    string,
    {
      identifier: string;
      metadata: Record<string, unknown> | null;
      availablePackages: Array<{
        identifier: string;
        packageType: string;
        product: {
          identifier: string;
          title: string;
          description: string | null;
          price: number;
          priceString: string;
          currencyCode: string;
          normalPeriodDuration: string | null;
        };
      }>;
    }
  >
): SubscriptionAdapter {
  return {
    getOfferings: async () => ({
      all: offerings,
      current: null,
    }),
    getCustomerInfo: async () => ({
      activeSubscriptions: [],
      entitlements: { active: {} },
    }),
    purchase: async () => ({
      customerInfo: {
        activeSubscriptions: [],
        entitlements: { active: {} },
      },
    }),
  };
}

describe('SubscriptionService.getAllOffers', () => {
  it('returns empty array when no offerings loaded', () => {
    const service = new SubscriptionService({
      adapter: createMockAdapter({}),
      freeTier: { packageId: 'free', name: 'Free' },
    });

    expect(service.getAllOffers()).toEqual([]);
  });

  it('returns offerings sorted by identifier', async () => {
    const adapter = createMockAdapter({
      pro: {
        identifier: 'pro',
        metadata: null,
        availablePackages: [
          {
            identifier: '$rc_monthly',
            packageType: 'MONTHLY',
            product: {
              identifier: 'pro_monthly',
              title: 'Pro Monthly',
              description: null,
              price: 9.99,
              priceString: '$9.99',
              currencyCode: 'USD',
              normalPeriodDuration: 'P1M',
            },
          },
        ],
      },
      basic: {
        identifier: 'basic',
        metadata: null,
        availablePackages: [
          {
            identifier: '$rc_monthly',
            packageType: 'MONTHLY',
            product: {
              identifier: 'basic_monthly',
              title: 'Basic Monthly',
              description: null,
              price: 4.99,
              priceString: '$4.99',
              currencyCode: 'USD',
              normalPeriodDuration: 'P1M',
            },
          },
        ],
      },
      enterprise: {
        identifier: 'enterprise',
        metadata: null,
        availablePackages: [
          {
            identifier: '$rc_annual',
            packageType: 'ANNUAL',
            product: {
              identifier: 'enterprise_yearly',
              title: 'Enterprise Yearly',
              description: null,
              price: 99.99,
              priceString: '$99.99',
              currencyCode: 'USD',
              normalPeriodDuration: 'P1Y',
            },
          },
        ],
      },
    });

    const service = new SubscriptionService({
      adapter,
      freeTier: { packageId: 'free', name: 'Free' },
    });

    await service.loadOfferings();
    const offers = service.getAllOffers();

    expect(offers).toHaveLength(3);
    expect(offers[0].offerId).toBe('basic');
    expect(offers[1].offerId).toBe('enterprise');
    expect(offers[2].offerId).toBe('pro');
  });

  it('includes packages with parsed products', async () => {
    const adapter = createMockAdapter({
      starter: {
        identifier: 'starter',
        metadata: null,
        availablePackages: [
          {
            identifier: '$rc_monthly',
            packageType: 'MONTHLY',
            product: {
              identifier: 'starter_monthly',
              title: 'Starter Monthly',
              description: 'Starter plan',
              price: 2.99,
              priceString: '$2.99',
              currencyCode: 'USD',
              normalPeriodDuration: 'P1M',
            },
          },
          {
            identifier: '$rc_annual',
            packageType: 'ANNUAL',
            product: {
              identifier: 'starter_yearly',
              title: 'Starter Yearly',
              description: 'Starter plan yearly',
              price: 29.99,
              priceString: '$29.99',
              currencyCode: 'USD',
              normalPeriodDuration: 'P1Y',
            },
          },
        ],
      },
    });

    const service = new SubscriptionService({
      adapter,
      freeTier: { packageId: 'free', name: 'Free' },
    });

    await service.loadOfferings();
    const offers = service.getAllOffers();

    expect(offers).toHaveLength(1);
    expect(offers[0].packages).toHaveLength(2);
    expect(offers[0].packages[0].product?.period).toBe('monthly');
    expect(offers[0].packages[1].product?.period).toBe('yearly');
  });
});
