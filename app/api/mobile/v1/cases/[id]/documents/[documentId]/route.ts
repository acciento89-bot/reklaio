import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getDb, query } from "@/lib/db";
import { resolveStoragePath, safeDownloadName } from "@/lib/documents";
import { getMobileUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string; documentId: string }>;
};

type StoredDocument = {
  original_name: string;
  storage_key: string;
  mime_type: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: Request, { params }: RouteContext) {
  const user = await getMobileUser(request);
  if (!user) return new Response("Nicht angemeldet", { status: 401 });

  const { id: caseId, documentId } = await params;
  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(documentId)) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  const result = await query<StoredDocument>(
    `SELECT d.original_name, d.storage_key, d.mime_type
     FROM case_documents d
     JOIN cases c ON c.id = d.case_id
     WHERE d.id = $1
       AND d.case_id = $2
       AND c.user_id = $3
     LIMIT 1`,
    [documentId, caseId, user.id]
  );

  const document = result.rows[0];
  if (!document) return new Response("Nicht gefunden", { status: 404 });

  try {
    const file = await fs.readFile(resolveStoragePath(document.storage_key));
    const safeName = safeDownloadName(document.original_name);
    const asciiName = safeName
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/[\\/]/g, "_") || "dokument";
    const encodedName = encodeURIComponent(safeName);

    return new Response(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": document.mime_type,
        "Content-Length": String(file.byteLength),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Mobile document download failed", error);
    return new Response("Datei nicht verfügbar", { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await getMobileUser(request);
  if (!user) return jsonError("Nicht angemeldet.", 401);

  const { id: caseId, documentId } = await params;
  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(documentId)) {
    return jsonError("Dokument nicht gefunden.", 404);
  }

  const client = await getDb().connect();
  let document: StoredDocument | undefined;

  try {
    await client.query("BEGIN");
    const result = await client.query<StoredDocument>(
      `SELECT d.original_name, d.storage_key, d.mime_type
       FROM case_documents d
       JOIN cases c ON c.id = d.case_id
       WHERE d.id = $1
         AND d.case_id = $2
         AND c.user_id = $3
       FOR UPDATE`,
      [documentId, caseId, user.id]
    );

    document = result.rows[0];
    if (!document) {
      await client.query("ROLLBACK");
      return jsonError("Dokument nicht gefunden.", 404);
    }

    await client.query("DELETE FROM case_documents WHERE id = $1", [documentId]);
    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'document_deleted', 'Dokument gelöscht', $2, NOW())`,
      [caseId, document.original_name]
    );
    await client.query("UPDATE cases SET updated_at = NOW() WHERE id = $1", [caseId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Mobile document deletion failed", error);
    return jsonError("Das Dokument konnte gerade nicht gelöscht werden.", 500);
  } finally {
    client.release();
  }

  if (document) {
    await fs.unlink(resolveStoragePath(document.storage_key)).catch((error) => {
      console.error("Stored mobile document file could not be removed", error);
    });
  }

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
