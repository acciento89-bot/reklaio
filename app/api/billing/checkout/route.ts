import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBillingAccount, isStripeConfigured, stripeRequest } from "@/lib/billing";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

function pricingError(message: string) {
  const url = publicUrl("/preise");
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);
  if (!isStripeConfigured()) return pricingError("Der Stripe-Checkout ist noch nicht vollständig eingerichtet.");

  const billing = await getBillingAccount(user.id);
  if (billing.planCode === "pro") {
    return NextResponse.redirect(publicUrl("/preise"), 303);
  }

  const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY!;
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("client_reference_id", user.id);
  body.set("success_url", `${publicUrl("/preise").toString()}?checkout=success`);
  body.set("cancel_url", `${publicUrl("/preise").toString()}?checkout=cancelled`);
  body.set("allow_promotion_codes", "true");
  body.set("billing_address_collection", "auto");
  body.set("metadata[user_id]", user.id);
  body.set("subscription_data[metadata][user_id]", user.id);

  if (billing.stripeCustomerId) {
    body.set("customer", billing.stripeCustomerId);
  } else {
    body.set("customer_email", user.email);
  }

  try {
    const response = await stripeRequest("checkout/sessions", body);
    const data = await response.json() as { url?: string; error?: { message?: string } };

    if (!response.ok || !data.url) {
      console.error("Stripe checkout creation failed", data);
      return pricingError("Der Checkout konnte gerade nicht gestartet werden.");
    }

    return NextResponse.redirect(data.url, 303);
  } catch (error) {
    console.error("Stripe checkout request failed", error);
    return pricingError("Der Checkout konnte gerade nicht gestartet werden.");
  }
}
