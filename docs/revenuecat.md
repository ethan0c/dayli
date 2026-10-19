# RevenueCat in Semli

Semli uses `react-native-purchases` and `react-native-purchases-ui` 10.15.x, with Expo SDK 58. The integration follows the downloaded RevenueCat sample in `~/Downloads/sample_app`, uses the supplied Test Store key, and grants access only through the active `semli_pro` entitlement. The custom lavender paywall is in Settings → Semli Pro and onboarding. Settings → Manage subscription opens subscription management when available.

## 1. Install with npm

From the repository root:

```sh
npm install --save react-native-purchases react-native-purchases-ui --workspace mobile
```

Both packages were already installed in this repository. The Expo development client has also been installed using npm through Expo's version resolver:

```sh
cd apps/mobile
npx expo install expo-dev-client --npm
```

For a standalone React Native project without workspaces, the requested command is:

```sh
npm install --save react-native-purchases react-native-purchases-ui
```

Native modules autolink. With bare React Native, install iOS pods as required by the native build. Semli uses Expo Continuous Native Generation, so do not manually create or edit `ios/` or `android/`. Rebuild the native app whenever native dependencies change. See [RevenueCat React Native installation](https://www.revenuecat.com/docs/getting-started/installation/reactnative) and [RevenueCat with Expo](https://www.revenuecat.com/docs/getting-started/installation/expo).

## 2. Configure products and the offering in RevenueCat

These are dashboard/store operations. Installing the SDK does not create products, prices, an entitlement, or a hosted paywall.

Open Semli's [RevenueCat product catalog](https://app.revenuecat.com/projects/a2c96d90/product-catalog). Create or verify:

| Display name | Test Store product ID | Product configuration | Standard RevenueCat package |
|---|---|---|---|
| Lifetime | `lifetime` | One-time, non-consumable purchase | Lifetime / `$rc_lifetime` |
| Yearly | `yearly` | Auto-renewing, 1 year | Annual / `$rc_annual` |
| Monthly | `monthly` | Auto-renewing, 1 month | Monthly / `$rc_monthly` |

1. In Product catalog → Products, add these products under Test Store and choose their prices. Prices are intentionally not hard-coded in the app.
2. Create the entitlement identifier **`semli_pro`**, exactly as written, and attach all three products to it.
3. Create an offering such as `default`, add the three **standard package types** in the table, and make it the current offering. The code uses `offerings.current` and its `.monthly`, `.annual`, and `.lifetime` packages.
4. A product identifier, package identifier, offering identifier, and entitlement identifier are different identifiers. The app purchases the actual package returned by RevenueCat; it does not guess product IDs.
5. Before accepting real payments, configure matching native products in App Store Connect or Google Play, import them into RevenueCat, attach them to the same entitlement, and add the native product to the corresponding package. Apple monthly and yearly subscriptions should be in the same subscription group. Google subscription products need their base plans configured and mapped; RevenueCat's product mapping may include the base-plan ID.
6. Lifetime must remain non-consumable. Do not configure it as a consumable or an auto-renewing subscription.

Store product IDs must match each store exactly; a store may require different identifiers from the Test Store. See [product configuration](https://www.revenuecat.com/docs/offerings/products-overview) and [offerings](https://www.revenuecat.com/docs/offerings/overview).

## 3. SDK initialization and public keys

The complete implementation is [revenuecat.ts](../apps/mobile/src/lib/revenuecat.ts). The SDK is configured once, with retries after initialization failure and protection against duplicate initialization:

```tsx
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
if (!(await Purchases.isConfigured())) {
  Purchases.configure({ apiKey: 'test_uNFxutyLQIYtsoSqmHkgBRoiEOZ' });
}
```

That example is for Test Store development only. Semli automatically uses that public test key in debug builds. Release builds require platform-specific public SDK keys in the build environment:

```dotenv
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_public_apple_sdk_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your_public_google_sdk_key
EXPO_PUBLIC_REVENUECAT_CUSTOMER_CENTER_ENABLED=false
```

Copy the names from [`.env.example`](../apps/mobile/.env.example). Release builds reject missing keys and `test_` keys instead of silently shipping simulated billing. TestFlight uses a release build: use the Apple key and Apple sandbox products, not the Test Store key. Build-time `EXPO_PUBLIC_` variables are embedded in the bundle; public SDK keys belong there, RevenueCat secret API keys do not. Rebuild or republish the JS bundle after changing public variables.

Semli currently has no authenticated account system, so RevenueCat generates and persists its anonymous App User ID. Never use a user's name, email, or a freshly generated random ID on each launch as their identity. If accounts are added, call `Purchases.logIn(stableAuthenticatedUserId)`, replace customer state with the returned `customerInfo`, and refresh offerings. On sign-out, clear customer state before the next identity's data loads; call `logOut()` only for an identified user. Review restore/transfer behavior in RevenueCat before adding account switching. See [SDK configuration](https://www.revenuecat.com/docs/getting-started/configuring-sdk) and [identifying customers](https://www.revenuecat.com/docs/customers/identifying-customers).

## 4. Customer info, entitlement checks, and purchases

The complete shared implementation is [PurchasesProvider.tsx](../apps/mobile/src/providers/PurchasesProvider.tsx), mounted around navigation in [the root layout](../apps/mobile/src/app/_layout.tsx). It exposes:

```tsx
const {
  customerInfo, offering, isPro, loading, busy, error,
  refresh, refreshCustomerInfo, purchase, restore,
  presentPaywall, manageSubscription,
} = usePurchases();
```

Core SDK calls are:

```tsx
import Purchases from 'react-native-purchases';

const customerInfo = await Purchases.getCustomerInfo();
const isPro = customerInfo.entitlements.active['semli_pro']?.isActive === true;

const offerings = await Purchases.getOfferings();
const yearly = offerings.current?.annual;
if (yearly) {
  const result = await Purchases.purchasePackage(yearly);
  const unlocked = result.customerInfo.entitlements.active['semli_pro']?.isActive === true;
  // Grant access only when unlocked is true.
}

// Trigger restores only from an explicit user action.
const restoredInfo = await Purchases.restorePurchases();
const restoredPro = restoredInfo.entitlements.active['semli_pro']?.isActive === true;
```

Use the provider's wrappers in application code so errors, action locking, and customer state stay synchronized. Here is a complete small screen using the provider:

```tsx
import { View } from 'react-native';
import { Button } from '@/components/Sheet';
import { T } from '@/components/Text';
import { hasSemliPro } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';

export default function ProExample() {
  const { isPro, offering, busy, loading, error, purchase, restore } = usePurchases();
  const yearly = offering?.annual;

  async function buyYearly() {
    if (!yearly) return;
    try {
      const info = await purchase(yearly);
      if (info && hasSemliPro(info)) {
        // Continue to the paid feature. null means the customer canceled.
      }
    } catch {
      // The provider exposes an actionable message in error.
    }
  }

  return (
    <View style={{ padding: 24, gap: 16 }}>
      <T>{isPro ? 'Semli Pro is active' : 'Choose a Pro plan'}</T>
      {error ? <T accessibilityRole="alert">{error}</T> : null}
      {!isPro ? (
        <Button
          label={yearly ? `Yearly · ${yearly.product.priceString}` : 'Loading yearly plan…'}
          disabled={!yearly || busy || loading}
          onPress={() => void buyYearly()}
        />
      ) : null}
      <Button
        label="Restore purchases"
        disabled={busy || loading}
        onPress={() => { void restore().catch(() => {}); }}
      />
    </View>
  );
}
```

The shipped [PlanPicker](../apps/mobile/src/components/PlanPicker.tsx) includes the full visual design, all three package choices, purchase/restore feedback, renewal disclosure, and Terms/Privacy links. The sample above demonstrates the API; use the full paywall for selling subscriptions.

The provider registers and cleans up a CustomerInfo listener, refreshes on foreground, preserves customer info when an offering request fails, and ignores customer info older than the latest update. SDK reads use RevenueCat's cache policy; listeners are not a permanent real-time connection to the backend. See [CustomerInfo and subscription status](https://www.revenuecat.com/docs/customers/customer-info).

## 5. Present the hosted RevenueCat Paywall

The provider exposes the native RevenueCat Paywall for feature gates; Capture uses it when the free import allowance is exhausted. The branded Settings paywall uses SDK packages directly and keeps checkout docked below the scrollable content:

```tsx
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

const result = await RevenueCatUI.presentPaywallIfNeeded({
  requiredEntitlementIdentifier: 'semli_pro',
  offering, // A non-null PurchasesOffering returned by getOfferings().
  displayCloseButton: true,
});

switch (result) {
  case PAYWALL_RESULT.PURCHASED:
  case PAYWALL_RESULT.RESTORED:
  case PAYWALL_RESULT.NOT_PRESENTED:
    // Retrieve CustomerInfo and verify semli_pro before allowing paid access.
    break;
  case PAYWALL_RESULT.CANCELLED:
    // Normal dismissal; no error alert.
    break;
  case PAYWALL_RESULT.ERROR:
    // Display a retryable message.
    break;
}
```

In RevenueCat → Paywalls, create and publish a paywall for the current offering. Include Monthly, Yearly, and Lifetime; use dynamic price variables, restore/close controls, renewal details, and your working Terms/Privacy URLs. Suggested Semli styling: Onest, lavender accent, neutral background, rounded plan rows, sentence-case headings, and “Make room for your life.” The in-app custom design is implemented in code; a matching remote editor design has **not** been published by this integration. Remote configuration was not verified because the catalog page rendered blank during inspection. See [Paywalls](https://www.revenuecat.com/docs/tools/paywalls) and [displaying paywalls](https://www.revenuecat.com/docs/tools/paywalls/displaying-paywalls).

## 6. Manage subscription and Customer Center

Settings has a direct **Manage subscription** row. By default, it opens the current customer's `managementURL` from RevenueCat. If there is no renewable subscription, it opens the plan screen. Lifetime purchases do not renew.

For the richer Customer Center, configure it in RevenueCat → Lifecycle and enable:

```dotenv
EXPO_PUBLIC_REVENUECAT_CUSTOMER_CENTER_ENABLED=true
```

The provider then calls:

```tsx
await RevenueCatUI.presentCustomerCenter({
  callbacks: {
    onRestoreCompleted: ({ customerInfo }) => {
      // Update shared subscription state from customerInfo.
    },
  },
});
```

It refreshes customer info when the center closes. Enable this only once your RevenueCat plan supports Customer Center and its configuration is ready; it is optional, and store management works without it. Refund, retention, cancellation, and plan-change capabilities vary by platform and configuration. See [Customer Center](https://www.revenuecat.com/docs/tools/customer-center) and [React Native integration](https://www.revenuecat.com/docs/tools/customer-center/customer-center-react-native).

## 7. Build and run the native app

Expo Go uses preview mocks rather than real billing. Semli disables billing controls there and on web to avoid treating a mock purchase as real Pro access. Use a development build for Test Store purchases:

```sh
cd apps/mobile
# Local build, with Xcode installed:
npx expo run:ios

# Or use the included EAS simulator profile:
npx eas-cli@latest build --platform ios --profile development-simulator
npx expo start --dev-client
```

The included [eas.json](../apps/mobile/eas.json) also has device development and production profiles. For App Store distribution, connect the Apple app with bundle ID `app.semli.mobile`, configure In-App Purchase in the native app/store configuration, and supply the Apple public SDK key. Signing and store credentials are account-specific setup.

Android is supported by the integration code but is not an existing Semli release target. Before adding it, set its application/package ID in Expo config, connect the Google app/products, and use an Expo config plugin to change the generated main Activity's `android:launchMode` to `singleTop` or `standard`, as required by RevenueCat's React Native installation guide. Do not manually edit generated native files.

## 8. Subscription behavior and verification

- Paid access is `semli_pro`, never `planIntent`, a selected radio button, a successful payment dialog, or `activeSubscriptions.length`. Lifetime is covered by entitlements too.
- Canceled auto-renewal usually leaves access active through the paid period. Use `isActive`; use `willRenew` only to describe renewal status.
- Pending payments do not unlock Pro. Store confirmation and updated customer info unlock it later.
- Failed/offline requests preserve known customer info. No extra permanent Pro flag is persisted in Zustand.
- Purchases and restores are serialized. Cancellation is silent; network, unavailable-product, pending-payment, ownership, and configuration errors have friendly messages.
- Prices are localized `priceString` values. The old semester plan, unconfigured student discounts, and blanket seven-day-trial claims have been removed from purchase UI. Configure actual offers in the stores and display them accurately before advertising them.
- Capture allows three successful free imports in a UTC calendar month, then checks Pro and offers the hosted paywall. A canceled or failed purchase does not run the extraction or consume another import.
- Import usage is currently local device state. This is a UI quota, not server-side abuse protection. Before protecting paid server work, add authenticated user IDs, verify entitlements server-side, and enforce usage on the server. Never trust a client-supplied `isPro` boolean.
- The custom paywall links to `https://semli.app/terms` and `/privacy`, matching the web app's existing routes. Verify the deployed pages are reachable and their copy reflects RevenueCat and the chosen products before releasing; reachability was not confirmed here.

Checks run during implementation: mobile TypeScript, Expo lint, RevenueCat unit tests, and an Expo web export. A real device/native purchase, refund, expiration, restore after reinstall, and Customer Center still require store/dashboard configuration and a native build. Test successful and canceled purchases for every package, pending/failure simulation, restoring with and without Pro, foreground refresh after cancellation, and lifetime access with no expiration. See [Test Store testing](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store).
