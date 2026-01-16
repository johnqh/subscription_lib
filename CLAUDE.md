# Subscription Lib

Cross-platform subscription management library with RevenueCat adapter pattern for React and React Native.

**npm**: `@sudobility/subscription_lib` (public)

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Bun
- **Build**: TypeScript compiler (tsc)
- **Test**: vitest

## Project Structure

```
src/
├── index.ts              # Public exports
├── types/
│   ├── index.ts          # Type re-exports
│   ├── adapter.ts        # RevenueCat adapter interface
│   ├── subscription.ts   # Package, Product, Offer types
│   └── period.ts         # Period types and utilities
├── core/
│   ├── index.ts          # Core re-exports
│   ├── singleton.ts      # Global singleton manager
│   └── service.ts        # SubscriptionService class
├── hooks/
│   ├── index.ts          # Hook re-exports
│   ├── useSubscriptions.ts
│   ├── useUserSubscription.ts
│   ├── useSubscriptionPeriods.ts
│   ├── useSubscriptionForPeriod.ts
│   └── useSubscribable.ts
└── utils/
    ├── index.ts          # Utility re-exports
    ├── period-parser.ts  # ISO 8601 duration parsing
    └── level-calculator.ts # Entitlement level from price
```

## Commands

```bash
bun run build        # Build to dist/
bun run dev          # Watch mode build
bun run clean        # Remove dist/
bun test             # Run tests
bun run typecheck    # TypeScript check
bun run lint         # Run ESLint
bun run lint:fix     # Fix lint issues
bun run format       # Format with Prettier
```

## Key Concepts

### Adapter Pattern

The library uses an adapter interface to abstract RevenueCat SDK differences between web and React Native:

```typescript
interface SubscriptionAdapter {
  getOfferings(): Promise<AdapterOfferings>;
  getCustomerInfo(): Promise<AdapterCustomerInfo>;
  purchase(params: AdapterPurchaseParams): Promise<AdapterPurchaseResult>;
}
```

Consumers provide platform-specific adapters that wrap `@revenuecat/purchases-js` (web) or `react-native-purchases` (RN).

### Global Singleton

Initialize once at app startup:

```typescript
import { initializeSubscription } from '@sudobility/subscription_lib';

initializeSubscription({
  adapter: myRevenueCatAdapter,
  freeTier: { packageId: 'free', name: 'Free' }
});
```

### Hooks

```typescript
// Get offer with packages
const { offer } = useSubscriptions('default');

// Get user's current subscription
const { subscription } = useUserSubscription();

// Get available billing periods
const { periods } = useSubscriptionPeriods('default');

// Get packages for a specific period
const { packages } = useSubscriptionForPeriod('default', 'monthly');

// Get packages user can subscribe/upgrade to
const { subscribablePackageIds } = useSubscribable('default');
```

### Upgrade Eligibility

A package is subscribable if:
- User has no subscription: all packages
- User has subscription: package.period >= currentPeriod AND package.level >= currentLevel

Level is determined by price comparison within the same period (higher price = higher level).

### Period Types

Supported periods: `weekly`, `monthly`, `quarterly`, `yearly`, `lifetime`

ISO 8601 parsing:
- P1W, P7D → weekly
- P1M → monthly
- P3M → quarterly
- P1Y, P12M → yearly
- null/empty → lifetime

## Peer Dependencies

Required in consuming app:
- `react` >= 19.0.0

## Publishing

```bash
bun run prepublishOnly  # Build
npm publish             # Publish to npm
```

## Architecture

```
subscription_lib (this package)
    ↑
subscription-components (uses hooks)
building_blocks (uses hooks)
    ↑
shapeshyft_app, mail_box (consume components)
```
