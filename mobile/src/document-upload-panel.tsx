import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  ApiError,
  mobileDocumentTypes,
  uploadDocumentRequest,
  type DocumentTypeValue,
  type UploadDocumentFile
} from "@/src/api";
import { colors, radius, spacing } from "@/src/theme";

const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024;

function extensionForMime(mimeType: string) {
  const extensions: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif"
  };
  return extensions[mimeType.toLowerCase()] || "bin";
}

function inferMimeType(name: string, declared?: string | null) {
  if (declared) return declared;
  const extension = name.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif"
  };
  return extension ? mimeTypes[extension] || "application/octet-stream" : "application/octet-stream";
}

function formatFileSize(bytes?: number | null) {
  if (!bytes && bytes !== 0) return "Größe wird beim Upload geprüft";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

type SelectedFile = UploadDocumentFile & {
  size?: number | null;
};

type DocumentUploadPanelProps = {
  caseId: string;
  token: string;
  onUploaded: () => Promise<void> | void;
};

export function DocumentUploadPanel({ caseId, token, onUploaded }: DocumentUploadPanelProps) {
  const [selectedType, setSelectedType] = useState<DocumentTypeValue>("other");
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function acceptFile(file: SelectedFile) {
    if (file.size && file.size > MAX_DOCUMENT_SIZE) {
      setSelectedFile(null);
      setError("Die Datei ist größer als 15 MB.");
      return;
    }
    setSelectedFile(file);
    setError(null);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Kamerazugriff benötigt", "Erlaube Reklaio den Kamerazugriff, um einen Beleg zu fotografieren.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = inferMimeType(asset.fileName || asset.uri, asset.mimeType);
    acceptFile({
      uri: asset.uri,
      name: asset.fileName || `beleg-${Date.now()}.${extensionForMime(mimeType)}`,
      mimeType,
      size: asset.fileSize
    });
    setSelectedType("photo");
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
      selectionLimit: 1
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = inferMimeType(asset.fileName || asset.uri, asset.mimeType);
    acceptFile({
      uri: asset.uri,
      name: asset.fileName || `bild-${Date.now()}.${extensionForMime(mimeType)}`,
      mimeType,
      size: asset.fileSize
    });
    setSelectedType("photo");
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif"
      ],
      copyToCacheDirectory: true,
      multiple: false
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    acceptFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: inferMimeType(asset.name, asset.mimeType),
      size: asset.size
    });
  }

  async function upload() {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setError(null);
    try {
      await uploadDocumentRequest(token, caseId, selectedType, selectedFile);
      setSelectedFile(null);
      setSelectedType("other");
      await onUploaded();
    } catch (cause) {
      setError(cause instanceof ApiError || cause instanceof Error
        ? cause.message
        : "Das Dokument konnte nicht hochgeladen werden.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Beleg hinzufügen</Text>
      <Text style={styles.copy}>Fotografiere einen Beleg oder wähle ein Bild beziehungsweise PDF. Maximal 15 MB.</Text>

      <View style={styles.sourceRow}>
        <Pressable onPress={() => void takePhoto()} style={({ pressed }) => [styles.sourceButton, pressed && styles.pressed]}>
          <Text style={styles.sourceIcon}>⌁</Text>
          <Text style={styles.sourceText}>Kamera</Text>
        </Pressable>
        <Pressable onPress={() => void pickImage()} style={({ pressed }) => [styles.sourceButton, pressed && styles.pressed]}>
          <Text style={styles.sourceIcon}>▧</Text>
          <Text style={styles.sourceText}>Fotos</Text>
        </Pressable>
        <Pressable onPress={() => void pickDocument()} style={({ pressed }) => [styles.sourceButton, pressed && styles.pressed]}>
          <Text style={styles.sourceIcon}>▤</Text>
          <Text style={styles.sourceText}>PDF/Datei</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Dokumentart</Text>
      <View style={styles.typeGrid}>
        {mobileDocumentTypes.map((item) => {
          const active = selectedType === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setSelectedType(item.value)}
              style={({ pressed }) => [styles.typeChip, active && styles.typeChipActive, pressed && styles.pressed]}
            >
              <Text style={[styles.typeText, active && styles.typeTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedFile ? (
        <View style={styles.fileCard}>
          <View style={styles.fileIcon}><Text style={styles.fileIconText}>▤</Text></View>
          <View style={styles.fileMain}>
            <Text numberOfLines={2} style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileMeta}>{formatFileSize(selectedFile.size)}</Text>
          </View>
          <Pressable disabled={uploading} onPress={() => setSelectedFile(null)}>
            <Text style={styles.remove}>Entfernen</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        disabled={!selectedFile || uploading}
        onPress={() => void upload()}
        style={({ pressed }) => [styles.uploadButton, (!selectedFile || uploading) && styles.disabled, pressed && styles.pressed]}
      >
        {uploading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.uploadText}>In die Fallakte hochladen</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 18, fontWeight: "800" },
  copy: { color: colors.muted, lineHeight: 20, marginTop: spacing.xs },
  sourceRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  sourceButton: { flex: 1, minHeight: 72, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  sourceIcon: { color: colors.accentSoft, fontSize: 22, marginBottom: 4 },
  sourceText: { color: colors.text, fontSize: 12, fontWeight: "800" },
  label: { color: colors.text, fontWeight: "800", marginTop: spacing.lg, marginBottom: spacing.sm },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  typeChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderRadius: 999, borderWidth: 1, borderColor: colors.line },
  typeChipActive: { backgroundColor: "rgba(143,199,187,0.12)", borderColor: colors.accentSoft },
  typeText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  typeTextActive: { color: colors.accentSoft },
  fileCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.panel, marginTop: spacing.md },
  fileIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.panelSoft },
  fileIconText: { color: colors.accentSoft, fontSize: 20 },
  fileMain: { flex: 1 },
  fileName: { color: colors.text, fontWeight: "800", lineHeight: 19 },
  fileMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  remove: { color: colors.danger, fontSize: 12, fontWeight: "800" },
  error: { color: colors.danger, lineHeight: 20, marginTop: spacing.md },
  uploadButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.accent, marginTop: spacing.md },
  uploadText: { color: colors.white, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82 }
});
