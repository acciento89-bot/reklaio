import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, query } from "@/lib/db";
import { syncRevenueCatCustomer } from "@/lib/revenuecat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RevenueCatWebhook = {
  api_version?: string;
  event?: {
    id?: string;
    type?: string;
    app_user_id?: string;
    original_app_user_id?: string;
    aliases?: string[];
    transferred_to?: string[];
    product_id?: string;
    store?: string;
    environment?: string;
  };
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function candidateUserIds(event: NonNullable<RevenueCatWebhook["event"]>) {
  return Array.from(new Set([
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases ?? []),
    ...(event.transferred_to ?? [])
  ].filter((value): value is string => Boolean(value && UUID_PATTERN.test(value)))));
}

export async function POST(request: Request) {
  const expectedAuthorization = process.env.REVENUECAT_WEBHOOK_AUTH?.trim();
  if (!expectedAuthorization) {
    return new NextResponse("RevenueCat webhook is not configured", { status: 503 });
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (!safeEqual(authorization, expectedAuthorization)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rawBody = await request.text();
  let payload: RevenueCatWebhook;
  try {
    payload = JSON.parse(rawBody) as RevenueCatWebhook;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const event = payload.event;
  if (!event?.id || !event.type) {
    return new NextResponse("Invalid event", { status: 400 });
  }

  const eventId = `revenuecat:${event.id}`;
  const ids = candidateUserIds(event);
  const userResult = ids.length
    ? await query<{ id: string }>(
        "SELECT id FROM app_users WHERE id = ANY($1::uuid[]) ORDER BY array_position($1::uuid[],id) LIMIT 1",
        [ids]
      )
    : { rows: [] as Array<{ id: string }> };
  const userId = userResult.rows[0]?.id ?? null;

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const duplicate = await client.query(
      "SELECT 1 FROM billing_webhook_events WHERE event_id=$1 LIMIT 1",
      [eventId]
    );
    if (duplicate.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ received: true, duplicate: true });
    }

    let syncResult: unknown = null;
    if (userId) {
      syncResult = await syncRevenueCatCustomer(client, userId, event.id);
    }

    await client.query(
      `INSERT INTO billing_webhook_events(event_id,event_type,status,payload_summary)
       VALUES($1,$2,$3,$4::jsonb)`,
      [
        eventId,
        `revenuecat.${event.type}`,
        userId ? "processed" : "ignored",
        JSON.stringify({
          userId,
          appUserId: event.app_user_id ?? null,
          productId: event.product_id ?? null,
          store: event.store ?? null,
          environment: event.environment ?? null,
          syncResult
        })
      ]
    );

    await client.query("COMMIT");
    return NextResponse.json({ received: true, userMatched: Boolean(userId) });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("RevenueCat webhook processing failed", error);
    await query(
      `INSERT INTO billing_webhook_events(event_id,event_type,status,error_message,payload_summary)
       VALUES($1,$2,'failed',$3,$4::jsonb)
       ON CONFLICT(event_id)
       DO UPDATE SET status='failed',error_message=EXCLUDED.error_message`,
      [
        eventId,
        `revenuecat.${event.type}`,
        error instanceof Error ? error.message.slice(0, 1000) : "Unknown error",
        JSON.stringify({ appUserId: event.app_user_id ?? null })
      ]
    ).catch(() => undefined);
    return new NextResponse("Webhook processing failed", { status: 500 });
  } finally {
    client.release();
  }
}
