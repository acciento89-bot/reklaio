import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { stripeStatusHasAccess, verifyStripeWebhookSignature } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

function stringValue(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function unixDate(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000)
    : null;
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeWebhookSignature(payload, signature)) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!event.id || !event.type || !event.data?.object) {
    return new NextResponse("Invalid event", { status: 400 });
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT 1 FROM billing_webhook_events WHERE event_id = $1 LIMIT 1",
      [event.id]
    );
    if (existing.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ received: true, duplicate: true });
    }

    const object = event.data.object;

    if (event.type === "checkout.session.completed") {
      const metadata = (object.metadata && typeof object.metadata === "object")
        ? object.metadata as Record<string, unknown>
        : {};
      const userId = stringValue(metadata.user_id) || stringValue(object.client_reference_id);
      const customerId = stringValue(object.customer);
      const subscriptionId = stringValue(object.subscription);
      const paymentStatus = stringValue(object.payment_status);
      const grantAccess = Boolean(subscriptionId && ["paid", "no_payment_required"].includes(paymentStatus ?? ""));

      if (userId) {
        await client.query(
          `UPDATE app_users
           SET stripe_customer_id = COALESCE($2, stripe_customer_id),
               stripe_subscription_id = COALESCE($3, stripe_subscription_id),
               plan_code = CASE WHEN $4 THEN 'pro' ELSE plan_code END,
               subscription_status = CASE WHEN $4 THEN 'active' ELSE subscription_status END,
               updated_at = NOW()
           WHERE id = $1`,
          [userId, customerId, subscriptionId, grantAccess]
        );
      }
    }

    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const subscriptionId = stringValue(object.id);
      const customerId = stringValue(object.customer);
      const status = event.type === "customer.subscription.deleted"
        ? "canceled"
        : stringValue(object.status);
      const currentPeriodEnd = unixDate(object.current_period_end);
      const cancelAtPeriodEnd = object.cancel_at_period_end === true;
      const metadata = (object.metadata && typeof object.metadata === "object")
        ? object.metadata as Record<string, unknown>
        : {};
      const metadataUserId = stringValue(metadata.user_id);
      const hasAccess = event.type !== "customer.subscription.deleted" && stripeStatusHasAccess(status);

      await client.query(
        `UPDATE app_users
         SET stripe_customer_id = COALESCE($1, stripe_customer_id),
             stripe_subscription_id = COALESCE($2, stripe_subscription_id),
             subscription_status = $3,
             subscription_current_period_end = $4,
             subscription_cancel_at_period_end = $5,
             plan_code = CASE WHEN $6 THEN 'pro' ELSE 'free' END,
             updated_at = NOW()
         WHERE ($1 IS NOT NULL AND stripe_customer_id = $1)
            OR ($2 IS NOT NULL AND stripe_subscription_id = $2)
            OR ($7 IS NOT NULL AND id = $7)`,
        [customerId, subscriptionId, status, currentPeriodEnd, cancelAtPeriodEnd, hasAccess, metadataUserId]
      );
    }

    await client.query(
      `INSERT INTO billing_webhook_events (event_id, event_type)
       VALUES ($1, $2)`,
      [event.id, event.type]
    );
    await client.query("COMMIT");

    return NextResponse.json({ received: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Stripe webhook processing failed", error);
    return new NextResponse("Webhook processing failed", { status: 500 });
  } finally {
    client.release();
  }
}
