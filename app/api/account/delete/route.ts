import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { resolveStoragePath } from "@/lib/documents";
import { verifyPassword } from "@/lib/password";
import { publicUrl } from "@/lib/public-url";
import { deleteCurrentSession } from "@/lib/session";

export const runtime = "nodejs";

const deleteSchema = z.object({
  password: z.string().min(10).max(128),
  confirmation: z.string().trim().min(1).max(32)
});

function settingsError(message: string) {
  const url = publicUrl("/einstellungen");
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const formData = await request.formData();
  const parsed = deleteSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation")
  });

  if (!parsed.success) {
    return settingsError("Bitte gib dein aktuelles Passwort und das Wort LÖSCHEN ein.");
  }

  if (parsed.data.confirmation.toLocaleUpperCase("de-DE") !== "LÖSCHEN") {
    return settingsError("Zur Bestätigung muss exakt das Wort LÖSCHEN eingegeben werden.");
  }

  const client = await getDb().connect();
  let storageKeys: string[] = [];

  try {
    await client.query("BEGIN");

    const accountResult = await client.query<{ password_hash: string | null }>(
      `SELECT password_hash
       FROM app_users
       WHERE id = $1
       FOR UPDATE`,
      [user.id]
    );

    const passwordHash = accountResult.rows[0]?.password_hash;
    if (!passwordHash || !(await verifyPassword(parsed.data.password, passwordHash))) {
      await client.query("ROLLBACK");
      return settingsError("Das aktuelle Passwort ist nicht korrekt.");
    }

    const documentResult = await client.query<{ storage_key: string }>(
      `SELECT d.storage_key
       FROM case_documents d
       JOIN cases c ON c.id = d.case_id
       WHERE c.user_id = $1`,
      [user.id]
    );
    storageKeys = documentResult.rows.map((item) => item.storage_key);

    await client.query(`DELETE FROM app_users WHERE id = $1`, [user.id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Account deletion failed", error);
    return settingsError("Das Konto konnte gerade nicht gelöscht werden.");
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
          console.error("Deleted account file could not be removed", storageKey, error);
        }
      }
    })
  );

  await deleteCurrentSession().catch((error) => {
    console.error("Deleted account session cookie cleanup failed", error);
  });

  const url = publicUrl("/anmelden");
  url.searchParams.set("deleted", "1");
  return NextResponse.redirect(url, 303);
}
