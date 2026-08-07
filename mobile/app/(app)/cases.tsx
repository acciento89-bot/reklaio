import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { ApiError, casesRequest, type MobileCase } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { colors, radius, spacing } from "@/src/theme";

const statusLabels: Record<string, string> = {
  draft: "Entwurf",
  collecting_evidence: "Belege sammeln",
  ready_to_contact: "Kontakt vorbereiten",
  waiting_for_reply: "Antwort ausstehend",
  deadline_expired: "Frist abgelaufen",
  escalation: "Eskalation prüfen",
  resolved: "Gelöst",
  closed: "Geschlossen"
};

function formatDate(value: string | null) {
  if (!value) return "Keine offene Frist";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function formatAmount(cents: number | null, currency: string) {
  if (cents === null) return "Kein Betrag";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency
  }).format(cents / 100);
}

export default function CasesScreen() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [cases, setCases] = useState<MobileCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!token) return;
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const response = await casesRequest(token);
      setCases(response.cases);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        await logout();
        return;
      }
      setError(cause instanceof Error ? cause.message : "Fälle konnten nicht geladen werden.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, logout]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentSoft} />
        <Text style={styles.muted}>Fälle werden geladen …</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={cases}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void load(true)}
          tintColor={colors.accentSoft}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Arbeitszentrale</Text>
          <Text style={styles.heading}>Deine Fallakten</Text>
          <Text style={styles.intro}>Alle Fälle werden direkt mit der Reklaio-Web-App synchronisiert.</Text>
          <Pressable
            onPress={() => router.push("/case/new")}
            style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
          >
            <Text style={styles.createButtonText}>+ Neue Fallakte</Text>
          </Pressable>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => void load()} style={styles.retryButton}>
                <Text style={styles.retryText}>Erneut laden</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Noch keine Fallakte</Text>
          <Text style={styles.muted}>Lege deinen ersten Fall direkt in der App an.</Text>
          <Pressable
            onPress={() => router.push("/case/new")}
            style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
          >
            <Text style={styles.emptyButtonText}>Ersten Fall anlegen</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/case/${item.id}`)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.company}>{item.companyName || "Ohne Unternehmen"}</Text>
            </View>
            <Text style={styles.status}>{statusLabels[item.status] || item.status}</Text>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Betrag</Text>
              <Text style={styles.metaValue}>{formatAmount(item.amountCents, item.currency)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Nächste Frist</Text>
              <Text style={styles.metaValue}>{formatDate(item.nextDueAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Dokumente</Text>
              <Text style={styles.metaValue}>{item.documentCount}</Text>
            </View>
          </View>

          <Text style={styles.openHint}>Fallakte öffnen →</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.background
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    flexGrow: 1
  },
  header: { marginBottom: spacing.lg },
  eyebrow: { color: colors.accentSoft, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  heading: { color: colors.text, fontSize: 30, fontWeight: "900", marginTop: spacing.xs },
  intro: { color: colors.muted, lineHeight: 22, marginTop: spacing.sm },
  muted: { color: colors.muted, lineHeight: 21 },
  createButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.accent, marginTop: spacing.lg },
  createButtonText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.84 },
  errorBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: "rgba(226,125,131,0.12)", borderWidth: 1, borderColor: "rgba(226,125,131,0.4)" },
  errorText: { color: colors.danger, lineHeight: 21 },
  retryButton: { marginTop: spacing.sm, alignSelf: "flex-start" },
  retryText: { color: colors.text, fontWeight: "800" },
  empty: { padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: spacing.sm },
  emptyButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, marginTop: spacing.lg },
  emptyButtonText: { color: colors.text, fontWeight: "800" },
  card: { padding: spacing.md, marginBottom: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  cardTitleWrap: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 19, fontWeight: "800" },
  company: { color: colors.muted, marginTop: spacing.xs },
  status: { color: colors.accentSoft, fontSize: 12, fontWeight: "800", paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 999, backgroundColor: "rgba(143,199,187,0.1)", overflow: "hidden" },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  metaItem: { minWidth: "30%", flexGrow: 1, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.panelSoft },
  metaLabel: { color: colors.muted, fontSize: 12 },
  metaValue: { color: colors.text, fontWeight: "700", marginTop: 4 },
  openHint: { color: colors.accentSoft, fontSize: 13, fontWeight: "800", textAlign: "right", marginTop: spacing.md }
});
