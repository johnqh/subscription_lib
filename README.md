# @sudobility/subscription_lib

Cross-platform subscription management library that abstracts RevenueCat SDK differences between web and React Native behind a unified adapter interface.

## Installation

```bash
bun add @sudobility/subscription_lib
```

### Peer Dependencies

- `react` ^18.0.0 || ^19.0.0
- `@sudobility/types` ^1.9.53
- `@revenuecat/purchases-js` ^1.0.0 (web only, optional)
- `react-native-purchases` >= 7.0.0 (React Native only, optional)

## Usage

```typescript
import {
  initializeSubscription,
  configureRevenueCatAdapter,
  createRevenueCatAdapter,
  useSubscriptions,
  useUserSubscription,
  useSubscribable,
} from '@sudobility/subscription_lib';

// App startup
configureRevenueCatAdapter(REVENUECAT_API_KEY);
initializeSubscription({
  adapter: createRevenueCatAdapter(),
  freeTier: { packageId: 'free', displayName: 'Free' },
});

// React hooks
const { offer, isLoading } = useSubscriptions('default');
const { subscription } = useUserSubscription();
const { subscribablePackageIds } = useSubscribable('default');
```

## API

### Core Singleton

| Function | Description |
|----------|-------------|
| `initializeSubscription(config)` | Initialize with adapter + free tier config |
| `setSubscriptionUserId(id, email?)` | Set current user, triggers reload |
| `refreshSubscription()` | Reload offerings + customer info |
| `getSubscriptionInstance()` | Get the SubscriptionService singleton |

### Hooks

| Hook | Description |
|------|-------------|
| `useSubscriptions(offerId)` | Fetch offer/product catalog (cached) |
| `useUserSubscription()` | Current user subscription status |
| `useSubscriptionPeriods(offerId)` | Available billing periods, sorted |
| `useSubscriptionForPeriod(offerId, period)` | Packages for a period, sorted by price |
| `useSubscribable(offerId)` | Upgrade-eligible package IDs |

### Built-in Adapters

- **Web**: `configureRevenueCatAdapter`, `createRevenueCatAdapter`, `setRevenueCatUser`, `clearRevenueCatUser`
- **React Native**: `configureRevenueCatRNAdapter`, `createRevenueCatRNAdapter`, `setRevenueCatRNUser`, `clearRevenueCatRNUser`

### Utilities

`parseISO8601Period`, `getPeriodRank`, `comparePeriods`, `calculatePackageLevels`, `findUpgradeablePackages`

### Key Types

`SubscriptionAdapter`, `SubscriptionOffer`, `SubscriptionPackage`, `CurrentSubscription`, `FreeTierConfig`, `SubscriptionPeriod`

## Development

```bash
bun run build        # Compile TS to dist/
bun run dev          # Watch mode (tsc --watch)
bun test             # Run tests (vitest run)
bun run typecheck    # TypeScript check
bun run lint         # ESLint
bun run format       # Prettier
```

Pre-commit:

```bash
bun run typecheck && bun run lint && bun test && bun run build
```

## License

BUSL-1.1
