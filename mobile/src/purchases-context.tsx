import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Linking, Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage
} from "react-native-purchases";
import { syncSubscriptionRequest } from "@/src/api";
import { useAuth } from "@/src/auth-context";

const PRO_ENTITLEMENT_ID = "pro";
const APPLE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";
const PLAY_SUBSCRIPTIONS_URL = "https://play.google.com/store/account/subscriptions";

let sdkConfigured = false;
let configuredUserId: string | null = null;

type PurchasesContextValue = {
  ready: boolean;
  available: boolean;
  loading: boolean;
  isPro: boolean;
  storeEntitlementActive: boolean;
  currentOffering: PurchasesOffering | null;
  monthlyPackage: PurchasesPackage | null;
  priceLabel: string | null;
  managementUrl: string | null;
  error: string | null;
  refresh: () => Promise<void>;
  purchaseMonthly: () => Promise<"purchased" | "cancelled">;
  restorePurchases: () => Promise<boolean>;
  openSubscriptionManagement: () => Promise<void>;
  clearError: () => void;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

function platformApiKey() {
  if (Platform.OS === "ios") return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || null;
  if (Platform.OS === "android") return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || null;
  return null;
}

function messageFromError(cause: unknown) {
  if (cause && typeof cause === "object" && "message" in cause && typeof cause.message === "string") {
    return cause.message;
  }
  return "Der App-Store konnte gerade nicht erreicht werden.";
}

function wasCancelled(cause: unknown) {
  return Boolean(cause && typeof cause === "object" && "userCancelled" in cause && cause.userCancelled === true);
}

function hasPro(customerInfo: CustomerInfo | null) {
  return Boolean(customerInfo?.entitlements.active[PRO_ENTITLEMENT_ID]);
}

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const { status, token, user, refreshUser } = useAuth();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiKey = platformApiKey();
  const available = Boolean(apiKey && (Platform.OS === "ios" || Platform.OS === "android"));

  const synchronizeServer = useCallback(async () => {
    if (!token) return;
    await syncSubscriptionRequest(token);
    await refreshUser();
  }, [token, refreshUser]);

  const loadStoreState = useCallback(async () => {
    if (!available || !user) return;
    const [info, offerings] = await Promise.all([
      Purchases.getCustomerInfo(),
      Purchases.getOfferings()
    ]);
    setCustomerInfo(info);
    setCurrentOffering(offerings.current ?? null);
  }, [available, user]);

  useEffect(() => {
    let active = true;

    async function configure() {
      if (status !== "authenticated" || !user || !apiKey) {
        if (active) {
          setCustomerInfo(null);
          setCurrentOffering(null);
          setReady(status !== "loading");
        }
        return;
      }

      setReady(false);
      setError(null);
      try {
        if (!sdkConfigured) {
          Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
          Purchases.configure({ apiKey, appUserID: user.id });
          sdkConfigured = true;
          configuredUserId = user.id;
        } else if (configuredUserId !== user.id) {
          await Purchases.logIn(user.id);
          configuredUserId = user.id;
        }

        await loadStoreState();
      } catch (cause) {
        if (active) setError(messageFromError(cause));
      } finally {
        if (active) setReady(true);
      }
    }

    void configure();
    return () => {
      active = false;
    };
  }, [status, user?.id, apiKey, loadStoreState]);

  const refresh = useCallback(async () => {
    if (!available || !user) return;
    setLoading(true);
    setError(null);
    try {
      await loadStoreState();
      await synchronizeServer();
    } catch (cause) {
      setError(messageFromError(cause));
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [available, user, loadStoreState, synchronizeServer]);

  const monthlyPackage = useMemo(() => {
    if (!currentOffering) return null;
    return currentOffering.monthly ??
      currentOffering.availablePackages.find((item) => item.identifier === "$rc_monthly") ??
      currentOffering.availablePackages[0] ??
      null;
  }, [currentOffering]);

  const purchaseMonthly = useCallback(async () => {
    if (!monthlyPackage) throw new Error("Das Reklaio-Pro-Abo ist im App Store noch nicht verfügbar.");
    setLoading(true);
    setError(null);
    try {
      const result = await Purchases.purchasePackage(monthlyPackage);
      setCustomerInfo(result.customerInfo);
      if (!hasPro(result.customerInfo)) {
        throw new Error("Der Kauf wurde abgeschlossen, aber der Pro-Zugang ist noch nicht aktiv.");
      }
      await synchronizeServer().catch((cause) => {
        setError("Der Kauf war erfolgreich. Der Reklaio-Server gleicht den Pro-Zugang noch ab.");
        console.warn("RevenueCat server synchronization delayed", cause);
      });
      return "purchased" as const;
    } catch (cause) {
      if (wasCancelled(cause)) return "cancelled" as const;
      const message = messageFromError(cause);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [monthlyPackage, synchronizeServer]);

  const restore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      const restored = hasPro(info);
      await synchronizeServer().catch((cause) => {
        console.warn("RevenueCat restore synchronization delayed", cause);
      });
      return restored;
    } catch (cause) {
      const message = messageFromError(cause);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [synchronizeServer]);

  const managementUrl = customerInfo?.managementURL ?? null;
  const openSubscriptionManagement = useCallback(async () => {
    const fallback = Platform.OS === "ios" ? APPLE_SUBSCRIPTIONS_URL : PLAY_SUBSCRIPTIONS_URL;
    await Linking.openURL(managementUrl || fallback);
  }, [managementUrl]);

  const value = useMemo<PurchasesContextValue>(() => ({
    ready,
    available,
    loading,
    isPro: user?.planCode === "pro" || hasPro(customerInfo),
    storeEntitlementActive: hasPro(customerInfo),
    currentOffering,
    monthlyPackage,
    priceLabel: monthlyPackage?.product.priceString ?? null,
    managementUrl,
    error,
    refresh,
    purchaseMonthly,
    restorePurchases: restore,
    openSubscriptionManagement,
    clearError: () => setError(null)
  }), [
    ready,
    available,
    loading,
    user?.planCode,
    customerInfo,
    currentOffering,
    monthlyPackage,
    managementUrl,
    error,
    refresh,
    purchaseMonthly,
    restore,
    openSubscriptionManagement
  ]);

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases() {
  const context = useContext(PurchasesContext);
  if (!context) throw new Error("usePurchases must be used inside PurchasesProvider");
  return context;
}
