import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Stack } from "expo-router";
import { usePurchases } from "@/src/purchases-context";
import { colors, radius, spacing } from "@/src/theme";

const features = [
  "KI-gestützte Dokumentanalyse",
  "Individuelle Schreiben aus deiner Fallakte",
  "Erweiterte Pro-Kontingente",
  "Pro-Zugang auch im Webkonto"
];

const GERMANY_IOS_PRICE_LABEL = "9,99 €";

export default function ProScreen() {
  const {
    ready,
    available,
    loading,
    isPro,
    storeEntitlementActive,
    priceLabel,
    error,
    refresh,
    purchaseMonthly,
    restorePurchases,
    openSubscriptionManagement,
    clearError
  } = usePurchases();
  const [notice, setNotice] = useState<string | null>(null);

  // Reklaio is currently available only in the German App Store. During TestFlight,
  // StoreKit/RevenueCat can expose a stale US display string even though Apple's
  // confirmation sheet correctly charges the German storefront price.
  const displayedPrice = Platform.OS === "ios"
    ? GERMANY_IOS_PRICE_LABEL
    : priceLabel || GERMANY_IOS_PRICE_LABEL;

  async function purchase() {
    setNotice(null);
    clearError();
    try {
      const result = await purchaseMonthly();
      if (result === "purchased") {
        setNotice("Reklaio Pro ist jetzt aktiviert.");
      }
    } catch {
      // The context exposes the user-facing error.
    }
  }

  async function restore() {
    setNotice(null);
    clearError();
    try {
      const restored = await restorePurchases();
      setNotice(restored
        ? "Dein Reklaio-Pro-Kauf wurde wiederhergestellt."
        : "Für diese Apple-ID wurde kein aktives Reklaio-Pro-Abo gefunden.");
    } catch {
      // The context exposes the user-facing error.
    }
  }

  async function reload() {
    setNotice(null);
    clearError();
    try {
      await refresh();
      setNotice("Der Abonnementstatus wurde aktualisiert.");
    } catch {
      // The context exposes the user-facing error.
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Reklaio Pro",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal"
        }}
      />

      <Text style={styles.eyebrow}>Reklaio Pro</Text>
      <Text style={styles.heading}>Mehr Unterstützung für deine Fälle</Text>
      <Text style={styles.intro}>
        Schalte die erweiterten Pro-Funktionen in der App und in deinem Reklaio-Webkonto frei.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.heroCard}>
        <Text style={styles.planName}>Pro Monatlich</Text>
        <Text style={styles.price}>{displayedPrice}</Text>
        <Text style={styles.interval}>pro Monat, automatisch verlängernd</Text>
        <View style={styles.featureList}>
          {features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {!ready ? (
          <ActivityIndicator color={colors.accentSoft} />
        ) : isPro ? (
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>Reklaio Pro ist aktiv</Text>
          </View>
        ) : available ? (
          <Pressable
            disabled={loading || !priceLabel}
            onPress={() => void purchase()}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              (loading || !priceLabel) && styles.disabled
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {priceLabel ? `Für ${displayedPrice} abonnieren` : "App-Store-Preis wird geladen …"}
              </Text>
            )}
          </Pressable>
        ) : (
          <Text style={styles.unavailable}>
            Der App-Store-Kauf ist in diesem Build noch nicht konfiguriert.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Abonnement verwalten</Text>
        <Text style={styles.copy}>
          Die Zahlung wird deiner Apple-ID belastet. Das Abonnement verlängert sich automatisch,
          sofern es nicht spätestens 24 Stunden vor Ende des laufenden Zeitraums gekündigt wird.
          Verwaltung und Kündigung erfolgen über deine Apple-Abonnements.
        </Text>

        <Pressable
          disabled={loading || !available}
          onPress={() => void restore()}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, (!available || loading) && styles.disabled]}
        >
          <Text style={styles.secondaryButtonText}>Käufe wiederherstellen</Text>
        </Pressable>

        {storeEntitlementActive ? (
          <Pressable
            onPress={() => void openSubscriptionManagement()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Apple-Abonnement verwalten</Text>
          </Pressable>
        ) : null}

        <Pressable
          disabled={loading || !available}
          onPress={() => void reload()}
          style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
        >
          <Text style={styles.link}>Status aktualisieren</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vertragsinformationen</Text>
        <Text style={styles.copy}>
          Laufzeit: ein Monat. Nach Bestätigung wird der Kauf über Apple abgewickelt. Der im
          Apple-Kaufdialog bestätigte App-Store-Preis ist maßgeblich. Reklaio speichert keine
          vollständigen Zahlungsdaten.
        </Text>
        <Pressable onPress={() => void Linking.openURL("https://reklaio.de/agb")}>
          <Text style={styles.link}>Allgemeine Geschäftsbedingungen</Text>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL("https://reklaio.de/datenschutz")}>
          <Text style={styles.link}>Datenschutzerklärung</Text>
        </Pressable>
        <Pressable
          onPress={() => Alert.alert(
            "Hinweis",
            "Reklaio organisiert Verbraucherfälle und bietet keine Rechtsberatung."
          )}
        >
          <Text style={styles.link}>Hinweis zur Leistung</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background
  },
  eyebrow: {
    color: colors.accentSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  heading: { color: colors.text, fontSize: 30, fontWeight: "900", marginTop: spacing.xs },
  intro: { color: colors.muted, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.lg },
  error: {
    color: colors.danger,
    lineHeight: 20,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: "rgba(226,125,131,0.12)",
    marginBottom: spacing.md
  },
  notice: {
    color: colors.success,
    lineHeight: 20,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: "rgba(117,189,169,0.12)",
    marginBottom: spacing.md
  },
  heroCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(143,199,187,0.45)",
    backgroundColor: colors.panel
  },
  planName: { color: colors.accentSoft, fontSize: 15, fontWeight: "900" },
  price: { color: colors.text, fontSize: 40, fontWeight: "900", marginTop: spacing.sm },
  interval: { color: colors.muted, marginTop: spacing.xs },
  featureList: { gap: spacing.sm, marginVertical: spacing.lg },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  check: { color: colors.success, fontWeight: "900", fontSize: 18 },
  featureText: { color: colors.text, flex: 1, lineHeight: 22 },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md
  },
  primaryButtonText: { color: colors.white, fontWeight: "900", textAlign: "center" },
  activeBadge: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: "rgba(117,189,169,0.16)",
    borderWidth: 1,
    borderColor: "rgba(117,189,169,0.45)"
  },
  activeText: { color: colors.success, fontWeight: "900" },
  unavailable: { color: colors.warning, lineHeight: 21, textAlign: "center" },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel
  },
  cardTitle: { color: colors.text, fontSize: 19, fontWeight: "800" },
  copy: { color: colors.muted, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.md },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: spacing.sm
  },
  secondaryButtonText: { color: colors.text, fontWeight: "800" },
  linkButton: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
  link: { color: colors.accentSoft, fontWeight: "700", paddingVertical: spacing.sm },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 }
});
