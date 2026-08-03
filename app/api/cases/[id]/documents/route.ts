import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, query } from "@/lib/db";
import {
  MAX_DOCUMENT_SIZE,
  detectAllowedFile,
  documentTypes,
  getUploadDirectory,
  resolveStoragePath,
  type DocumentTypeValue
} from "@/lib/documents";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_DOCUMENT_TYPES = new Set<DocumentTypeValue>(documentTypes.map((item) => item.value));

type RouteContext = {
  params: Promise<{ id: string }>;
};

function redirectToCase(caseId: string, error?: string) {
  const url = publicUrl(`/faelle/${caseId}`);
  if (error) {
    url.searchParams.set("error", error);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id: caseId } = await params;
  if (!UUID_PATTERN.test(caseId)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_DOCUMENT_SIZE + 1024 * 1024) {
    return redirectToCase(caseId, "Die Datei ist größer als 15 MB.");
  }

  const ownerResult = await query<{ id: string }>(
    "SELECT id FROM cases WHERE id = $1 AND user_id = $2 LIMIT 1",
    [caseId, user.id]
  );

  if (!ownerResult.rows[0]) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const formData = await request.formData();
  const fileValue = formData.get("document");
  const requestedType = String(formData.get("documentType") ?? "other") as DocumentTypeValue;

  if (!(fileValue instanceof File) || fileValue.size === 0) {
    return redirectToCase(caseId, "Bitte wähle eine Datei aus.");
  }

  if (fileValue.size > MAX_DOCUMENT_SIZE) {
    return redirectToCase(caseId, "Die Datei ist größer als 15 MB.");
  }

  if (!ALLOWED_DOCUMENT_TYPES.has(requestedType)) {
    return redirectToCase(caseId, "Die gewählte Dokumentart ist ungültig.");
  }

  const bytes = new Uint8Array(await fileValue.arrayBuffer());
  const detected = detectAllowedFile(bytes, fileValue.type || "application/octet-stream");

  if (!detected) {
    return redirectToCase(caseId, "Erlaubt sind PDF, JPEG, PNG, WebP, HEIC und HEIF.");
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

    await client.query(
      `INSERT INTO case_documents (
         case_id, original_name, storage_key, mime_type, size_bytes, sha256, document_type
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [caseId, originalName, storageKey, detected.mime, bytes.byteLength, sha256, requestedType]
    );

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'document_uploaded', 'Dokument hinzugefügt', $2, NOW())`,
      [caseId, originalName]
    );

    await client.query("UPDATE cases SET updated_at = NOW() WHERE id = $1", [caseId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    await fs.unlink(absolutePath).catch(() => undefined);
    console.error("Document upload failed", error);
    return redirectToCase(caseId, "Das Dokument konnte gerade nicht gespeichert werden.");
  } finally {
    client.release();
  }

  return redirectToCase(caseId);
}
