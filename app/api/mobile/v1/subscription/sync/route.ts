import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getMobileUser } from "@/lib/mobile-auth";
import { syncRevenueCatCustomer } from "@/lib/revenuecat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const result = await syncRevenueCatCustomer(client, user.id);
    await client.query("COMMIT");
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Mobile RevenueCat synchronization failed", error);
    return NextResponse.json(
      { error: "Der Abonnementstatus konnte gerade nicht aktualisiert werden." },
      { status: 502 }
    );
  } finally {
    client.release();
  }
}
