import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { resolveStoragePath } from "@/lib/documents";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const deleteSchema = z.object({
  confirmation: z.string().trim().min(1).max(32)
});

function redirectToManagement(caseId: string, error: string) {
  const url = publicUrl(`/faelle/${caseId}/verwalten`);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const formData = await request.formData();
  const parsed = deleteSchema.safeParse({ confirmation: formData.get("confirmation") });

  if (!parsed.success || parsed.data.confirmation.toLocaleUpperCase("de-DE") !== "LÖSCHEN") {
    return redirectToManagement(id, "Zur Bestätigung muss exakt das Wort LÖSCHEN eingegeben werden.");
  }

  const client = await getDb().connect();
  let storageKeys: string[] = [];

  try {
    await client.query("BEGIN");

    const caseResult = await client.query<{ title: string }>(
      `SELECT title
       FROM cases
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [id, user.id]
    );

    if (caseResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    const documentResult = await client.query<{ storage_key: string }>(
      `SELECT storage_key
       FROM case_documents
       WHERE case_id = $1`,
      [id]
    );
    storageKeys = documentResult.rows.map((item) => item.storage_key);

    await client.query(
      `DELETE FROM cases
       WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Case deletion failed", error);
    return redirectToManagement(id, "Der Fall konnte gerade nicht gelöscht werden.");
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
          console.error("Deleted case file could not be removed", storageKey, error);
        }
      }
    })
  );

  const url = publicUrl("/dashboard");
  url.searchParams.set("notice", "Fall endgültig gelöscht.");
  return NextResponse.redirect(url, 303);
}
