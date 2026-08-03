import path from "node:path";

export const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024;

export const documentTypes = [
  { value: "invoice", label: "Rechnung oder Bestellbeleg" },
  { value: "email", label: "E-Mail oder Schriftverkehr" },
  { value: "photo", label: "Foto oder Screenshot" },
  { value: "tracking", label: "Versand- oder Trackingbeleg" },
  { value: "other", label: "Sonstiger Beleg" }
] as const;

export type DocumentTypeValue = (typeof documentTypes)[number]["value"];

const allowedFiles = [
  { mime: "application/pdf", extension: "pdf", matches: (bytes: Uint8Array) => textAt(bytes, 0, 5) === "%PDF-" },
  { mime: "image/jpeg", extension: "jpg", matches: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  { mime: "image/png", extension: "png", matches: (bytes: Uint8Array) => bytes.length >= 8 && bytes[0] === 0x89 && textAt(bytes, 1, 3) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a },
  { mime: "image/webp", extension: "webp", matches: (bytes: Uint8Array) => textAt(bytes, 0, 4) === "RIFF" && textAt(bytes, 8, 4) === "WEBP" },
  { mime: "image/heic", extension: "heic", matches: isHeifFamily },
  { mime: "image/heif", extension: "heif", matches: isHeifFamily }
] as const;

function textAt(bytes: Uint8Array, offset: number, length: number) {
  if (bytes.length < offset + length) {
    return "";
  }

  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function isHeifFamily(bytes: Uint8Array) {
  if (textAt(bytes, 4, 4) !== "ftyp") {
    return false;
  }

  const brand = textAt(bytes, 8, 4);
  return ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand);
}

export function detectAllowedFile(bytes: Uint8Array, declaredMime: string) {
  const normalizedMime = declaredMime.toLowerCase();
  const candidates = allowedFiles.filter((item) => item.mime === normalizedMime);
  const match = candidates.find((item) => item.matches(bytes));

  if (match) {
    return { mime: match.mime, extension: match.extension };
  }

  // Einige Geräte melden HEIC als generisches HEIF oder umgekehrt.
  if (["image/heic", "image/heif"].includes(normalizedMime) && isHeifFamily(bytes)) {
    return { mime: normalizedMime, extension: normalizedMime === "image/heic" ? "heic" : "heif" };
  }

  return null;
}

export function getUploadDirectory() {
  return path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
}

export function resolveStoragePath(storageKey: string) {
  const uploadDirectory = getUploadDirectory();
  const absolutePath = path.resolve(uploadDirectory, storageKey);
  const allowedPrefix = `${uploadDirectory}${path.sep}`;

  if (!absolutePath.startsWith(allowedPrefix)) {
    throw new Error("Invalid storage key");
  }

  return absolutePath;
}

export function safeDownloadName(originalName: string) {
  const cleaned = originalName.replace(/[\r\n\0"]/g, "_").slice(0, 180) || "dokument";
  return cleaned;
}

export function formatFileSize(value: string | number) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "–";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getDocumentTypeLabel(value: string | null) {
  return documentTypes.find((item) => item.value === value)?.label ?? "Dokument";
}
