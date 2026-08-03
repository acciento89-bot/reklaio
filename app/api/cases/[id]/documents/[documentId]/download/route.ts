import fs from "node:fs/promises";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { resolveStoragePath, safeDownloadName } from "@/lib/documents";

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

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Nicht angemeldet", { status: 401 });
  }

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
  if (!document) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  try {
    const file = await fs.readFile(resolveStoragePath(document.storage_key));
    const safeName = safeDownloadName(document.original_name);
    const encodedName = encodeURIComponent(safeName);

    return new Response(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": document.mime_type,
        "Content-Length": String(file.byteLength),
        "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Document download failed", error);
    return new Response("Datei nicht verfügbar", { status: 404 });
  }
}
