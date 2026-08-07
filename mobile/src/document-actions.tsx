import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  ApiError,
  deleteDocumentRequest,
  documentDownloadUrl,
  type MobileCaseDocument
} from "@/src/api";
import { colors, radius, spacing } from "@/src/theme";

type DocumentActionsProps = {
  caseId: string;
  document: MobileCaseDocument;
  token: string;
  onChanged: () => Promise<void> | void;
  onUnauthorized?: () => Promise<void> | void;
};

function localFileName(document: MobileCaseDocument) {
  const safeName = document.originalName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "dokument";
  return `${document.id}-${safeName}`;
}

export function DocumentActions({
  caseId,
  document,
  token,
  onChanged,
  onUnauthorized
}: DocumentActionsProps) {
  const [working, setWorking] = useState<"share" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUnauthorized(cause: unknown) {
    if (cause instanceof ApiError && cause.status === 401 && onUnauthorized) {
      await onUnauthorized();
      return true;
    }
    return false;
  }

  async function openOrShare() {
    if (working) return;
    setWorking("share");
    setError(null);

    try {
      if (!FileSystem.cacheDirectory) {
        throw new Error("Auf diesem Gerät ist kein temporärer Dateispeicher verfügbar.");
      }

      const destination = `${FileSystem.cacheDirectory}${localFileName(document)}`;
      await FileSystem.deleteAsync(destination, { idempotent: true });
      const result = await FileSystem.downloadAsync(
        documentDownloadUrl(caseId, document.id),
        destination,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (result.status !== 200) {
        throw new Error("Das Dokument konnte nicht geladen werden.");
      }

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        throw new Error("Das Teilen oder Öffnen wird auf diesem Gerät nicht unterstützt.");
      }

      await Sharing.shareAsync(result.uri, {
        mimeType: document.mimeType,
        dialogTitle: document.originalName,
        UTI: document.mimeType === "application/pdf" ? "com.adobe.pdf" : undefined
      });
    } catch (cause) {
      if (!(await handleUnauthorized(cause))) {
        setError(cause instanceof Error ? cause.message : "Das Dokument konnte nicht geöffnet werden.");
      }
    } finally {
      setWorking(null);
    }
  }

  function confirmDelete() {
    if (working) return;
    Alert.alert(
      "Dokument löschen?",
      `„${document.originalName}“ wird dauerhaft aus der Fallakte entfernt.`,
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Löschen", style: "destructive", onPress: () => void deleteDocument() }
      ]
    );
  }

  async function deleteDocument() {
    setWorking("delete");
    setError(null);
    try {
      await deleteDocumentRequest(token, caseId, document.id);
      await onChanged();
    } catch (cause) {
      if (!(await handleUnauthorized(cause))) {
        setError(cause instanceof Error ? cause.message : "Das Dokument konnte nicht gelöscht werden.");
      }
    } finally {
      setWorking(null);
    }
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.actions}>
        <Pressable
          disabled={Boolean(working)}
          onPress={() => void openOrShare()}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          {working === "share" ? (
            <ActivityIndicator size="small" color={colors.accentSoft} />
          ) : (
            <Text style={styles.openText}>Öffnen / teilen</Text>
          )}
        </Pressable>
        <Pressable
          disabled={Boolean(working)}
          onPress={confirmDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        >
          {working === "delete" ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Text style={styles.deleteText}>Löschen</Text>
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", marginTop: spacing.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  actionButton: { minHeight: 36, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.accentSoft },
  deleteButton: { minHeight: 36, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: "rgba(226,125,131,0.55)" },
  openText: { color: colors.accentSoft, fontSize: 12, fontWeight: "800" },
  deleteText: { color: colors.danger, fontSize: 12, fontWeight: "800" },
  error: { color: colors.danger, fontSize: 12, lineHeight: 18, marginTop: spacing.xs },
  pressed: { opacity: 0.8 }
});
