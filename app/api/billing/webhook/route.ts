import { NextResponse } from "next/server";
import { getDb, query } from "@/lib/db";
import { paidContractConfirmationText } from "@/lib/legal-documents";
import { isMailConfigured, sendMail, textToHtml } from "@/lib/mail";
import { stripeStatusHasAccess, verifyStripeWebhookSignature } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StripeEvent = { id: string; type: string; data: { object: Record<string, unknown> } };
type Confirmation = { email: string; reference: string; startedAt: string } | null;

function stringValue(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function unixDate(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? new Date(value * 1000) : null;
}

function objectValue(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function subscriptionPeriodEnd(object: Record<string, unknown>) {
  const legacyPeriodEnd = unixDate(object.current_period_end);
  if (legacyPeriodEnd) return legacyPeriodEnd;

  const items = objectValue(object.items);
  const data = Array.isArray(items.data) ? items.data : [];
  const periodEnds = data
    .map((item) => unixDate(objectValue(item).current_period_end))
    .filter((value): value is Date => Boolean(value));

  if (periodEnds.length === 0) return null;
  return new Date(Math.max(...periodEnds.map((value) => value.getTime())));
}

function invoiceSubscriptionId(object: Record<string, unknown>) {
  const legacySubscription = stringValue(object.subscription);
  if (legacySubscription) return legacySubscription;

  const parent = objectValue(object.parent);
  const subscriptionDetails = objectValue(parent.subscription_details);
  return stringValue(subscriptionDetails.subscription);
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
  let confirmation: Confirmation = null;

  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT 1 FROM billing_webhook_events WHERE event_id=$1 LIMIT 1",
      [event.id]
    );

    if (existing.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ received: true, duplicate: true });
    }

    const object = event.data.object;
    const metadata = objectValue(object.metadata);
    const summary: Record<string, unknown> = {
      objectId: stringValue(object.id),
      customer: stringValue(object.customer),
      subscription: stringValue(object.subscription) || invoiceSubscriptionId(object)
    };

    if (event.type === "checkout.session.completed") {
      const userId = stringValue(metadata.user_id) || stringValue(object.client_reference_id);
      const intentId = stringValue(metadata.checkout_intent_id);
      const customerId = stringValue(object.customer);
      const subscriptionId = stringValue(object.subscription);
      const paymentStatus = stringValue(object.payment_status);
      const grantAccess = Boolean(
        subscriptionId && ["paid", "no_payment_required"].includes(paymentStatus ?? "")
      );

      if (userId) {
        const userResult = await client.query<{ email: string }>(
          `UPDATE app_users
           SET stripe_customer_id=COALESCE($2,stripe_customer_id),
               stripe_subscription_id=COALESCE($3,stripe_subscription_id),
               plan_code=CASE WHEN $4 THEN 'pro' ELSE plan_code END,
               subscription_status=CASE WHEN $4 THEN 'active' ELSE subscription_status END,
               updated_at=NOW()
           WHERE id=$1
           RETURNING email`,
          [userId, customerId, subscriptionId, grantAccess]
        );

        if (grantAccess && userResult.rows[0]) {
          confirmation = {
            email: userResult.rows[0].email,
            reference: intentId || stringValue(object.id) || event.id,
            startedAt: new Date().toISOString()
          };
        }
      }

      if (intentId) {
        await client.query(
          "UPDATE billing_checkout_intents SET status=$2,completed_at=CASE WHEN $2='completed' THEN NOW() ELSE completed_at END WHERE id=$1",
          [intentId, grantAccess ? "completed" : "failed"]
        );
      }
    }

    if (event.type === "checkout.session.expired") {
      const intentId = stringValue(metadata.checkout_intent_id);
      if (intentId) {
        await client.query(
          "UPDATE billing_checkout_intents SET status='cancelled' WHERE id=$1",
          [intentId]
        );
      }
    }

    if ([
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted"
    ].includes(event.type)) {
      const subscriptionId = stringValue(object.id);
      const customerId = stringValue(object.customer);
      const status = event.type === "customer.subscription.deleted"
        ? "canceled"
        : stringValue(object.status);
      const currentPeriodEnd = subscriptionPeriodEnd(object);
      const cancelAtPeriodEnd = object.cancel_at_period_end === true;
      const metadataUserId = stringValue(metadata.user_id);
      const hasAccess = event.type !== "customer.subscription.deleted" && stripeStatusHasAccess(status);

      await client.query(
        `UPDATE app_users
         SET stripe_customer_id=COALESCE($1,stripe_customer_id),
             stripe_subscription_id=COALESCE($2,stripe_subscription_id),
             subscription_status=$3,
             subscription_current_period_end=$4,
             subscription_cancel_at_period_end=$5,
             plan_code=CASE WHEN $6 THEN 'pro' ELSE 'free' END,
             updated_at=NOW()
         WHERE ($1 IS NOT NULL AND stripe_customer_id=$1)
            OR ($2 IS NOT NULL AND stripe_subscription_id=$2)
            OR ($7 IS NOT NULL AND id=$7)`,
        [customerId, subscriptionId, status, currentPeriodEnd, cancelAtPeriodEnd, hasAccess, metadataUserId]
      );
    }

    if (["invoice.payment_failed", "invoice.paid"].includes(event.type)) {
      const customerId = stringValue(object.customer);
      const subscriptionId = invoiceSubscriptionId(object);
      const paid = event.type === "invoice.paid";

      await client.query(
        `UPDATE app_users
         SET subscription_status=$3,
             plan_code=CASE WHEN $4 THEN 'pro' ELSE 'free' END,
             updated_at=NOW()
         WHERE ($1 IS NOT NULL AND stripe_customer_id=$1)
            OR ($2 IS NOT NULL AND stripe_subscription_id=$2)`,
        [customerId, subscriptionId, paid ? "active" : "past_due", paid]
      );

      if (!paid) {
        await client.query(
          `INSERT INTO system_incidents(source,severity,title,details)
           VALUES('stripe','warning','Stripe-Zahlung fehlgeschlagen',$1)`,
          [`Kunde ${customerId ?? "unbekannt"}, Abonnement ${subscriptionId ?? "unbekannt"}`]
        );
      }
    }

    await client.query(
      `INSERT INTO billing_webhook_events(event_id,event_type,status,payload_summary)
       VALUES($1,$2,'processed',$3::jsonb)`,
      [event.id, event.type, JSON.stringify(summary)]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Stripe webhook processing failed", error);
    await query(
      `INSERT INTO billing_webhook_events(event_id,event_type,status,error_message,payload_summary)
       VALUES($1,$2,'failed',$3,$4::jsonb)
       ON CONFLICT(event_id)
       DO UPDATE SET status='failed',error_message=EXCLUDED.error_message`,
      [
        event.id,
        event.type,
        error instanceof Error ? error.message.slice(0, 1000) : "Unknown error",
        JSON.stringify({})
      ]
    ).catch(() => undefined);
    return new NextResponse("Webhook processing failed", { status: 500 });
  } finally {
    client.release();
  }

  if (confirmation && isMailConfigured()) {
    const text = paidContractConfirmationText({
      customerEmail: confirmation.email,
      checkoutReference: confirmation.reference,
      startedAt: confirmation.startedAt
    });

    try {
      await sendMail({
        to: confirmation.email,
        subject: "Vertragsbestätigung Reklaio Pro",
        text,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.55;white-space:pre-wrap">${textToHtml(text)}</div>`
      });
    } catch (error) {
      console.error("Subscription confirmation email failed", error);
      await query(
        `INSERT INTO system_incidents(source,severity,title,details)
         VALUES('mail','warning','Vertragsbestätigung konnte nicht versendet werden',$1)`,
        [confirmation.email]
      ).catch(() => undefined);
    }
  }

  return NextResponse.json({ received: true });
}
