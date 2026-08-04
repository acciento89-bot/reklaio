import crypto from "node:crypto";
import { query } from "@/lib/db";

export type PlanCode = "free" | "pro";

export type BillingAccount = {
  planCode: PlanCode;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
};

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_PRO_MONTHLY
  );
}

export function getProPriceLabel() {
  return process.env.REKLAIO_PRO_PRICE_LABEL?.trim() || "Preis wird in Stripe angezeigt";
}

export async function getBillingAccount(userId: string): Promise<BillingAccount> {
  const result = await query<{
    plan_code: PlanCode;
    subscription_status: string | null;
    subscription_current_period_end: string | Date | null;
    subscription_cancel_at_period_end: boolean;
    stripe_customer_id: string | null;
  }>(
    `SELECT plan_code, subscription_status, subscription_current_period_end,
            subscription_cancel_at_period_end, stripe_customer_id
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
    stripeCustomerId: row?.stripe_customer_id ?? null
  };
}

export async function hasProAccess(userId: string) {
  const billing = await getBillingAccount(userId);
  return billing.planCode === "pro";
}

export function stripeRequest(path: string, body: URLSearchParams) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_NOT_CONFIGURED");

  return fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });
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
    if (signature.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  });
}

export function stripeStatusHasAccess(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}
