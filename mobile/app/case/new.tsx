import { useEffect, useMemo, useState } from "react";
import { Redirect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import {
  ApiError,
  caseTypesRequest,
  createCaseRequest,
  type MobileCaseType
} from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { colors, radius, spacing } from "@/src/theme";

export default function NewCaseScreen() {
  const router = useRouter();
  const { status, token, logout } = useAuth();
  const [caseTypes, setCaseTypes] = useState<MobileCaseType[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [amount, setAmount] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let active = true;
    void caseTypesRequest(token)
      .then((response) => {
        if (!active) return;
        setCaseTypes(response.caseTypes);
        setSelectedType((current) => current || response.caseTypes[0]?.slug || "");
      })
      .catch(async (cause) => {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) {
          await logout();
          return;
        }
        setError(cause instanceof Error ? cause.message : "Fallarten konnten nicht geladen werden.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, logout]);

  const selected = useMemo(
    () => caseTypes.find((item) => item.slug === selectedType) ?? null,
    [caseTypes, selectedType]
  );

  async function submit() {
    if (!token) return;
    if (!selectedType) {
      setError("Bitte wähle eine Fallart.");
      return;
    }
    if (title.trim().length < 3) {
      setError("Der Titel muss mindestens drei Zeichen enthalten.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await createCaseRequest(token, {
        type: selectedType,
        title,
        companyName,
        orderReference,
        amount,
        incidentDate,
        summary
      });
      router.replace(`/case/${response.case.id}`);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        await logout();
        return;
      }
      setError(cause instanceof Error ? cause.message : "Der Fall konnte nicht angelegt werden.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentSoft} />
      </View>
    );
  }

  if (status !== "authenticated") return <Redirect href="/login" />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Zurück</Text>
        </Pressable>

        <Text style={styles.eyebrow}>Neue Fallakte</Text>
        <Text style={styles.heading}>Fall strukturiert anlegen</Text>
        <Text style={styles.intro}>
          Erfasse die wichtigsten Angaben. Alles wird sofort mit deinem Reklaio-Konto synchronisiert.
        </Text>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.accentSoft} />
            <Text style={styles.muted}>Fallarten werden geladen …</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Passende Situation</Text>
            <View style={styles.typeList}>
              {caseTypes.map((item) => {
                const active = selectedType === item.slug;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    key={item.slug}
                    onPress={() => setSelectedType(item.slug)}
                    style={[styles.typeCard, active && styles.typeCardActive]}
                  >
                    <View style={[styles.typeIcon, active && styles.typeIconActive]}>
                      <Text style={styles.typeIconText}>{item.icon}</Text>
                    </View>
                    <View style={styles.typeCopy}>
                      <Text style={styles.typeTitle}>{item.title}</Text>
                      <Text style={styles.typeDescription}>{item.description}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {selected ? (
              <View style={styles.checklistCard}>
                <Text style={styles.checklistTitle}>{selected.checklistTitle}</Text>
                {selected.checklist.map((item) => (
                  <Text key={item} style={styles.checklistItem}>• {item}</Text>
                ))}
              </View>
            ) : null}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Grunddaten</Text>

          <Text style={styles.label}>Titel des Falls *</Text>
          <TextInput
            maxLength={140}
            onChangeText={setTitle}
            placeholder="z. B. Rückzahlung für retournierte Bestellung"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={title}
          />

          <Text style={styles.label}>Anbieter oder Unternehmen</Text>
          <TextInput
            maxLength={160}
            onChangeText={setCompanyName}
            placeholder="z. B. Beispiel-Shop GmbH"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={companyName}
          />

          <Text style={styles.label}>Bestell-, Vertrags- oder Vorgangsnummer</Text>
          <TextInput
            autoCapitalize="characters"
            maxLength={120}
            onChangeText={setOrderReference}
            placeholder="optional"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={orderReference}
          />

          <Text style={styles.label}>Betrag in Euro</Text>
          <TextInput
            keyboardType="decimal-pad"
            maxLength={32}
            onChangeText={setAmount}
            placeholder="129,90"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={amount}
          />

          <Text style={styles.label}>Datum des Vorfalls</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={setIncidentDate}
            placeholder="JJJJ-MM-TT"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={incidentDate}
          />
          <Text style={styles.hint}>Beispiel: 2026-08-07</Text>

          <Text style={styles.label}>Kurze Zusammenfassung</Text>
          <TextInput
            maxLength={5000}
            multiline
            onChangeText={setSummary}
            placeholder="Was ist passiert, was wurde bereits versucht und was wurde zugesagt?"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.textarea]}
            textAlignVertical="top"
            value={summary}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={submitting || loading}
          onPress={submit}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
            (submitting || loading) && styles.disabled
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Fallakte anlegen</Text>
          )}
        </Pressable>

        <Text style={styles.notice}>Reklaio organisiert Verbraucherfälle und bietet keine Rechtsberatung.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  backButton: { alignSelf: "flex-start", paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { color: colors.accentSoft, fontWeight: "800" },
  eyebrow: { color: colors.accentSoft, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  heading: { color: colors.text, fontSize: 30, fontWeight: "900", marginTop: spacing.xs },
  intro: { color: colors.muted, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.lg },
  muted: { color: colors.muted },
  loadingCard: { flexDirection: "row", gap: spacing.sm, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  section: { padding: spacing.md, marginBottom: spacing.md, borderRadius: radius.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: spacing.md },
  typeList: { gap: spacing.sm },
  typeCard: { flexDirection: "row", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panelSoft },
  typeCardActive: { borderColor: colors.accentSoft, backgroundColor: "rgba(47,125,114,0.18)" },
  typeIcon: { width: 42, height: 42, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel },
  typeIconActive: { backgroundColor: colors.accent },
  typeIconText: { color: colors.white, fontSize: 21, fontWeight: "900" },
  typeCopy: { flex: 1 },
  typeTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  typeDescription: { color: colors.muted, lineHeight: 20, marginTop: spacing.xs },
  checklistCard: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.sm, backgroundColor: "rgba(143,199,187,0.08)" },
  checklistTitle: { color: colors.accentSoft, fontWeight: "800", marginBottom: spacing.sm },
  checklistItem: { color: colors.muted, lineHeight: 21, marginBottom: 3 },
  label: { color: colors.text, fontWeight: "700", marginTop: spacing.md, marginBottom: spacing.xs },
  input: { minHeight: 50, paddingHorizontal: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, color: colors.text, backgroundColor: colors.panelSoft },
  textarea: { minHeight: 140, paddingTop: spacing.md },
  hint: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
  error: { color: colors.danger, lineHeight: 21, padding: spacing.md, borderRadius: radius.sm, backgroundColor: "rgba(226,125,131,0.12)", marginBottom: spacing.md },
  primaryButton: { minHeight: 54, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.accent },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.55 },
  notice: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: spacing.lg }
});
