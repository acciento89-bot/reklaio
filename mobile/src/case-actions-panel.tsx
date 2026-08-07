import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import {
  ApiError,
  completeDeadlineRequest,
  createDeadlineRequest,
  createEventRequest,
  mobileCaseStatuses,
  updateCaseStatusRequest,
  type MobileCaseStatus
} from "@/src/api";
import { colors, radius, spacing } from "@/src/theme";

type SharedProps = {
  caseId: string;
  token: string;
  onChanged: () => Promise<void> | void;
  onUnauthorized?: () => Promise<void> | void;
};

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

function isUnauthorized(cause: unknown) {
  return cause instanceof ApiError && cause.status === 401;
}

export function CaseActionsPanel({
  caseId,
  token,
  currentStatus,
  onChanged,
  onUnauthorized
}: SharedProps & { currentStatus: string }) {
  const [statusSaving, setStatusSaving] = useState<MobileCaseStatus | null>(null);
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [deadlineSaving, setDeadlineSaving] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [eventSaving, setEventSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleError(cause: unknown, fallback: string) {
    if (isUnauthorized(cause) && onUnauthorized) {
      await onUnauthorized();
      return;
    }
    setError(errorMessage(cause, fallback));
  }

  async function changeStatus(status: MobileCaseStatus) {
    if (statusSaving || status === currentStatus) return;
    setStatusSaving(status);
    setError(null);
    setNotice(null);
    try {
      await updateCaseStatusRequest(token, caseId, status);
      setNotice("Status gespeichert.");
      await onChanged();
    } catch (cause) {
      await handleError(cause, "Der Status konnte nicht gespeichert werden.");
    } finally {
      setStatusSaving(null);
    }
  }

  async function addDeadline() {
    const cleanTitle = deadlineTitle.trim();
    if (cleanTitle.length < 2) {
      setError("Bitte gib eine Bezeichnung für die Frist ein.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setError("Bitte gib das Datum als JJJJ-MM-TT ein.");
      return;
    }

    setDeadlineSaving(true);
    setError(null);
    setNotice(null);
    try {
      await createDeadlineRequest(token, caseId, cleanTitle, dueDate);
      setDeadlineTitle("");
      setDueDate("");
      setNotice("Frist hinzugefügt.");
      await onChanged();
    } catch (cause) {
      await handleError(cause, "Die Frist konnte nicht gespeichert werden.");
    } finally {
      setDeadlineSaving(false);
    }
  }

  async function addEvent() {
    const cleanTitle = eventTitle.trim();
    if (cleanTitle.length < 2) {
      setError("Bitte gib einen Titel für den Chronik-Eintrag ein.");
      return;
    }

    setEventSaving(true);
    setError(null);
    setNotice(null);
    try {
      await createEventRequest(token, caseId, {
        title: cleanTitle,
        details: eventDetails.trim()
      });
      setEventTitle("");
      setEventDetails("");
      setNotice("Chronik-Eintrag gespeichert.");
      await onChanged();
    } catch (cause) {
      await handleError(cause, "Der Chronik-Eintrag konnte nicht gespeichert werden.");
    } finally {
      setEventSaving(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.panel}>
        <Text style={styles.eyebrow}>Bearbeitung</Text>
        <Text style={styles.title}>Status ändern</Text>
        <View style={styles.chipGrid}>
          {mobileCaseStatuses.map((item) => {
            const active = item.value === currentStatus;
            const saving = statusSaving === item.value;
            return (
              <Pressable
                key={item.value}
                disabled={Boolean(statusSaving)}
                onPress={() => void changeStatus(item.value)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.accentSoft} />
                ) : (
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.eyebrow}>Fristen</Text>
        <Text style={styles.title}>Neue Frist hinzufügen</Text>
        <TextInput
          value={deadlineTitle}
          onChangeText={setDeadlineTitle}
          placeholder="z. B. Zahlungsfrist"
          placeholderTextColor={colors.muted}
          maxLength={180}
          style={styles.input}
        />
        <TextInput
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="JJJJ-MM-TT"
          placeholderTextColor={colors.muted}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          maxLength={10}
          style={styles.input}
        />
        <Pressable
          disabled={deadlineSaving}
          onPress={() => void addDeadline()}
          style={({ pressed }) => [styles.primaryButton, deadlineSaving && styles.disabled, pressed && styles.pressed]}
        >
          {deadlineSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Frist speichern</Text>}
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.eyebrow}>Chronik</Text>
        <Text style={styles.title}>Neuen Eintrag erfassen</Text>
        <TextInput
          value={eventTitle}
          onChangeText={setEventTitle}
          placeholder="z. B. Händler erneut angeschrieben"
          placeholderTextColor={colors.muted}
          maxLength={180}
          style={styles.input}
        />
        <TextInput
          value={eventDetails}
          onChangeText={setEventDetails}
          placeholder="Details, Zusagen oder Feststellungen"
          placeholderTextColor={colors.muted}
          maxLength={4000}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.textarea]}
        />
        <Pressable
          disabled={eventSaving}
          onPress={() => void addEvent()}
          style={({ pressed }) => [styles.primaryButton, eventSaving && styles.disabled, pressed && styles.pressed]}
        >
          {eventSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Zur Chronik hinzufügen</Text>}
        </Pressable>
      </View>
    </View>
  );
}

export function CompleteDeadlineButton({
  caseId,
  deadlineId,
  token,
  onChanged,
  onUnauthorized
}: SharedProps & { deadlineId: string }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await completeDeadlineRequest(token, caseId, deadlineId);
      await onChanged();
    } catch (cause) {
      if (isUnauthorized(cause) && onUnauthorized) {
        await onUnauthorized();
      } else {
        setError(errorMessage(cause, "Die Frist konnte nicht erledigt werden."));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.completeWrap}>
      <Pressable
        disabled={saving}
        onPress={() => void complete()}
        style={({ pressed }) => [styles.completeButton, pressed && styles.pressed]}
      >
        {saving ? <ActivityIndicator size="small" color={colors.success} /> : <Text style={styles.completeText}>Erledigen</Text>}
      </Pressable>
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md, marginBottom: spacing.md },
  panel: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  eyebrow: { color: colors.accentSoft, fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 19, fontWeight: "800", marginTop: spacing.xs, marginBottom: spacing.md },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { minHeight: 40, minWidth: 92, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm, borderRadius: 999, borderWidth: 1, borderColor: colors.line },
  chipActive: { borderColor: colors.accentSoft, backgroundColor: "rgba(143,199,187,0.12)" },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: colors.accentSoft },
  input: { minHeight: 50, color: colors.text, backgroundColor: colors.panelSoft, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  textarea: { minHeight: 112, paddingTop: spacing.md },
  primaryButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.accent, marginTop: spacing.xs },
  primaryText: { color: colors.white, fontWeight: "800" },
  error: { color: colors.danger, lineHeight: 20, padding: spacing.md, borderRadius: radius.sm, backgroundColor: "rgba(226,125,131,0.12)" },
  notice: { color: colors.success, lineHeight: 20, padding: spacing.md, borderRadius: radius.sm, backgroundColor: "rgba(117,189,169,0.12)" },
  completeWrap: { alignItems: "flex-end", maxWidth: 112 },
  completeButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 999, borderWidth: 1, borderColor: colors.success },
  completeText: { color: colors.success, fontSize: 12, fontWeight: "800" },
  inlineError: { color: colors.danger, fontSize: 10, textAlign: "right", marginTop: 4 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82 }
});
