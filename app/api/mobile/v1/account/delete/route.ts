import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { resolveStoragePath } from "@/lib/documents";
import { getMobileUser } from "@/lib/mobile-auth";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

const deleteSchema = z.object({
  password: z.string().min(10).max(128),
  confirmation: z.string().trim().min(1).max(32)
});

const activeSubscriptionStates = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "incomplete"
];

export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bitte gib dein aktuelles Passwort und das Wort LÖSCHEN ein." },
      { status: 400 }
    );
  }

  if (parsed.data.confirmation.toLocaleUpperCase("de-DE") !== "LÖSCHEN") {
    return NextResponse.json(
      { error: "Zur Bestätigung muss exakt das Wort LÖSCHEN eingegeben werden." },
      { status: 400 }
    );
  }

  const client = await getDb().connect();
  let storageKeys: string[] = [];

  try {
    await client.query("BEGIN");

    const accountResult = await client.query<{
      password_hash: string | null;
      stripe_subscription_id: string | null;
      subscription_status: string | null;
    }>(
      `SELECT password_hash, stripe_subscription_id, subscription_status
       FROM app_users
       WHERE id = $1
       FOR UPDATE`,
      [user.id]
    );

    const account = accountResult.rows[0];
    if (!account?.password_hash || !(await verifyPassword(parsed.data.password, account.password_hash))) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Das aktuelle Passwort ist nicht korrekt." }, { status: 403 });
    }

    if (
      account.stripe_subscription_id &&
      activeSubscriptionStates.includes(account.subscription_status ?? "")
    ) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error:
            "Bitte kündige dein aktives Pro-Abonnement zuerst über die Kontoverwaltung. Nach dem Ende des Abonnements kann das Konto gelöscht werden."
        },
        { status: 409 }
      );
    }

    const documentResult = await client.query<{ storage_key: string }>(
      `SELECT d.storage_key
       FROM case_documents d
       JOIN cases c ON c.id = d.case_id
       WHERE c.user_id = $1`,
      [user.id]
    );
    storageKeys = documentResult.rows.map((item) => item.storage_key);

    await client.query("DELETE FROM app_users WHERE id = $1", [user.id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Mobile account deletion failed", error);
    return NextResponse.json(
      { error: "Das Konto konnte gerade nicht gelöscht werden." },
      { status: 500 }
    );
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
          console.error("Deleted mobile account file could not be removed", storageKey, error);
        }
      }
    })
  );

  return new NextResponse(null, { status: 204 });
}
