import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDb, query } from "@/lib/db";
import {
  MAX_DOCUMENT_SIZE,
  detectAllowedFile,
  documentTypes,
  getUploadDirectory,
  resolveStoragePath,
  type DocumentTypeValue
} from "@/lib/documents";
import { getMobileUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_DOCUMENT_TYPES = new Set<DocumentTypeValue>(documentTypes.map((item) => item.value));

type RouteContext = {
  params: Promise<{ id: string }>;
};

type DocumentRow = {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: string | number;
  document_type: string | null;
  created_at: string | Date;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getMobileUser(request);
  if (!user) return jsonError("Nicht angemeldet.", 401);

  const { id: caseId } = await params;
  if (!UUID_PATTERN.test(caseId)) return jsonError("Ungültige Fallakte.", 400);

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_DOCUMENT_SIZE + 1024 * 1024) {
    return jsonError("Die Datei ist größer als 15 MB.", 413);
  }

  const ownerResult = await query<{ id: string }>(
    "SELECT id FROM cases WHERE id = $1 AND user_id = $2 LIMIT 1",
    [caseId, user.id]
  );
  if (!ownerResult.rows[0]) return jsonError("Fallakte nicht gefunden.", 404);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Die Datei konnte nicht gelesen werden.", 400);
  }

  const fileValue = formData.get("document");
  const requestedType = String(formData.get("documentType") ?? "other") as DocumentTypeValue;

  if (!(fileValue instanceof File) || fileValue.size === 0) {
    return jsonError("Bitte wähle eine Datei aus.", 400);
  }
  if (fileValue.size > MAX_DOCUMENT_SIZE) {
    return jsonError("Die Datei ist größer als 15 MB.", 413);
  }
  if (!ALLOWED_DOCUMENT_TYPES.has(requestedType)) {
    return jsonError("Die gewählte Dokumentart ist ungültig.", 400);
  }

  const bytes = new Uint8Array(await fileValue.arrayBuffer());
  const detected = detectAllowedFile(bytes, fileValue.type || "application/octet-stream");
  if (!detected) {
    return jsonError("Erlaubt sind PDF, JPEG, PNG, WebP, HEIC und HEIF.", 415);
  }

  const originalName = fileValue.name.trim().slice(0, 255) || `dokument.${detected.extension}`;
  const storageKey = path.posix.join(caseId, `${randomUUID()}.${detected.extension}`);
  const absolutePath = resolveStoragePath(storageKey);
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  await fs.mkdir(getUploadDirectory(), { recursive: true });
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, bytes, { flag: "wx" });

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");

    const documentResult = await client.query<DocumentRow>(
      `INSERT INTO case_documents (
         case_id, original_name, storage_key, mime_type, size_bytes, sha256, document_type
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, original_name, mime_type, size_bytes, document_type, created_at`,
      [caseId, originalName, storageKey, detected.mime, bytes.byteLength, sha256, requestedType]
    );

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'document_uploaded', 'Dokument hinzugefügt', $2, NOW())`,
      [caseId, originalName]
    );
    await client.query("UPDATE cases SET updated_at = NOW() WHERE id = $1", [caseId]);
    await client.query("COMMIT");

    const document = documentResult.rows[0];
    return NextResponse.json(
      {
        document: {
          id: document.id,
          originalName: document.original_name,
          mimeType: document.mime_type,
          sizeBytes: Number(document.size_bytes),
          documentType: document.document_type,
          createdAt: new Date(document.created_at).toISOString()
        }
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    await fs.unlink(absolutePath).catch(() => undefined);
    console.error("Mobile document upload failed", error);
    return jsonError("Das Dokument konnte gerade nicht gespeichert werden.", 500);
  } finally {
    client.release();
  }
}
