import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/src/auth-context";
import { colors, radius, spacing } from "@/src/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function signOut() {
    setSubmitting(true);
    try {
      await logout();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.eyebrow}>Konto & Sicherheit</Text>
      <Text style={styles.heading}>Dein Reklaio-Konto</Text>
      <Text style={styles.intro}>Die App verwendet dasselbe Konto wie reklaio.de.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Anzeigename</Text>
        <Text style={styles.value}>{user?.displayName || "Nicht hinterlegt"}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>E-Mail-Adresse</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kontoverwaltung</Text>
        <Text style={styles.copy}>
          Profil, Passwort, Datenexport und Kontolöschung sind bereits über die sichere Web-Kontoverwaltung erreichbar. Eine vollständig native Kontoverwaltung folgt vor der Store-Einreichung.
        </Text>
        <Pressable
          onPress={() => void Linking.openURL("https://reklaio.de/einstellungen")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Kontoverwaltung öffnen</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Datenschutz & Hilfe</Text>
        <Pressable onPress={() => void Linking.openURL("https://reklaio.de/datenschutz")}>
          <Text style={styles.link}>Datenschutzerklärung</Text>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL("https://reklaio.de/hilfe")}>
          <Text style={styles.link}>Hilfe und Support</Text>
        </Pressable>
      </View>

      <Pressable
        disabled={submitting}
        onPress={signOut}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed, submitting && styles.disabled]}
      >
        <Text style={styles.logoutText}>{submitting ? "Wird abgemeldet …" : "Abmelden"}</Text>
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
  card: { padding: spacing.lg, marginBottom: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  label: { color: colors.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  value: { color: colors.text, fontSize: 17, fontWeight: "750", marginTop: spacing.xs },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.md },
  cardTitle: { color: colors.text, fontSize: 19, fontWeight: "850" },
  copy: { color: colors.muted, lineHeight: 22, marginTop: spacing.sm },
  secondaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, marginTop: spacing.lg },
  secondaryButtonText: { color: colors.text, fontWeight: "800" },
  link: { color: colors.accentSoft, fontWeight: "750", paddingVertical: spacing.sm },
  logoutButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: "rgba(226,125,131,0.12)", borderWidth: 1, borderColor: "rgba(226,125,131,0.4)" },
  logoutText: { color: colors.danger, fontWeight: "850" },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.6 },
  notice: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: spacing.lg }
});
