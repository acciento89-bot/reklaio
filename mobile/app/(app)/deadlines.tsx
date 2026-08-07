import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { ApiError, deadlinesRequest, type MobileDeadline } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { colors, radius, spacing } from "@/src/theme";

const stateLabels: Record<MobileDeadline["state"], string> = {
  overdue: "Überfällig",
  soon: "Bald fällig",
  open: "Offen",
  completed: "Erledigt"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export default function DeadlinesScreen() {
  const { token, logout } = useAuth();
  const [deadlines, setDeadlines] = useState<MobileDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!token) return;
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const response = await deadlinesRequest(token);
      setDeadlines(response.deadlines);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        await logout();
        return;
      }
      setError(cause instanceof Error ? cause.message : "Fristen konnten nicht geladen werden.");
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

  const stats = useMemo(() => ({
    overdue: deadlines.filter((item) => item.state === "overdue").length,
    soon: deadlines.filter((item) => item.state === "soon").length,
    open: deadlines.filter((item) => item.state !== "completed").length
  }), [deadlines]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentSoft} />
        <Text style={styles.muted}>Fristen werden geladen …</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={deadlines}
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
          <Text style={styles.eyebrow}>Termine im Blick</Text>
          <Text style={styles.heading}>Fristen</Text>
          <Text style={styles.intro}>Offene und erledigte Fristen aus allen deinen Fallakten.</Text>

          <View style={styles.stats}>
            <View style={[styles.stat, styles.statDanger]}>
              <Text style={styles.statLabel}>Überfällig</Text>
              <Text style={styles.statValue}>{stats.overdue}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Nächste 7 Tage</Text>
              <Text style={styles.statValue}>{stats.soon}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Offen</Text>
              <Text style={styles.statValue}>{stats.open}</Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Keine Fristen vorhanden</Text>
          <Text style={styles.muted}>Sobald du in einer Fallakte eine Frist anlegst, erscheint sie hier.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, item.state === "overdue" && styles.cardOverdue]}>
          <View style={styles.cardTop}>
            <Text style={styles.date}>{formatDate(item.dueAt)}</Text>
            <Text style={[styles.state, item.state === "overdue" && styles.stateOverdue]}>
              {stateLabels[item.state]}
            </Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.caseTitle}>{item.caseTitle}</Text>
          {item.companyName ? <Text style={styles.company}>{item.companyName}</Text> : null}
        </View>
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
  stats: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  stat: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  statDanger: { borderColor: "rgba(226,125,131,0.45)" },
  statLabel: { color: colors.muted, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 26, fontWeight: "900", marginTop: spacing.xs },
  error: { color: colors.danger, marginTop: spacing.md, lineHeight: 21 },
  empty: { padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: spacing.sm },
  card: { padding: spacing.md, marginBottom: spacing.md, borderRadius: radius.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  cardOverdue: { borderColor: "rgba(226,125,131,0.5)" },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  date: { color: colors.text, fontWeight: "800" },
  state: { color: colors.accentSoft, fontSize: 12, fontWeight: "800" },
  stateOverdue: { color: colors.danger },
  title: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: spacing.md },
  caseTitle: { color: colors.muted, marginTop: spacing.xs },
  company: { color: colors.muted, fontSize: 13, marginTop: 3 }
});
