import { describe, expect, it } from 'vitest';
import type { SubscriptionPackage } from '../types/subscription';
import {
  calculatePackageLevels,
  addLevelsToPackages,
  getPackageLevel,
  findUpgradeablePackages,
} from './level-calculator';

// --- Helper factories ---

function makePackage(
  packageId: string,
  product?: {
    price: number;
    period: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
    productId?: string;
  }
): SubscriptionPackage {
  return {
    packageId,
    name: packageId,
    entitlements: product ? [packageId] : [],
    product: product
      ? {
          productId: product.productId ?? `${packageId}_product`,
          name: packageId,
          price: product.price,
          priceString: `$${product.price.toFixed(2)}`,
          currency: 'USD',
          period: product.period,
          periodDuration: '',
        }
      : undefined,
  };
}

const freePackage = makePackage('free');
const basicMonthly = makePackage('basic_monthly', {
  price: 5,
  period: 'monthly',
});
const proMonthly = makePackage('pro_monthly', {
  price: 10,
  period: 'monthly',
});
const basicYearly = makePackage('basic_yearly', {
  price: 50,
  period: 'yearly',
});
const proYearly = makePackage('pro_yearly', {
  price: 100,
  period: 'yearly',
});

const allPackages = [
  freePackage,
  basicMonthly,
  proMonthly,
  basicYearly,
  proYearly,
];

// --- Tests ---

describe('calculatePackageLevels', () => {
  it('assigns level 0 to free tier', () => {
    const levels = calculatePackageLevels(allPackages);
    expect(levels.get('free')).toBe(0);
  });

  it('assigns increasing levels by price within the same period', () => {
    const levels = calculatePackageLevels(allPackages);
    expect(levels.get('basic_monthly')).toBe(1);
    expect(levels.get('pro_monthly')).toBe(2);
    expect(levels.get('basic_yearly')).toBe(1);
    expect(levels.get('pro_yearly')).toBe(2);
  });

  it('assigns the same level to packages with the same price in the same period', () => {
    const samePriceA = makePackage('plan_a', { price: 10, period: 'monthly' });
    const samePriceB = makePackage('plan_b', { price: 10, period: 'monthly' });
    const levels = calculatePackageLevels([samePriceA, samePriceB]);
    expect(levels.get('plan_a')).toBe(levels.get('plan_b'));
  });

  it('handles an empty array', () => {
    const levels = calculatePackageLevels([]);
    expect(levels.size).toBe(0);
  });

  it('handles only free tier packages', () => {
    const levels = calculatePackageLevels([freePackage]);
    expect(levels.get('free')).toBe(0);
    expect(levels.size).toBe(1);
  });

  it('handles a single paid package', () => {
    const levels = calculatePackageLevels([basicMonthly]);
    expect(levels.get('basic_monthly')).toBe(1);
  });

  it('handles multiple periods independently', () => {
    const weekly = makePackage('weekly_plan', { price: 3, period: 'weekly' });
    const monthly = makePackage('monthly_plan', {
      price: 10,
      period: 'monthly',
    });
    const levels = calculatePackageLevels([weekly, monthly]);
    // Each period group is leveled independently; single item = level 1
    expect(levels.get('weekly_plan')).toBe(1);
    expect(levels.get('monthly_plan')).toBe(1);
  });

  it('assigns three distinct levels for three distinct prices in one period', () => {
    const low = makePackage('low', { price: 5, period: 'monthly' });
    const mid = makePackage('mid', { price: 10, period: 'monthly' });
    const high = makePackage('high', { price: 20, period: 'monthly' });
    const levels = calculatePackageLevels([low, mid, high]);
    expect(levels.get('low')).toBe(1);
    expect(levels.get('mid')).toBe(2);
    expect(levels.get('high')).toBe(3);
  });
});

describe('addLevelsToPackages', () => {
  it('returns packages with a level property added', () => {
    const result = addLevelsToPackages(allPackages);
    expect(result).toHaveLength(allPackages.length);
    for (const pkg of result) {
      expect(typeof pkg.level).toBe('number');
    }
  });

  it('preserves original package properties', () => {
    const result = addLevelsToPackages([basicMonthly]);
    expect(result[0]?.packageId).toBe('basic_monthly');
    expect(result[0]?.product?.price).toBe(5);
    expect(result[0]?.level).toBe(1);
  });

  it('assigns level 0 to free tier packages', () => {
    const result = addLevelsToPackages([freePackage]);
    expect(result[0]?.level).toBe(0);
  });

  it('handles an empty array', () => {
    const result = addLevelsToPackages([]);
    expect(result).toEqual([]);
  });
});

describe('getPackageLevel', () => {
  it('returns the correct level for a given packageId', () => {
    expect(getPackageLevel('free', allPackages)).toBe(0);
    expect(getPackageLevel('basic_monthly', allPackages)).toBe(1);
    expect(getPackageLevel('pro_monthly', allPackages)).toBe(2);
  });

  it('returns 0 for a package that does not exist', () => {
    expect(getPackageLevel('nonexistent', allPackages)).toBe(0);
  });

  it('returns 0 when packages list is empty', () => {
    expect(getPackageLevel('basic_monthly', [])).toBe(0);
  });
});

describe('findUpgradeablePackages', () => {
  it('returns all packages when current is null', () => {
    const result = findUpgradeablePackages(null, allPackages);
    expect(result).toHaveLength(allPackages.length);
  });

  it('returns all packages when current is undefined', () => {
    const result = findUpgradeablePackages(undefined, allPackages);
    expect(result).toHaveLength(allPackages.length);
  });

  it('returns all paid packages when current is free tier', () => {
    const result = findUpgradeablePackages('free', allPackages);
    // Should include all packages with a product (not the free package)
    expect(result).not.toContain('free');
    expect(result).toContain('basic_monthly');
    expect(result).toContain('pro_monthly');
    expect(result).toContain('basic_yearly');
    expect(result).toContain('pro_yearly');
  });

  it('returns upgrades with >= period and >= level for a paid subscription', () => {
    const result = findUpgradeablePackages('basic_monthly', allPackages);
    // basic_monthly is level 1, monthly period
    // Upgrades: pro_monthly (same period, higher level), basic_yearly (higher period, same level), pro_yearly (higher period, higher level)
    // NOT: free (can't upgrade to free), basic_monthly itself (same package)
    expect(result).not.toContain('free');
    expect(result).not.toContain('basic_monthly');
    expect(result).toContain('pro_monthly');
    expect(result).toContain('basic_yearly');
    expect(result).toContain('pro_yearly');
  });

  it('does not include downgrades (lower period)', () => {
    const weekly = makePackage('weekly_plan', { price: 5, period: 'weekly' });
    const packages = [weekly, ...allPackages];
    const result = findUpgradeablePackages('basic_monthly', packages);
    expect(result).not.toContain('weekly_plan');
  });

  it('does not include downgrades (lower level, same period)', () => {
    const result = findUpgradeablePackages('pro_monthly', allPackages);
    // pro_monthly is level 2, monthly period
    // basic_monthly is level 1, same period => NOT an upgrade (lower level)
    expect(result).not.toContain('basic_monthly');
    // pro_yearly is level 2, yearly period => upgrade (higher period, same level)
    expect(result).toContain('pro_yearly');
    // basic_yearly is level 1, yearly period => NOT an upgrade (lower level despite higher period)
    expect(result).not.toContain('basic_yearly');
  });

  it('returns all packages when currentPackageId is not found', () => {
    const result = findUpgradeablePackages('nonexistent', allPackages);
    expect(result).toHaveLength(allPackages.length);
  });

  it('accepts FindUpgradeableParams object with packageId', () => {
    const result = findUpgradeablePackages(
      { packageId: 'basic_monthly' },
      allPackages
    );
    expect(result).not.toContain('basic_monthly');
    expect(result).toContain('pro_monthly');
  });

  it('accepts FindUpgradeableParams object with productId fallback', () => {
    const result = findUpgradeablePackages(
      { productId: 'basic_monthly_product' },
      allPackages
    );
    expect(result).not.toContain('basic_monthly');
    expect(result).toContain('pro_monthly');
  });

  it('prefers packageId over productId in FindUpgradeableParams', () => {
    const result = findUpgradeablePackages(
      { packageId: 'pro_monthly', productId: 'basic_monthly_product' },
      allPackages
    );
    // Should use pro_monthly (packageId), not basic_monthly (productId)
    expect(result).not.toContain('pro_monthly');
    // pro_monthly is level 2, monthly => basic_monthly (level 1) is NOT an upgrade
    expect(result).not.toContain('basic_monthly');
  });

  it('returns all packages when FindUpgradeableParams has no ids', () => {
    const result = findUpgradeablePackages({}, allPackages);
    expect(result).toHaveLength(allPackages.length);
  });

  it('handles an empty packages array', () => {
    const result = findUpgradeablePackages(null, []);
    expect(result).toEqual([]);
  });

  it('handles lifetime period correctly (highest rank)', () => {
    const lifetime = makePackage('lifetime_plan', {
      price: 200,
      period: 'lifetime',
    });
    const packages = [...allPackages, lifetime];

    // From basic_monthly, lifetime is an upgrade (higher period)
    const fromBasic = findUpgradeablePackages('basic_monthly', packages);
    expect(fromBasic).toContain('lifetime_plan');

    // From lifetime, no yearly/monthly packages should be upgrades (lower period)
    const fromLifetime = findUpgradeablePackages('lifetime_plan', packages);
    expect(fromLifetime).not.toContain('basic_monthly');
    expect(fromLifetime).not.toContain('pro_monthly');
    expect(fromLifetime).not.toContain('basic_yearly');
    expect(fromLifetime).not.toContain('pro_yearly');
  });
});
