import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { deleteAccountRequest } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { usePurchases } from "@/src/purchases-context";
import { colors, radius, spacing } from "@/src/theme";

export default function AccountDeleteScreen() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const { openSubscriptionManagement } = usePurchases();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = password.length >= 10 && confirmation.toLocaleUpperCase("de-DE") === "LÖSCHEN";

  async function deleteAccount() {
    if (!token || !canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await deleteAccountRequest(token, password, confirmation);
      await logout().catch(() => undefined);
      Alert.alert(
        "Konto gelöscht",
        "Dein Reklaio-Konto und die damit verbundenen Fallakten wurden gelöscht. Ein Apple- oder Google-Abonnement muss separat im jeweiligen Store gekündigt werden."
      );
      router.replace("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Das Konto konnte nicht gelöscht werden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Konto löschen",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false
        }}
      />
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>Kontolöschung</Text>
        <Text style={styles.heading}>Konto endgültig löschen</Text>
        <Text style={styles.intro}>
          Dabei werden dein Reklaio-Konto, deine Fallakten, Fristen und hochgeladenen Dokumente dauerhaft entfernt. Dieser Vorgang kann nicht rückgängig gemacht werden.
        </Text>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Abonnement separat kündigen</Text>
          <Text style={styles.copy}>
            Eine Kontolöschung beendet kein über Apple oder Google abgeschlossenes Abonnement. Die Abrechnung läuft beim Store weiter, bis du dort kündigst. Du darfst dein Reklaio-Konto trotzdem sofort löschen.
          </Text>
          <Pressable
            onPress={() => void openSubscriptionManagement()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Store-Abonnement verwalten</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.label}>Aktuelles Passwort</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
            onChangeText={setPassword}
            placeholder="Passwort eingeben"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          <Text style={[styles.label, styles.confirmationLabel]}>Zur Bestätigung LÖSCHEN eingeben</Text>
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!submitting}
            onChangeText={setConfirmation}
            placeholder="LÖSCHEN"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={confirmation}
          />
        </View>

        <Pressable
          disabled={!canSubmit || submitting}
          onPress={() => void deleteAccount()}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
            (!canSubmit || submitting) && styles.disabled
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.deleteButtonText}>Konto und Daten endgültig löschen</Text>
          )}
        </Pressable>

        <Pressable
          disabled={submitting}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelButtonText}>Abbrechen</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  screen: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    flexGrow: 1
  },
  eyebrow: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: spacing.xs
  },
  intro: {
    color: colors.muted,
    lineHeight: 22,
    marginTop: spacing.sm,
    marginBottom: spacing.lg
  },
  warningCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(226,125,131,0.45)",
    backgroundColor: "rgba(226,125,131,0.1)"
  },
  warningTitle: { color: colors.danger, fontSize: 18, fontWeight: "800" },
  copy: { color: colors.muted, lineHeight: 22, marginTop: spacing.sm },
  secondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: spacing.md
  },
  secondaryButtonText: { color: colors.text, fontWeight: "800" },
  error: {
    color: colors.danger,
    lineHeight: 20,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: "rgba(226,125,131,0.12)",
    marginBottom: spacing.md
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel
  },
  label: { color: colors.text, fontSize: 14, fontWeight: "800" },
  confirmationLabel: { marginTop: spacing.lg },
  input: {
    minHeight: 50,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 16
  },
  deleteButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md
  },
  deleteButtonText: { color: colors.white, fontWeight: "900", textAlign: "center" },
  cancelButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm
  },
  cancelButtonText: { color: colors.muted, fontWeight: "800" },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 }
});
