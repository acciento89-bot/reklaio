import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { resolveStoragePath } from "@/lib/documents";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string; documentId: string }>;
};

type StoredDocument = {
  original_name: string;
  storage_key: string;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id: caseId, documentId } = await params;
  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(documentId)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const client = await getDb().connect();
  let document: StoredDocument | undefined;

  try {
    await client.query("BEGIN");

    const result = await client.query<StoredDocument>(
      `SELECT d.original_name, d.storage_key
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
      return NextResponse.redirect(publicUrl(`/faelle/${caseId}`), 303);
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
    console.error("Document deletion failed", error);
    const url = publicUrl(`/faelle/${caseId}`);
    url.searchParams.set("error", "Das Dokument konnte gerade nicht gelöscht werden.");
    return NextResponse.redirect(url, 303);
  } finally {
    client.release();
  }

  if (document) {
    await fs.unlink(resolveStoragePath(document.storage_key)).catch((error) => {
      console.error("Stored document file could not be removed", error);
    });
  }

  return NextResponse.redirect(publicUrl(`/faelle/${caseId}`), 303);
}
