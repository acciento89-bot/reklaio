import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

const app = readJson("app.json");
const pkg = readJson("package.json");
const eas = readJson("eas.json");
const purchases = read("src/purchases-context.tsx");
const api = read("src/api.ts");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(app.expo?.android?.package === "de.kamilunavo.reklaio", "Unexpected Android package");
assert(Number(app.expo?.android?.versionCode) >= 6, "Android versionCode must be >= 6");
assert(app.expo?.version === "0.4.1", "Unexpected Reklaio app version");
assert(String(pkg.dependencies?.expo || "").startsWith("~57."), "Expo SDK 57 is required for the API 36 release lane");
assert(pkg.dependencies?.["react-native-purchases"], "react-native-purchases is missing");
assert(eas.build?.production?.environment === "production", "EAS production build must use the production environment");
assert(eas.submit?.production?.android?.track === "internal", "EAS production submit track must start at internal");
assert(purchases.includes("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY"), "Android RevenueCat public-key path is missing");
assert(purchases.includes('const PRO_ENTITLEMENT_ID = "pro"'), "RevenueCat pro entitlement changed unexpectedly");
assert(purchases.includes("currentOffering.monthly") || purchases.includes('identifier === "$rc_monthly"'), "Monthly RevenueCat package resolution is missing");
assert(purchases.includes("PLAY_SUBSCRIPTIONS_URL"), "Google Play subscription management link is missing");
assert(api.includes("/api/mobile/v1/subscription/sync"), "Server subscription sync call is missing");
assert(api.includes("/api/mobile/v1/account/delete"), "Account deletion API call is missing");

console.log("Reklaio Google Play repository preflight passed.");
console.log("External gate remains: EAS production must contain EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...");
