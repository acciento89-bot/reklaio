import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";
import { resolveStoragePath } from "@/lib/documents";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function caseErrorRedirect(caseId: string, message: string) {
  const url = publicUrl(`/faelle/${caseId}`);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  const formData = await request.formData();
  const confirmation = String(formData.get("confirmation") ?? "").trim().toLocaleUpperCase("de-DE");

  if (confirmation !== "LÖSCHEN") {
    return caseErrorRedirect(id, "Bitte gib zum endgültigen Löschen das Wort LÖSCHEN ein.");
  }

  const client = await getDb().connect();
  let storageKeys: string[] = [];

  try {
    await client.query("BEGIN");

    const ownerResult = await client.query<{ id: string }>(
      `SELECT id FROM cases WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [id, user.id]
    );

    if (!ownerResult.rows[0]) {
      await client.query("ROLLBACK");
      return new Response("Nicht gefunden", { status: 404 });
    }

    const documentResult = await client.query<{ storage_key: string }>(
      `SELECT storage_key FROM case_documents WHERE case_id = $1`,
      [id]
    );
    storageKeys = documentResult.rows.map((item) => item.storage_key);

    await client.query("DELETE FROM cases WHERE id = $1 AND user_id = $2", [id, user.id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Case deletion failed", error);
    return caseErrorRedirect(id, "Der Fall konnte gerade nicht gelöscht werden.");
  } finally {
    client.release();
  }

  await Promise.all(
    storageKeys.map(async (storageKey) => {
      try {
        await fs.unlink(resolveStoragePath(storageKey));
      } catch (error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code !== "ENOENT") {
          console.error("Orphaned case document could not be deleted", storageKey, error);
        }
      }
    })
  );

  return NextResponse.redirect(publicUrl("/dashboard"), 303);
}
