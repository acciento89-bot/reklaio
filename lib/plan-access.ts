import type { PoolClient } from "pg";
import { stripeStatusHasAccess } from "@/lib/billing";

export type PlanSource =
  | "beta"
  | "stripe"
  | "app_store"
  | "google_play"
  | "manual"
  | "admin"
  | null;

export type PlanAccess = {
  planCode: "free" | "pro";
  planSource: PlanSource;
};

export async function recomputePlanAccess(
  client: PoolClient,
  userId: string
): Promise<PlanAccess | null> {
  const accountResult = await client.query<{
    plan_code: "free" | "pro";
    plan_source: PlanSource;
    subscription_status: string | null;
    stripe_subscription_id: string | null;
  }>(
    `SELECT plan_code, plan_source, subscription_status, stripe_subscription_id
     FROM app_users
     WHERE id = $1
     FOR UPDATE`,
    [userId]
  );

  const account = accountResult.rows[0];
  if (!account) return null;

  const storeResult = await client.query<{
    provider: "app_store" | "google_play";
  }>(
    `SELECT provider
     FROM store_entitlements
     WHERE user_id = $1
       AND entitlement_id = 'pro'
       AND status IN ('active', 'canceled', 'billing_issue')
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY expires_at DESC NULLS FIRST
     LIMIT 1`,
    [userId]
  );

  const stripeActive = Boolean(
    account.stripe_subscription_id && stripeStatusHasAccess(account.subscription_status)
  );
  const betaActive = account.subscription_status === "beta";
  const storeSource = storeResult.rows[0]?.provider ?? null;
  const protectedManualAccess =
    account.plan_code === "pro" &&
    ["manual", "admin"].includes(account.plan_source ?? "");

  let next: PlanAccess;
  if (stripeActive) {
    next = { planCode: "pro", planSource: "stripe" };
  } else if (storeSource) {
    next = { planCode: "pro", planSource: storeSource };
  } else if (betaActive) {
    next = { planCode: "pro", planSource: "beta" };
  } else if (protectedManualAccess) {
    next = { planCode: "pro", planSource: account.plan_source };
  } else {
    next = { planCode: "free", planSource: null };
  }

  await client.query(
    `UPDATE app_users
     SET plan_code = $2,
         plan_source = $3,
         updated_at = NOW()
     WHERE id = $1`,
    [userId, next.planCode, next.planSource]
  );

  return next;
}
