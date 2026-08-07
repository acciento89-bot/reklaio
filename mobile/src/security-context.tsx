import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { ApiError, deadlinesRequest } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import {
  clearDeadlineReminders,
  requestDeadlineReminderPermission,
  syncDeadlineReminders
} from "@/src/deadline-reminders";
import { colors, radius, spacing } from "@/src/theme";

const BIOMETRIC_KEY = "reklaio.mobile.biometric-lock";
const REMINDERS_KEY = "reklaio.mobile.deadline-reminders";
const BACKGROUND_LOCK_DELAY = 30_000;

type SecurityContextValue = {
  ready: boolean;
  biometricSupported: boolean;
  biometricLabel: string;
  biometricEnabled: boolean;
  remindersEnabled: boolean;
  locked: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setRemindersEnabled: (enabled: boolean) => Promise<void>;
  refreshDeadlineReminders: () => Promise<number>;
  unlock: () => Promise<boolean>;
};

const SecurityContext = createContext<SecurityContextValue | null>(null);

async function savePreference(key: string, enabled: boolean) {
  await SecureStore.setItemAsync(key, enabled ? "1" : "0", {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
}

export function SecurityProvider({ children }: { children: ReactNode }) {
  const { status, token, logout } = useAuth();
  const [ready, setReady] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrie");
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [remindersEnabled, setRemindersEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const backgroundAt = useRef<number | null>(null);
  const skipNextInitialLock = useRef(false);

  useEffect(() => {
    let active = true;

    async function restorePreferences() {
      const [storedBiometric, storedReminders, hasHardware, isEnrolled, types] = await Promise.all([
        SecureStore.getItemAsync(BIOMETRIC_KEY),
        SecureStore.getItemAsync(REMINDERS_KEY),
        LocalAuthentication.hasHardwareAsync().catch(() => false),
        LocalAuthentication.isEnrolledAsync().catch(() => false),
        LocalAuthentication.supportedAuthenticationTypesAsync().catch(() => [])
      ]);

      if (!active) return;

      const supported = hasHardware && isEnrolled;
      setBiometricSupported(supported);
      setBiometricEnabledState(supported && storedBiometric === "1");
      setRemindersEnabledState(storedReminders === "1");

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricLabel("Face ID / Gesichtserkennung");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricLabel("Fingerabdruck");
      }

      setReady(true);
    }

    void restorePreferences();
    return () => {
      active = false;
    };
  }, []);

  const refreshDeadlineReminders = useCallback(async () => {
    if (!token || !remindersEnabled) return 0;

    try {
      const response = await deadlinesRequest(token);
      return await syncDeadlineReminders(response.deadlines);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await logout();
        return 0;
      }
      throw error;
    }
  }, [token, remindersEnabled, logout]);

  useEffect(() => {
    if (!ready) return;

    if (status !== "authenticated") {
      setLocked(false);
      void clearDeadlineReminders().catch(() => undefined);
      return;
    }

    if (biometricEnabled) {
      if (skipNextInitialLock.current) {
        skipNextInitialLock.current = false;
      } else {
        setLocked(true);
      }
    }

    if (remindersEnabled) {
      void refreshDeadlineReminders().catch(() => undefined);
    }
  }, [ready, status, biometricEnabled, remindersEnabled, refreshDeadlineReminders]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "inactive" || nextState === "background") {
        backgroundAt.current = Date.now();
        return;
      }

      if (nextState === "active") {
        const awaySince = backgroundAt.current;
        backgroundAt.current = null;

        if (
          awaySince &&
          Date.now() - awaySince >= BACKGROUND_LOCK_DELAY &&
          status === "authenticated" &&
          biometricEnabled
        ) {
          setLocked(true);
        }

        if (status === "authenticated" && remindersEnabled) {
          void refreshDeadlineReminders().catch(() => undefined);
        }
      }
    });

    return () => subscription.remove();
  }, [status, biometricEnabled, remindersEnabled, refreshDeadlineReminders]);

  const unlock = useCallback(async () => {
    if (!biometricEnabled || status !== "authenticated") {
      setLocked(false);
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Reklaio entsperren",
      cancelLabel: "Abbrechen",
      fallbackLabel: "Gerätecode verwenden",
      disableDeviceFallback: false
    });

    if (result.success) setLocked(false);
    return result.success;
  }, [biometricEnabled, status]);

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      await savePreference(BIOMETRIC_KEY, false);
      setBiometricEnabledState(false);
      setLocked(false);
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      setBiometricSupported(false);
      throw new Error("Auf diesem Gerät ist keine Biometrie eingerichtet.");
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "App-Schutz aktivieren",
      cancelLabel: "Abbrechen",
      fallbackLabel: "Gerätecode verwenden",
      disableDeviceFallback: false
    });
    if (!result.success) {
      throw new Error("Die biometrische Bestätigung wurde abgebrochen.");
    }

    skipNextInitialLock.current = true;
    await savePreference(BIOMETRIC_KEY, true);
    setBiometricSupported(true);
    setBiometricEnabledState(true);
    setLocked(false);
  }, []);

  const setRemindersEnabled = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      await savePreference(REMINDERS_KEY, false);
      setRemindersEnabledState(false);
      await clearDeadlineReminders();
      return;
    }

    const granted = await requestDeadlineReminderPermission();
    if (!granted) {
      throw new Error("Benachrichtigungen wurden nicht erlaubt.");
    }

    await savePreference(REMINDERS_KEY, true);
    setRemindersEnabledState(true);

    if (token) {
      const response = await deadlinesRequest(token);
      await syncDeadlineReminders(response.deadlines);
    }
  }, [token]);

  const value = useMemo<SecurityContextValue>(() => ({
    ready,
    biometricSupported,
    biometricLabel,
    biometricEnabled,
    remindersEnabled,
    locked,
    setBiometricEnabled,
    setRemindersEnabled,
    refreshDeadlineReminders,
    unlock
  }), [
    ready,
    biometricSupported,
    biometricLabel,
    biometricEnabled,
    remindersEnabled,
    locked,
    setBiometricEnabled,
    setRemindersEnabled,
    refreshDeadlineReminders,
    unlock
  ]);

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) throw new Error("useSecurity must be used inside SecurityProvider");
  return context;
}

export function AppLockGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { ready, locked, biometricLabel, unlock } = useSecurity();
  const [attempted, setAttempted] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tryUnlock = useCallback(async () => {
    if (unlocking) return;
    setUnlocking(true);
    setError(null);
    try {
      const success = await unlock();
      if (!success) setError("Reklaio bleibt gesperrt.");
    } catch {
      setError("Die App konnte nicht entsperrt werden.");
    } finally {
      setUnlocking(false);
      setAttempted(true);
    }
  }, [unlock, unlocking]);

  useEffect(() => {
    if (locked && !attempted) void tryUnlock();
    if (!locked && attempted) setAttempted(false);
  }, [locked, attempted, tryUnlock]);

  if (status === "authenticated" && !ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentSoft} />
      </View>
    );
  }

  if (!locked) return <>{children}</>;

  return (
    <View style={styles.lockScreen}>
      <View style={styles.lockMark}><Text style={styles.lockMarkText}>R</Text></View>
      <Text style={styles.eyebrow}>Geschützte Fallakten</Text>
      <Text style={styles.heading}>Reklaio ist gesperrt</Text>
      <Text style={styles.copy}>Entsperre die App mit {biometricLabel} oder dem Gerätecode.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        disabled={unlocking}
        onPress={() => void tryUnlock()}
        style={({ pressed }) => [styles.button, unlocking && styles.disabled, pressed && styles.pressed]}
      >
        {unlocking ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>App entsperren</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  lockScreen: { flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: colors.background },
  lockMark: { width: 64, height: 64, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: colors.accent, marginBottom: spacing.lg },
  lockMarkText: { color: colors.white, fontSize: 30, fontWeight: "900" },
  eyebrow: { color: colors.accentSoft, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  heading: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: "900", marginTop: spacing.xs },
  copy: { color: colors.muted, lineHeight: 22, marginTop: spacing.md },
  error: { color: colors.danger, lineHeight: 20, marginTop: spacing.md },
  button: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.accent, marginTop: spacing.lg },
  buttonText: { color: colors.white, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.82 }
});
