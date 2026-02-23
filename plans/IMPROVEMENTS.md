# subscription_lib - Improvement Plans

## Priority 1: Code Quality

### 1.1 Remove duplicate period rank mapping in `findUpgradeablePackages`
- **File**: `src/utils/level-calculator.ts`
- **Issue**: `findUpgradeablePackages()` defines a local `periodRanks` object instead of importing `PERIOD_RANKS` from `@sudobility/types`. This creates a maintenance burden where adding a new period requires updating two places.
- **Fix**: Import `PERIOD_RANKS` from `@sudobility/types` and use it directly.

### 1.2 Add a `verify` script
- **Issue**: Unlike other projects in the ecosystem, `subscription_lib` does not have a `bun run verify` script that runs all checks in sequence.
- **Fix**: Add `"verify": "bun run typecheck && bun run lint && bun run test && bun run build"` to `package.json` scripts.

### 1.3 Remove the deprecated `refetch` alias from `useUserSubscription`
- **File**: `src/hooks/useUserSubscription.ts`
- **Issue**: The hook returns both `update` and `refetch` (identical functions). The `refetch` alias is marked `@deprecated` but still exported.
- **Fix**: Plan a breaking change to remove `refetch` from the return type in a future minor version. Add a console warning when accessed.

## Priority 2: Testing

### 2.1 Add tests for `level-calculator.ts`
- **File**: `src/utils/level-calculator.ts`
- **Issue**: No test file exists for the level calculator utilities. These contain complex logic for calculating package levels and upgrade eligibility.
- **Fix**: Create `src/utils/level-calculator.test.ts` covering `calculatePackageLevels`, `addLevelsToPackages`, `getPackageLevel`, and `findUpgradeablePackages` with edge cases (same prices, mixed periods, free tier handling, productId fallback matching).

### 2.2 Add tests for hooks
- **Issue**: No tests exist for any of the React hooks. While they depend on the singleton, they could be tested with a mock adapter.
- **Fix**: Create test files for each hook using a test adapter that returns predictable data. Consider using React Testing Library's `renderHook`.

### 2.3 Add tests for adapters
- **Issue**: Neither the web adapter nor the RN adapter has tests. The web adapter has complex logic around lazy loading, anonymous user handling, and concurrent setup prevention.
- **Fix**: Create `src/adapters/revenuecat-web.test.ts` and `src/adapters/revenuecat-rn.test.ts` with mocked SDK modules.

## Priority 3: Architecture

### 3.1 Normalize adapter behavior for anonymous offerings
- **Issue**: The web adapter allows fetching offerings without a user (using a hardcoded anonymous ID), but the RN adapter returns empty offerings if no user is set. This behavioral difference can confuse consumers.
- **Fix**: Document the difference clearly or align behavior. Consider adding a `supportsAnonymousOfferings` flag to the adapter interface.

### 3.2 Add error recovery for `loadOfferings`
- **File**: `src/core/service.ts`
- **Issue**: If `loadOfferings()` fails, the `offersCache` remains empty but the `loadOfferingsPromise` is nulled out, allowing a retry. However, there is no built-in retry mechanism or error state that consumers can check.
- **Fix**: Consider adding a `loadError` state to `SubscriptionService` that hooks can surface.

### 3.3 Consider React Context as alternative to global singleton
- **Issue**: The global singleton pattern works but makes testing harder and prevents multiple isolated instances. It also means the library cannot be used in scenarios where different parts of the app need different subscription configurations.
- **Fix**: Consider providing an optional `SubscriptionProvider` context wrapper alongside the singleton pattern.

## Priority 4: Developer Experience

### 4.1 Add Vitest config file
- **Issue**: Vitest configuration is inferred (no `vitest.config.ts`). This works but makes it harder to customize test behavior (e.g., coverage, setup files).
- **Fix**: Add a `vitest.config.ts` with explicit configuration.

### 4.2 Add `prepublishOnly` that runs verify
- **Issue**: The `prepublishOnly` script only runs `bun run build`. It should run the full verification suite.
- **Fix**: Change to `"prepublishOnly": "bun run verify"` (after adding the verify script).

### 4.3 Add CHANGELOG.md
- **Issue**: No changelog exists. Version bumps and changes are not tracked in a user-facing document.
- **Fix**: Add a CHANGELOG.md following Keep a Changelog format.
