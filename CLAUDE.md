# subscription_lib - AI Development Guide

## Overview

Cross-platform subscription management library that abstracts RevenueCat SDK differences between web (`@revenuecat/purchases-js`) and React Native (`react-native-purchases`) behind a unified adapter interface. Provides React hooks for fetching offerings, tracking user subscription status, filtering by billing period, and determining upgrade eligibility. Consumers supply a platform-specific adapter at initialization time and interact with subscriptions through a clean, SDK-agnostic API.

- **Package**: `@sudobility/subscription_lib`
- **Version**: 0.0.14
- **License**: BUSL-1.1
- **Package Manager**: Bun
- **Registry**: npm (public, `@sudobility` scope)

## Project Structure

```
src/
├── index.ts                          # Public API barrel export
├── adapters/
│   ├── index.ts                      # Adapter barrel export
│   ├── revenuecat-web.ts             # Web adapter (@revenuecat/purchases-js)
│   └── revenuecat-rn.ts              # React Native adapter (react-native-purchases)
├── core/
│   ├── index.ts                      # Core barrel export
│   ├── singleton.ts                  # Global singleton manager + event system
│   └── service.ts                    # SubscriptionService class (data loading, caching, parsing)
├── hooks/
│   ├── index.ts                      # Hooks barrel export
│   ├── useSubscriptions.ts           # Fetch offer data (product catalog)
│   ├── useUserSubscription.ts        # Current user subscription status
│   ├── useSubscriptionPeriods.ts     # Available billing periods from an offer
│   ├── useSubscriptionForPeriod.ts   # Packages filtered by period, sorted by price
│   └── useSubscribable.ts           # Upgrade-eligible packages for current user
├── types/
│   ├── index.ts                      # Types barrel export
│   ├── adapter.ts                    # SubscriptionAdapter interface + adapter DTOs
│   ├── subscription.ts               # Domain types (Product, Package, Offer, CurrentSubscription)
│   └── period.ts                     # SubscriptionPeriod type, PERIOD_RANKS, ALL_PERIODS
└── utils/
    ├── index.ts                      # Utils barrel export
    ├── period-parser.ts              # ISO 8601 duration -> SubscriptionPeriod
    ├── period-parser.test.ts         # Vitest tests for period parsing
    └── level-calculator.ts           # Price-based entitlement level + upgrade eligibility
```

## Key Exports

### Singleton (core/singleton.ts)

| Export | Description |
|---|---|
| `initializeSubscription(config)` | Initialize once at app startup with adapter + free tier config |
| `getSubscriptionInstance()` | Get the SubscriptionService singleton (throws if not initialized) |
| `isSubscriptionInitialized()` | Check if initialized |
| `resetSubscription()` | Reset singleton (for testing) |
| `refreshSubscription()` | Reload offerings + customer info, notify listeners |
| `setSubscriptionUserId(id, email?)` | Set/clear user ID, triggers adapter `setUserId` + clears customer cache |
| `getSubscriptionUserId()` | Get current user ID |
| `onSubscriptionUserIdChange(listener)` | Subscribe to user ID changes; returns unsubscribe fn |
| `onSubscriptionRefresh(listener)` | Subscribe to refresh events; returns unsubscribe fn |

### Hooks (hooks/)

| Hook | Purpose | Key Return Fields |
|---|---|---|
| `useSubscriptions(offerId, options?)` | Fetch offer (product catalog); cached, does not reload on user change | `{ offer, isLoading, error, refetch }` |
| `useUserSubscription(options?)` | Current user's subscription status; reloads on user/refresh events | `{ subscription, isLoading, error, update }` |
| `useSubscriptionPeriods(offerId, options?)` | Unique billing periods from offer, sorted short-to-long | `{ periods, isLoading, error }` |
| `useSubscriptionForPeriod(offerId, period, options?)` | Packages for a period, sorted by price asc, free tier prepended | `{ packages, isLoading, error }` |
| `useSubscribable(offerId, options?)` | Package IDs user can subscribe/upgrade to | `{ subscribablePackageIds, isLoading, error }` |

### Built-in Adapters (adapters/)

**Web adapter** (`revenuecat-web.ts`):
- `configureRevenueCatAdapter(apiKey)` -- set API key
- `createRevenueCatAdapter()` -- create `SubscriptionAdapter` instance
- `setRevenueCatUser(userId, email?)` / `clearRevenueCatUser()` / `hasRevenueCatUser()`
- Lazy-loads `@revenuecat/purchases-js`; supports anonymous offerings fetch

**React Native adapter** (`revenuecat-rn.ts`):
- `configureRevenueCatRNAdapter(apiKey)` -- set API key
- `createRevenueCatRNAdapter()` -- create `SubscriptionAdapter` instance
- `setRevenueCatRNUser(userId, email?)` / `clearRevenueCatRNUser()` / `hasRevenueCatRNUser()`
- Lazy-loads `react-native-purchases` via `require()`

### Utility Functions (utils/)

- `parseISO8601Period(duration)` -- ISO 8601 string to `SubscriptionPeriod`
- `getPeriodRank(period)` / `comparePeriods(a, b)` / `isPeriodGreaterOrEqual(a, b)`
- `calculatePackageLevels(packages)` -- price-based levels per period group
- `addLevelsToPackages(packages)` / `getPackageLevel(id, packages)`
- `findUpgradeablePackages(current, packages)` -- filter to valid upgrades

### Type Exports

- **Adapter**: `SubscriptionAdapter`, `AdapterOfferings`, `AdapterOffering`, `AdapterPackage`, `AdapterProduct`, `AdapterSubscriptionOption`, `AdapterPricingPhase`, `AdapterCustomerInfo`, `AdapterEntitlementInfo`, `AdapterPurchaseParams`, `AdapterPurchaseResult`
- **Domain**: `SubscriptionProduct`, `SubscriptionPackage`, `SubscriptionOffer`, `CurrentSubscription`, `FreeTierConfig`, `PackageWithLevel`
- **Period**: `SubscriptionPeriod` (union: `'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime'`), `PERIOD_RANKS`, `ALL_PERIODS`
- **Config**: `SubscriptionConfig`, `SubscriptionServiceConfig`

## Development Commands

```bash
bun run build           # Compile TS to dist/ via tsc
bun run dev             # Watch mode (tsc --watch)
bun run clean           # rm -rf dist/
bun test                # Run tests (vitest run)
bun run test:watch      # Watch mode tests (vitest)
bun run typecheck       # bunx tsc --noEmit
bun run lint            # bunx eslint src
bun run lint:fix        # bunx eslint src --fix
bun run format          # bunx prettier --write "src/**/*.{ts,tsx,js,jsx,json}"
bun run prepublishOnly  # Build (alias for bun run build)
npm publish             # Publish to npm (public @sudobility scope)
```

## Architecture / Patterns

### Adapter Pattern

The core `SubscriptionAdapter` interface defines four methods: `getOfferings()`, `getCustomerInfo()`, `purchase(params)`, and optional `setUserId(id, email?)`. Two built-in adapters implement this interface for web and React Native. Consumers can also write custom adapters.

```
SubscriptionAdapter (interface)
├── revenuecat-web.ts   -- wraps @revenuecat/purchases-js (ESM, lazy dynamic import)
└── revenuecat-rn.ts    -- wraps react-native-purchases (CJS require, lazy)
```

### Global Singleton

`singleton.ts` manages a single `SubscriptionService` instance with an event system for user ID changes and refresh events. Hooks consume the singleton directly (no React Context/Provider needed).

### Data Flow

```
App startup
  └─ initializeSubscription({ adapter, freeTier })
       └─ Creates SubscriptionService singleton

Hook mounts (useSubscriptions)
  └─ service.loadOfferings() -> adapter.getOfferings() -> cache in offersMap

Hook mounts (useUserSubscription)
  └─ service.loadCustomerInfo() -> adapter.getCustomerInfo() -> cache currentSubscription

User changes (login/logout)
  └─ setSubscriptionUserId(id)
       ├─ adapter.setUserId(id)
       ├─ service.clearCustomerInfo()
       └─ notify userIdChangeListeners -> hooks reload customer info

Post-purchase
  └─ refreshSubscription()
       ├─ service.loadOfferings() + service.loadCustomerInfo()
       └─ notify subscriptionRefreshListeners -> hooks update state
```

### Caching Strategy

- **Offerings** (product catalog): cached permanently; does not change per user; shared loading promise prevents duplicate fetches
- **Customer info**: cleared on user change; reloaded on demand; flag prevents concurrent loads

### Upgrade Eligibility Logic

A package is subscribable/upgradeable if:
1. No current subscription: all packages eligible
2. On free tier: all paid packages eligible
3. Has active subscription: package must satisfy BOTH:
   - `period >= currentPeriod` (weekly=1, monthly=2, quarterly=3, yearly=4, lifetime=5)
   - `level >= currentLevel` (level determined by price rank within same period; same price = same level)

### Period Parsing (ISO 8601)

| Input | Output |
|---|---|
| `P1W`, `P7D` | `weekly` |
| `P1M` | `monthly` |
| `P3M` | `quarterly` |
| `P1Y`, `P12M` | `yearly` |
| `null`, `undefined`, `""` | `lifetime` |

Complex day/week durations are also handled (e.g., `P30D` -> `monthly`, `P365D` -> `yearly`).

### TypeScript Configuration

- Target: ES2020, Module: ESNext, JSX: react-jsx
- Full strict mode enabled (`strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, etc.)
- `noUnusedLocals` and `noUnusedParameters` enforced
- Source maps enabled; comments removed in output
- Test files (`*.test.ts`, `*.spec.ts`) excluded from compilation

### Code Style

- ESLint 9 flat config + TypeScript ESLint + Prettier integration
- Prettier: single quotes, trailing commas (es5), 80 char width, 2-space indent, no tabs, arrow parens avoid
- Unused vars prefixed with `_` are allowed (`argsIgnorePattern: '^_'`)

## Common Tasks

### Adding a new hook

1. Create `src/hooks/useNewHook.ts` with typed result interface and exported function
2. Re-export from `src/hooks/index.ts`
3. Re-export from `src/index.ts` (both the hook and its result type)
4. Hooks access the singleton via `getSubscriptionInstance()` / `isSubscriptionInitialized()`

### Adding a new adapter type field

1. Update the relevant interface in `src/types/adapter.ts`
2. Update the mapping logic in both `src/adapters/revenuecat-web.ts` and `src/adapters/revenuecat-rn.ts`
3. If it surfaces to consumers, also update the domain type in `src/types/subscription.ts` and the parsing in `src/core/service.ts`

### Adding a new subscription period

1. Add the value to the `SubscriptionPeriod` union in `src/types/period.ts`
2. Add its rank to `PERIOD_RANKS` and position in `ALL_PERIODS`
3. Add ISO 8601 parsing rules in `src/utils/period-parser.ts`
4. Add test cases in `src/utils/period-parser.test.ts`

### Writing tests

- Test framework: Vitest (config inferred, no vitest.config file)
- Place test files adjacent to source: `*.test.ts` or `*.spec.ts`
- Test files are excluded from tsc compilation but linted with relaxed rules

## Peer / Key Dependencies

### Peer Dependencies (required in consuming app)

| Package | Version | Required |
|---|---|---|
| `react` | `^18.0.0 \|\| ^19.0.0` | Yes |
| `@revenuecat/purchases-js` | `^1.0.0` | Optional (web only) |
| `react-native-purchases` | `>=7.0.0` | Optional (RN only) |

### Dev Dependencies

| Package | Purpose |
|---|---|
| `typescript` ~5.9.3 | Compiler |
| `vitest` ^4.0.4 | Test runner |
| `eslint` ^9.0.0 | Linter (flat config) |
| `prettier` ^3.0.0 | Formatter |
| `@types/react` ^19.2.5 | React type definitions |
| `@types/bun` ^1.2.8 | Bun runtime types |
| `@revenuecat/purchases-js` ^1.1.3 | RevenueCat web SDK (for adapter development) |

### Downstream Consumers

```
subscription_lib (this package)
    ^
subscription-components (uses hooks)
building_blocks (uses hooks)
    ^
shapeshyft_app, mail_box (consume components)
```
