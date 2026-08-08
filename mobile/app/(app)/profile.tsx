import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/auth-context";
import { useSecurity } from "@/src/security-context";
import { colors, radius, spacing } from "@/src/theme";

type SettingKey = "biometric" | "reminders" | "logout" | null;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    ready,
    biometricSupported,
    biometricLabel,
    biometricEnabled,
    remindersEnabled,
    setBiometricEnabled,
    setRemindersEnabled
  } = useSecurity();
  const [submitting, setSubmitting] = useState<SettingKey>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function changeBiometric(enabled: boolean) {
    setSubmitting("biometric");
    setError(null);
    setNotice(null);
    try {
      await setBiometricEnabled(enabled);
      setNotice(enabled ? "Der App-Schutz ist aktiviert." : "Der App-Schutz ist deaktiviert.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Die Sicherheitseinstellung konnte nicht gespeichert werden.");
    } finally {
      setSubmitting(null);
    }
  }

  async function changeReminders(enabled: boolean) {
    setSubmitting("reminders");
    setError(null);
    setNotice(null);
    try {
      await setRemindersEnabled(enabled);
      setNotice(enabled ? "Fristerinnerungen wurden eingerichtet." : "Fristerinnerungen wurden ausgeschaltet.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Die Erinnerungseinstellung konnte nicht gespeichert werden.");
    } finally {
      setSubmitting(null);
    }
  }

  async function signOut() {
    setSubmitting("logout");
    try {
      await logout();
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.eyebrow}>Konto & Sicherheit</Text>
      <Text style={styles.heading}>Dein Reklaio-Konto</Text>
      <Text style={styles.intro}>Die App verwendet dasselbe Konto wie reklaio.de.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.noticeBox}>{notice}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.label}>Anzeigename</Text>
        <Text style={styles.value}>{user?.displayName || "Nicht hinterlegt"}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>E-Mail-Adresse</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      <View style={[styles.card, styles.proCard]}>
        <View style={styles.proHeader}>
          <View style={styles.settingCopy}>
            <Text style={styles.cardTitle}>Reklaio Pro</Text>
            <Text style={styles.copy}>
              {user?.planCode === "pro"
                ? "Dein Pro-Zugang ist aktiv. Hier kannst du Store-Käufe wiederherstellen oder dein Abonnement verwalten."
                : "Schalte KI-Dokumentanalysen, individuelle Schreiben und die erweiterten Pro-Kontingente frei."}
            </Text>
          </View>
          <Text style={[styles.planBadge, user?.planCode === "pro" && styles.planBadgeActive]}>
            {user?.planCode === "pro" ? "PRO" : "FREE"}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/pro")}
          style={({ pressed }) => [styles.proButton, pressed && styles.pressed]}
        >
          <Text style={styles.proButtonText}>
            {user?.planCode === "pro" ? "Pro verwalten" : "Reklaio Pro ansehen"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.cardTitle}>Biometrischer App-Schutz</Text>
            <Text style={styles.copy}>
              Sperrt persönliche Fallakten nach 30 Sekunden im Hintergrund und entsperrt sie mit {biometricLabel} oder Gerätecode.
            </Text>
            {!biometricSupported && ready ? (
              <Text style={styles.unavailable}>Auf diesem Gerät ist aktuell keine Biometrie eingerichtet.</Text>
            ) : null}
          </View>
          {submitting === "biometric" ? (
            <ActivityIndicator color={colors.accentSoft} />
          ) : (
            <Switch
              disabled={!ready || !biometricSupported || submitting !== null}
              value={biometricEnabled}
              onValueChange={(enabled) => void changeBiometric(enabled)}
              trackColor={{ false: colors.line, true: colors.accent }}
              thumbColor={colors.white}
            />
          )}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.cardTitle}>Fristerinnerungen</Text>
            <Text style={styles.copy}>
              Reklaio erinnert lokal auf diesem Gerät jeweils am Vortag und am Fälligkeitstag um 09:00 Uhr. Es werden keine Fallinhalte an einen Push-Dienst übertragen.
            </Text>
          </View>
          {submitting === "reminders" ? (
            <ActivityIndicator color={colors.accentSoft} />
          ) : (
            <Switch
              disabled={!ready || submitting !== null}
              value={remindersEnabled}
              onValueChange={(enabled) => void changeReminders(enabled)}
              trackColor={{ false: colors.line, true: colors.accent }}
              thumbColor={colors.white}
            />
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kontoverwaltung</Text>
        <Text style={styles.copy}>
          Profil, Passwort und Datenexport sind über die sichere Web-Kontoverwaltung erreichbar. Dein Konto und alle damit verbundenen Fallakten kannst du direkt in der App löschen.
        </Text>
        <Pressable
          onPress={() => void Linking.openURL("https://reklaio.de/einstellungen")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Kontoverwaltung öffnen</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/account-delete")}
          style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}
        >
          <Text style={styles.dangerButtonText}>Konto und Daten löschen</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Datenschutz & Hilfe</Text>
        <Pressable onPress={() => void Linking.openURL("https://reklaio.de/datenschutz")}>
          <Text style={styles.link}>Datenschutzerklärung</Text>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL("https://reklaio.de/agb")}>
          <Text style={styles.link}>Allgemeine Geschäftsbedingungen</Text>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL("https://reklaio.de/impressum")}>
          <Text style={styles.link}>Impressum</Text>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL("https://reklaio.de/hilfe")}>
          <Text style={styles.link}>Hilfe und Support</Text>
        </Pressable>
      </View>

      <Pressable
        disabled={submitting !== null}
        onPress={() => void signOut()}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed, submitting !== null && styles.disabled]}
      >
        <Text style={styles.logoutText}>{submitting === "logout" ? "Wird abgemeldet …" : "Abmelden"}</Text>
      </Pressable>

      <Text style={styles.notice}>Reklaio organisiert Verbraucherfälle und bietet keine Rechtsberatung.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    flexGrow: 1
  },
  eyebrow: { color: colors.accentSoft, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  heading: { color: colors.text, fontSize: 30, fontWeight: "900", marginTop: spacing.xs },
  intro: { color: colors.muted, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.lg },
  error: { color: colors.danger, lineHeight: 20, padding: spacing.md, borderRadius: radius.sm, backgroundColor: "rgba(226,125,131,0.12)", marginBottom: spacing.md },
  noticeBox: { color: colors.success, lineHeight: 20, padding: spacing.md, borderRadius: radius.sm, backgroundColor: "rgba(117,189,169,0.12)", marginBottom: spacing.md },
  card: { padding: spacing.lg, marginBottom: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  proCard: { borderColor: "rgba(143,199,187,0.4)" },
  proHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  planBadge: { color: colors.muted, fontSize: 12, fontWeight: "900", borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  planBadgeActive: { color: colors.success, borderColor: "rgba(117,189,169,0.5)", backgroundColor: "rgba(117,189,169,0.12)" },
  proButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.accent, marginTop: spacing.lg },
  proButtonText: { color: colors.white, fontWeight: "900" },
  label: { color: colors.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  value: { color: colors.text, fontSize: 17, fontWeight: "700", marginTop: spacing.xs },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.md },
  settingRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  settingCopy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 19, fontWeight: "800" },
  copy: { color: colors.muted, lineHeight: 22, marginTop: spacing.sm },
  unavailable: { color: colors.warning, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  secondaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, marginTop: spacing.lg },
  secondaryButtonText: { color: colors.text, fontWeight: "800" },
  dangerButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: "rgba(226,125,131,0.45)", backgroundColor: "rgba(226,125,131,0.1)", marginTop: spacing.sm },
  dangerButtonText: { color: colors.danger, fontWeight: "800" },
  link: { color: colors.accentSoft, fontWeight: "700", paddingVertical: spacing.sm },
  logoutButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: "rgba(226,125,131,0.12)", borderWidth: 1, borderColor: "rgba(226,125,131,0.4)" },
  logoutText: { color: colors.danger, fontWeight: "800" },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.6 },
  notice: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: spacing.lg }
});
