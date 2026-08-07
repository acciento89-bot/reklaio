import { useCallback, useState } from "react";
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { ApiError, caseRequest, type MobileCaseDetail } from "@/src/api";
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

const typeLabels: Record<string, string> = {
  refund_missing: "Rückzahlung fehlt",
  delivery_missing: "Lieferung fehlt",
  product_problem: "Ware defekt oder falsch",
  cancellation_ignored: "Kündigung wird ignoriert"
};

function formatDate(value: string | null) {
  if (!value) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatAmount(cents: number | null, currency: string) {
  if (cents === null) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency
  }).format(cents / 100);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export default function CaseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const caseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { status, token, logout } = useAuth();
  const [currentCase, setCurrentCase] = useState<MobileCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!token || !caseId) {
      setLoading(false);
      return;
    }

    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const response = await caseRequest(token, caseId);
      setCurrentCase(response.case);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        await logout();
        return;
      }
      setError(cause instanceof Error ? cause.message : "Die Fallakte konnte nicht geladen werden.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, caseId, logout]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentSoft} />
      </View>
    );
  }

  if (status !== "authenticated") return <Redirect href="/login" />;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentSoft} />
        <Text style={styles.muted}>Fallakte wird geladen …</Text>
      </View>
    );
  }

  if (!currentCase) {
    return (
      <View style={styles.centerPage}>
        <Text style={styles.errorTitle}>Fallakte nicht verfügbar</Text>
        <Text style={styles.muted}>{error || "Der Fall wurde nicht gefunden."}</Text>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Zurück zu meinen Fällen</Text>
        </Pressable>
      </View>
    );
  }

  const openDeadlines = currentCase.deadlines.filter((item) => !item.completedAt);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          onRefresh={() => void load(true)}
          refreshing={refreshing}
          tintColor={colors.accentSoft}
        />
      }
    >
      <View style={styles.topActions}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Alle Fälle</Text>
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL(`https://reklaio.de/faelle/${currentCase.id}`)}
          style={styles.webButton}
        >
          <Text style={styles.webButtonText}>Im Web öffnen</Text>
        </Pressable>
      </View>

      <Text style={styles.eyebrow}>{typeLabels[currentCase.type] || "Verbraucherfall"}</Text>
      <Text style={styles.heading}>{currentCase.title}</Text>
      <Text style={styles.company}>{currentCase.companyName || "Noch kein Anbieter eingetragen"}</Text>
      <Text style={styles.status}>{statusLabels[currentCase.status] || currentCase.status}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>Überblick</Text>
        <Text style={styles.sectionTitle}>Falldaten</Text>
        <View style={styles.factGrid}>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Anbieter</Text>
            <Text style={styles.factValue}>{currentCase.companyName || "–"}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Referenz</Text>
            <Text style={styles.factValue}>{currentCase.orderReference || "–"}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Betrag</Text>
            <Text style={styles.factValue}>{formatAmount(currentCase.amountCents, currentCase.currency)}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Vorfallsdatum</Text>
            <Text style={styles.factValue}>{formatDate(currentCase.incidentDate)}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Angelegt</Text>
            <Text style={styles.factValue}>{formatDate(currentCase.createdAt)}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Geändert</Text>
            <Text style={styles.factValue}>{formatDate(currentCase.updatedAt)}</Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Zusammenfassung</Text>
          <Text style={styles.summaryText}>{currentCase.summary || "Noch keine Zusammenfassung erfasst."}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>Fristen</Text>
            <Text style={styles.sectionTitle}>{openDeadlines.length} offen</Text>
          </View>
          <Text style={styles.counter}>{currentCase.deadlines.length}</Text>
        </View>

        {currentCase.deadlines.length === 0 ? (
          <Text style={styles.muted}>Noch keine Frist erfasst.</Text>
        ) : currentCase.deadlines.map((deadline) => (
          <View
            key={deadline.id}
            style={[styles.listItem, deadline.completedAt && styles.listItemCompleted]}
          >
            <View style={styles.listItemMain}>
              <Text style={styles.listItemTitle}>{deadline.title}</Text>
              <Text style={styles.listItemMeta}>Fällig: {formatDate(deadline.dueAt)}</Text>
            </View>
            <Text style={deadline.completedAt ? styles.done : styles.open}>
              {deadline.completedAt ? "Erledigt" : "Offen"}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>Belege</Text>
            <Text style={styles.sectionTitle}>Dokumente</Text>
          </View>
          <Text style={styles.counter}>{currentCase.documents.length}</Text>
        </View>

        {currentCase.documents.length === 0 ? (
          <Text style={styles.muted}>Noch keine Dokumente hochgeladen.</Text>
        ) : currentCase.documents.map((document) => (
          <View key={document.id} style={styles.listItem}>
            <View style={styles.documentIcon}>
              <Text style={styles.documentIconText}>▤</Text>
            </View>
            <View style={styles.listItemMain}>
              <Text numberOfLines={2} style={styles.listItemTitle}>{document.originalName}</Text>
              <Text style={styles.listItemMeta}>{formatFileSize(document.sizeBytes)} · {formatDate(document.createdAt)}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.nextStepHint}>Kamera und nativer Dokumentupload folgen im nächsten Bauabschnitt.</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>Chronik</Text>
            <Text style={styles.sectionTitle}>Was bisher passiert ist</Text>
          </View>
          <Text style={styles.counter}>{currentCase.events.length}</Text>
        </View>

        {currentCase.events.length === 0 ? (
          <Text style={styles.muted}>Noch keine Chronik vorhanden.</Text>
        ) : currentCase.events.map((event) => (
          <View key={event.id} style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineCopy}>
              <Text style={styles.timelineDate}>{formatDateTime(event.occurredAt)}</Text>
              <Text style={styles.listItemTitle}>{event.title}</Text>
              {event.details ? <Text style={styles.timelineDetails}>{event.details}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.notice}>Reklaio organisiert Verbraucherfälle und bietet keine Rechtsberatung.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.background, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, backgroundColor: colors.background },
  centerPage: { flex: 1, justifyContent: "center", padding: spacing.lg, backgroundColor: colors.background },
  topActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  backButton: { paddingVertical: spacing.sm },
  backText: { color: colors.accentSoft, fontWeight: "800" },
  webButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line },
  webButtonText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  eyebrow: { color: colors.accentSoft, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  heading: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: "900", marginTop: spacing.xs },
  company: { color: colors.muted, fontSize: 16, marginTop: spacing.sm },
  status: { alignSelf: "flex-start", color: colors.accentSoft, fontSize: 12, fontWeight: "800", paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 999, backgroundColor: "rgba(143,199,187,0.1)", overflow: "hidden", marginTop: spacing.md, marginBottom: spacing.lg },
  errorTitle: { color: colors.text, fontSize: 24, fontWeight: "900", marginBottom: spacing.sm },
  error: { color: colors.danger, lineHeight: 21, padding: spacing.md, borderRadius: radius.sm, backgroundColor: "rgba(226,125,131,0.12)", marginBottom: spacing.md },
  muted: { color: colors.muted, lineHeight: 21 },
  section: { padding: spacing.md, marginBottom: spacing.md, borderRadius: radius.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
  sectionEyebrow: { color: colors.accentSoft, fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: spacing.xs, marginBottom: spacing.md },
  counter: { minWidth: 32, height: 32, textAlign: "center", textAlignVertical: "center", color: colors.accentSoft, fontWeight: "800", borderRadius: 16, backgroundColor: colors.panelSoft, overflow: "hidden" },
  factGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  fact: { minWidth: "47%", flexGrow: 1, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.panelSoft },
  factLabel: { color: colors.muted, fontSize: 12 },
  factValue: { color: colors.text, fontWeight: "700", marginTop: 4 },
  summaryBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.panelSoft },
  summaryTitle: { color: colors.text, fontWeight: "800", marginBottom: spacing.sm },
  summaryText: { color: colors.muted, lineHeight: 22 },
  listItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.line },
  listItemCompleted: { opacity: 0.62 },
  listItemMain: { flex: 1 },
  listItemTitle: { color: colors.text, fontWeight: "800", lineHeight: 21 },
  listItemMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  open: { color: colors.warning, fontSize: 12, fontWeight: "800" },
  done: { color: colors.success, fontSize: 12, fontWeight: "800" },
  documentIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.panelSoft },
  documentIconText: { color: colors.accentSoft, fontSize: 20 },
  nextStepHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
  timelineItem: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.line },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentSoft, marginTop: 5 },
  timelineCopy: { flex: 1 },
  timelineDate: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  timelineDetails: { color: colors.muted, lineHeight: 21, marginTop: spacing.xs },
  secondaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, marginTop: spacing.lg },
  secondaryButtonText: { color: colors.text, fontWeight: "800" },
  notice: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: spacing.md }
});
