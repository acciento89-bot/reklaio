import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  getBillingAccount,
  getProPriceLabel,
  hasManagedSubscription,
  isStripeConfigured,
  stripeRequest
} from "@/lib/billing";
import { query } from "@/lib/db";
import { AGB_VERSION, PRIVACY_VERSION, WITHDRAWAL_VERSION } from "@/lib/legal-documents";
import { publicUrl } from "@/lib/public-url";
import { consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  acceptTerms: z.literal(true),
  acknowledgePrivacy: z.literal(true),
  acknowledgeWithdrawal: z.literal(true),
  immediateStart: z.literal(true),
  termsVersion: z.literal(AGB_VERSION),
  privacyVersion: z.literal(PRIVACY_VERSION),
  withdrawalVersion: z.literal(WITHDRAWAL_VERSION)
});

function checkoutError(message: string) {
  const url = publicUrl("/preise/checkout");
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);
  if (!isStripeConfigured()) return checkoutError("Der Stripe-Checkout ist noch nicht vollständig eingerichtet.");

  const rate = await consumeRateLimit({ key: `billing-checkout:${user.id}`, limit: 5, windowSeconds: 900 });
  if (!rate.allowed) return checkoutError("Zu viele Checkout-Versuche. Bitte warte einige Minuten.");

  const formData = await request.formData();
  const parsed = schema.safeParse({
    acceptTerms: formData.get("acceptTerms") === "on",
    acknowledgePrivacy: formData.get("acknowledgePrivacy") === "on",
    acknowledgeWithdrawal: formData.get("acknowledgeWithdrawal") === "on",
    immediateStart: formData.get("immediateStart") === "on",
    termsVersion: formData.get("termsVersion"),
    privacyVersion: formData.get("privacyVersion"),
    withdrawalVersion: formData.get("withdrawalVersion")
  });
  if (!parsed.success) return checkoutError("Bitte bestätige AGB, Datenschutz, Widerrufsbelehrung und den gewünschten sofortigen Leistungsbeginn.");

  const billing = await getBillingAccount(user.id);
  if (billing.planCode === "pro" || hasManagedSubscription(billing)) {
    const url = publicUrl("/preise");
    url.searchParams.set("error", "Für dieses Konto besteht bereits ein Pro-Zugang oder ein verwaltetes Abonnement.");
    return NextResponse.redirect(url, 303);
  }

  const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY!;
  const intentResult = await query<{ id: string }>(
    `INSERT INTO billing_checkout_intents (
       user_id, stripe_price_id, displayed_price,
       terms_version, privacy_version, withdrawal_version,
       terms_accepted_at, withdrawal_acknowledged_at,
       immediate_start_requested_at, status
     ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW(), 'created')
     RETURNING id`,
    [user.id, priceId, getProPriceLabel(), AGB_VERSION, PRIVACY_VERSION, WITHDRAWAL_VERSION]
  );
  const intentId = intentResult.rows[0]!.id;

  const successUrl = publicUrl("/preise");
  successUrl.searchParams.set("checkout", "success");
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  const cancelUrl = publicUrl("/preise/checkout");
  cancelUrl.searchParams.set("error", "Der Stripe-Checkout wurde abgebrochen. Es wurde kein Pro-Abonnement aktiviert.");

  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("submit_type", "subscribe");
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("client_reference_id", user.id);
  body.set("success_url", successUrl.toString());
  body.set("cancel_url", cancelUrl.toString());
  body.set("allow_promotion_codes", "true");
  body.set("billing_address_collection", "auto");
  body.set("consent_collection[terms_of_service]", "required");
  body.set("custom_text[submit][message]", "Mit dem Abschluss wird ein kostenpflichtiges, automatisch verlängerndes Reklaio-Pro-Abonnement bestellt.");
  body.set("metadata[user_id]", user.id);
  body.set("metadata[checkout_intent_id]", intentId);
  body.set("metadata[terms_version]", AGB_VERSION);
  body.set("metadata[withdrawal_version]", WITHDRAWAL_VERSION);
  body.set("subscription_data[metadata][user_id]", user.id);
  body.set("subscription_data[metadata][checkout_intent_id]", intentId);

  if (billing.stripeCustomerId) body.set("customer", billing.stripeCustomerId);
  else body.set("customer_email", user.email);

  try {
    const response = await stripeRequest("checkout/sessions", body);
    const data = await response.json() as { id?: string; url?: string; error?: { message?: string } };

    if (!response.ok || !data.url || !data.id) {
      await query("UPDATE billing_checkout_intents SET status='failed' WHERE id=$1", [intentId]);
      console.error("Stripe checkout creation failed", data);
      return checkoutError("Der Checkout konnte gerade nicht gestartet werden.");
    }

    await query(
      `UPDATE billing_checkout_intents
       SET stripe_session_id=$2, status='redirected'
       WHERE id=$1`,
      [intentId, data.id]
    );
    return NextResponse.redirect(data.url, 303);
  } catch (error) {
    await query("UPDATE billing_checkout_intents SET status='failed' WHERE id=$1", [intentId]).catch(() => undefined);
    console.error("Stripe checkout request failed", error);
    return checkoutError("Der Checkout konnte gerade nicht gestartet werden.");
  }
}
