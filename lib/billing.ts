import crypto from "node:crypto";
import { query } from "@/lib/db";

export type PlanCode = "free" | "pro";

export type BillingAccount = {
  planCode: PlanCode;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_PRO_MONTHLY
  );
}

export function getStripeMode() {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (key.startsWith("sk_test_")) return "test" as const;
  if (key.startsWith("sk_live_")) return "live" as const;
  return "unknown" as const;
}

export function getProPriceLabel() {
  return process.env.REKLAIO_PRO_PRICE_LABEL?.trim() || "Preis wird in Stripe angezeigt";
}

export function getProBillingIntervalLabel() {
  return process.env.REKLAIO_PRO_INTERVAL_LABEL?.trim() || "monatlich, automatisch verlängernd";
}

export async function getBillingAccount(userId: string): Promise<BillingAccount> {
  const result = await query<{
    plan_code: PlanCode;
    subscription_status: string | null;
    subscription_current_period_end: string | Date | null;
    subscription_cancel_at_period_end: boolean;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  }>(
    `SELECT plan_code, subscription_status, subscription_current_period_end,
            subscription_cancel_at_period_end, stripe_customer_id,
            stripe_subscription_id
     FROM app_users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  const row = result.rows[0];
  return {
    planCode: row?.plan_code === "pro" ? "pro" : "free",
    subscriptionStatus: row?.subscription_status ?? null,
    currentPeriodEnd: row?.subscription_current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(row?.subscription_cancel_at_period_end),
    stripeCustomerId: row?.stripe_customer_id ?? null,
    stripeSubscriptionId: row?.stripe_subscription_id ?? null
  };
}

export async function hasProAccess(userId: string) {
  const billing = await getBillingAccount(userId);
  return billing.planCode === "pro";
}

export function hasManagedSubscription(billing: BillingAccount) {
  return Boolean(
    billing.stripeSubscriptionId &&
    ["active", "trialing", "past_due", "unpaid", "paused", "incomplete"].includes(billing.subscriptionStatus ?? "")
  );
}

function stripeHeaders() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_NOT_CONFIGURED");
  return { Authorization: `Bearer ${secret}` };
}

export function stripeRequest(path: string, body: URLSearchParams) {
  return fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      ...stripeHeaders(),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });
}

export function stripeGet(path: string) {
  return fetch(`https://api.stripe.com/v1/${path}`, {
    method: "GET",
    headers: stripeHeaders(),
    cache: "no-store"
  });
}

export async function getStripeDiagnostics() {
  const configured = isStripeConfigured();
  const mode = getStripeMode();
  const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY?.trim() || "";

  if (!configured) {
    return {
      configured: false,
      mode,
      priceId,
      apiReachable: false,
      priceActive: false,
      recurring: false,
      currency: null as string | null,
      unitAmount: null as number | null,
      interval: null as string | null,
      error: "Stripe-Variablen sind nicht vollständig gesetzt."
    };
  }

  try {
    const response = await stripeGet(`prices/${encodeURIComponent(priceId)}?expand[]=product`);
    const data = await response.json() as {
      active?: boolean;
      currency?: string;
      unit_amount?: number | null;
      recurring?: { interval?: string } | null;
      livemode?: boolean;
      error?: { message?: string };
    };

    if (!response.ok) {
      return {
        configured: true,
        mode,
        priceId,
        apiReachable: true,
        priceActive: false,
        recurring: false,
        currency: null,
        unitAmount: null,
        interval: null,
        error: data.error?.message || "Stripe-Preis konnte nicht geprüft werden."
      };
    }

    const modeMatches = mode === "unknown"
      ? false
      : (mode === "live") === Boolean(data.livemode);

    return {
      configured: true,
      mode,
      priceId,
      apiReachable: true,
      priceActive: Boolean(data.active),
      recurring: Boolean(data.recurring?.interval),
      currency: data.currency ?? null,
      unitAmount: data.unit_amount ?? null,
      interval: data.recurring?.interval ?? null,
      error: modeMatches ? null : "Stripe-Schlüssel und Preis gehören nicht zum gleichen Test-/Live-Modus."
    };
  } catch (error) {
    return {
      configured: true,
      mode,
      priceId,
      apiReachable: false,
      priceActive: false,
      recurring: false,
      currency: null,
      unitAmount: null,
      interval: null,
      error: error instanceof Error ? error.message : "Stripe ist nicht erreichbar."
    };
  }
}

export function verifyStripeWebhookSignature(payload: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestampPart || signatures.length === 0) return false;

  const timestamp = Number(timestampPart.slice(2));
  if (!Number.isFinite(timestamp)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  return signatures.some((signature) => {
    if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  });
}

export function stripeStatusHasAccess(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}
