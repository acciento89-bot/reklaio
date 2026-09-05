import { useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { ApiError } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { colors, radius, spacing } from "@/src/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError("Bitte E-Mail-Adresse und Passwort eingeben.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Anmeldung derzeit nicht möglich.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View pointerEvents="none" style={styles.glowPrimary} />
      <View pointerEvents="none" style={styles.glowSecondary} />
      <Image accessibilityIgnoresInvertColors source={require("../assets/icon.png")} style={styles.brandMark} />
      <Text style={styles.brand}>Reklaio</Text>
      <Text style={styles.claim}>Dein Fall. Deine Frist. Dein Überblick.</Text>

      <View style={styles.card}>
        <Text style={styles.eyebrow}>Sicher anmelden</Text>
        <Text style={styles.title}>Deine Fallakte unterwegs</Text>
        <Text style={styles.copy}>
          Melde dich mit deinem bestehenden Reklaio-Konto an. Dein Sitzungstoken wird verschlüsselt auf diesem Gerät gespeichert.
        </Text>

        <Text style={styles.label}>E-Mail-Adresse</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="name@beispiel.de"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={email}
        />

        <Text style={styles.label}>Passwort</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="current-password"
          onChangeText={setPassword}
          placeholder="Dein Passwort"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={styles.input}
          value={password}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={submit}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Anmelden</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.notice}>Reklaio organisiert Verbraucherfälle und bietet keine Rechtsberatung.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
    overflow: "hidden"
  },
  glowPrimary: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -120,
    right: -105,
    backgroundColor: "rgba(129, 125, 255, 0.10)"
  },
  glowSecondary: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    bottom: -145,
    left: -110,
    backgroundColor: "rgba(83, 239, 232, 0.07)"
  },
  brandMark: {
    width: 76,
    height: 76,
    borderRadius: 18,
    alignSelf: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 10
  },
  brand: { color: colors.text, fontSize: 30, fontWeight: "900", textAlign: "center", marginTop: spacing.md },
  claim: { color: colors.muted, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.xl },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "rgba(16, 26, 61, 0.96)",
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8
  },
  eyebrow: { color: colors.accentSoft, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 25, fontWeight: "800", marginTop: spacing.sm },
  copy: { color: colors.muted, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.lg },
  label: { color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.text,
    backgroundColor: colors.panelSoft
  },
  error: { color: colors.danger, lineHeight: 20, marginTop: spacing.md },
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    marginTop: spacing.lg
  },
  buttonPressed: { opacity: 0.86 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  notice: { color: colors.muted, fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: spacing.lg }
});
