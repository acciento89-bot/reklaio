# Reklaio — Google Play release handoff

## Android identity

- App name: Reklaio
- Package: `de.kamilunavo.reklaio`
- Expo version: `0.4.3`
- Android versionCode: `7`
- Expo SDK: `57`
- Android compile/target SDK: API 36 through Expo SDK 57
- API: `https://reklaio.de`
- Distribution: Android App Bundle via EAS production profile

## Existing Android implementation

The existing Expo/React Native mobile app already supports Android. This Google Play release does not require a second client implementation.

Android-relevant features already present:

- native login/session handling using SecureStore;
- case creation and case details;
- deadlines, status and chronicle;
- camera/photo/document uploads;
- document share/delete flows;
- local deadline reminders;
- biometric app lock;
- account deletion through `/api/mobile/v1/account/delete`;
- RevenueCat purchase and restore flow;
- Google Play subscription management link;
- server synchronization after purchase/restore.

## Google Play subscription

Use the existing RevenueCat entitlement/offering model on both stores:

- RevenueCat entitlement: `pro`
- RevenueCat offering: `default`
- RevenueCat package: `$rc_monthly`
- Suggested Google Play subscription product ID: `de.kamilunavo.reklaio.pro.monthly`
- Base plan ID: `monthly`
- Billing period: monthly
- Germany launch price: EUR 9.99/month, matching the established Reklaio Pro monthly price decision

RevenueCat must attach both the App Store and Google Play products to the same `pro` entitlement and the same `$rc_monthly` package in the default offering.

## RevenueCat Android gate

The mobile code selects a platform-specific public RevenueCat key:

- iOS: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- Android: `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

The Android production EAS environment MUST contain a valid `goog_...` public SDK key before the Play Store AAB is built. Never place a RevenueCat secret key in the mobile app or GitHub.

Server-side synchronization is already store-aware. RevenueCat `play_store` purchases are normalized to `google_play`; the `pro` entitlement, expiry/grace period, billing issues, cancellation state and management URL are synchronized into `store_entitlements` and then into Reklaio plan access.

Server requirements remain:

- `REVENUECAT_SECRET_API_KEY`
- `REVENUECAT_WEBHOOK_AUTH`
- RevenueCat webhook `https://reklaio.de/api/billing/revenuecat`

## Google Play Console setup

Create the app with package `de.kamilunavo.reklaio`.

Create subscription:

- Product ID: `de.kamilunavo.reklaio.pro.monthly`
- Name: `Reklaio Pro`
- Base plan: `monthly`
- Auto-renewing: yes
- Billing period: 1 month
- Germany price: EUR 9.99

Then in RevenueCat:

1. add the Android/Google Play app using package `de.kamilunavo.reklaio`;
2. connect the Google Play service credentials required by RevenueCat;
3. import `de.kamilunavo.reklaio.pro.monthly`;
4. attach it to entitlement `pro`;
5. attach it to `$rc_monthly` in offering `default`;
6. set `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...` in the EAS `production` environment.

## Store listing / policy gates

- Privacy URL: use the current Reklaio privacy page already used by the product.
- Support URL: use the current Reklaio/Kamilunavo support page.
- Account deletion: the app exposes native deletion and the Play Console must also receive the public account-deletion URL required by Google.
- Data safety must reflect the final mobile/backend data flows: account data, case content, uploaded photos/documents and purchase/subscription state.
- No ads SDK is present in the current mobile app.

## Release workflow

Existing repository workflows:

- `eas-android-aab.yml` — production Android AAB build
- `eas-android-play-internal.yml` — Google Play internal-track path

Production release gate:

- [ ] Google Play app exists for `de.kamilunavo.reklaio`.
- [ ] Google Play subscription/base plan exists and is active.
- [ ] RevenueCat Android app is connected to Google Play.
- [ ] Android product is attached to `pro` + `default/$rc_monthly`.
- [ ] EAS production environment contains `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...`.
- [ ] Server RevenueCat secret + webhook remain live.
- [ ] Mobile CI/typecheck/prebuild is green.
- [ ] Production AAB built from current `main`.
- [ ] Internal test: login, new case, upload, reminders, biometrics, Pro purchase, server Pro sync, restart, restore, subscription management, account deletion.
- [ ] Complete Play Data safety/content rating/account deletion declarations.
- [ ] Satisfy any closed-testing requirement attached to the developer account.
- [ ] Promote to production only after all gates are green.
