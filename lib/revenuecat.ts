import type { PoolClient } from "pg";
import { recomputePlanAccess, type PlanAccess } from "@/lib/plan-access";

const REVENUECAT_API_URL = "https://api.revenuecat.com/v1";
const PRO_ENTITLEMENT_ID = "pro";

type RevenueCatEntitlement = {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  product_identifier?: string | null;
  purchase_date?: string | null;
};

type RevenueCatSubscription = {
  auto_resume_date?: string | null;
  billing_issues_detected_at?: string | null;
  expires_date?: string | null;
  is_sandbox?: boolean;
  original_purchase_date?: string | null;
  period_type?: string | null;
  purchase_date?: string | null;
  store?: string | null;
  unsubscribe_detected_at?: string | null;
};

type RevenueCatCustomer = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
    management_url?: string | null;
    subscriptions?: Record<string, RevenueCatSubscription>;
  };
};

export type RevenueCatSyncResult = PlanAccess & {
  provider: "app_store" | "google_play" | null;
  productId: string | null;
  status: string | null;
  expiresAt: string | null;
  managementUrl: string | null;
};

function secretKey() {
  const key = process.env.REVENUECAT_SECRET_API_KEY?.trim();
  if (!key) throw new Error("REVENUECAT_SECRET_API_KEY is not configured");
  return key;
}

function providerFromStore(store: string | null | undefined) {
  if (store === "app_store" || store === "mac_app_store") return "app_store" as const;
  if (store === "play_store") return "google_play" as const;
  return null;
}

function validDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function laterDate(first: Date | null, second: Date | null) {
  if (!first) return second;
  if (!second) return first;
  return first.getTime() >= second.getTime() ? first : second;
}

async function revenueCatRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${REVENUECAT_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${secretKey()}`,
      ...init.headers
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`RevenueCat request failed (${response.status}): ${body.slice(0, 500)}`);
  }

  return response;
}

export async function fetchRevenueCatCustomer(userId: string) {
  const response = await revenueCatRequest(`/subscribers/${encodeURIComponent(userId)}`);
  return response.json() as Promise<RevenueCatCustomer>;
}

export async function deleteRevenueCatCustomer(userId: string) {
  if (!process.env.REVENUECAT_SECRET_API_KEY?.trim()) return;
  await revenueCatRequest(`/subscribers/${encodeURIComponent(userId)}`, { method: "DELETE" });
}

export async function syncRevenueCatCustomer(
  client: PoolClient,
  userId: string,
  eventId: string | null = null
): Promise<RevenueCatSyncResult> {
  const customer = await fetchRevenueCatCustomer(userId);
  const subscriber = customer.subscriber ?? {};
  const entitlement = subscriber.entitlements?.[PRO_ENTITLEMENT_ID] ?? null;
  const productId = entitlement?.product_identifier ?? null;
  const subscription = productId ? subscriber.subscriptions?.[productId] ?? null : null;
  const provider = providerFromStore(subscription?.store);
  const expiresAt = laterDate(
    validDate(entitlement?.expires_date ?? subscription?.expires_date),
    validDate(entitlement?.grace_period_expires_date)
  );
  const active = Boolean(entitlement) && (!expiresAt || expiresAt.getTime() > Date.now());

  let status: "active" | "canceled" | "billing_issue" | "expired" | "unknown" = "unknown";
  if (!active) status = "expired";
  else if (subscription?.billing_issues_detected_at) status = "billing_issue";
  else if (subscription?.unsubscribe_detected_at) status = "canceled";
  else status = "active";

  if (provider && entitlement) {
    await client.query(
      `INSERT INTO store_entitlements(
         user_id, provider, entitlement_id, product_id, status, expires_at,
         management_url, environment, last_event_id, last_synced_at, updated_at
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
       ON CONFLICT(user_id,provider,entitlement_id)
       DO UPDATE SET
         product_id=EXCLUDED.product_id,
         status=EXCLUDED.status,
         expires_at=EXCLUDED.expires_at,
         management_url=EXCLUDED.management_url,
         environment=EXCLUDED.environment,
         last_event_id=EXCLUDED.last_event_id,
         last_synced_at=NOW(),
         updated_at=NOW()`,
      [
        userId,
        provider,
        PRO_ENTITLEMENT_ID,
        productId,
        status,
        expiresAt,
        subscriber.management_url ?? null,
        subscription?.is_sandbox ? "SANDBOX" : "PRODUCTION",
        eventId
      ]
    );
  } else {
    await client.query(
      `UPDATE store_entitlements
       SET status='expired', expires_at=COALESCE(expires_at,NOW()),
           last_event_id=$2, last_synced_at=NOW(), updated_at=NOW()
       WHERE user_id=$1 AND entitlement_id='pro'`,
      [userId, eventId]
    );
  }

  const plan = await recomputePlanAccess(client, userId);
  if (!plan) throw new Error("RevenueCat user no longer exists");

  return {
    ...plan,
    provider,
    productId,
    status: entitlement ? status : null,
    expiresAt: expiresAt?.toISOString() ?? null,
    managementUrl: subscriber.management_url ?? null
  };
}
