import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBillingAccount, stripeRequest } from "@/lib/billing";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const billing = await getBillingAccount(user.id);
  if (!billing.stripeCustomerId) {
    const url = publicUrl("/preise");
    url.searchParams.set("error", "Für dieses Konto ist noch kein Stripe-Kundenkonto hinterlegt.");
    return NextResponse.redirect(url, 303);
  }

  try {
    const body = new URLSearchParams();
    body.set("customer", billing.stripeCustomerId);
    body.set("return_url", publicUrl("/preise").toString());

    const response = await stripeRequest("billing_portal/sessions", body);
    const data = await response.json() as { url?: string; error?: { message?: string } };

    if (!response.ok || !data.url) {
      console.error("Stripe portal creation failed", data);
      throw new Error("PORTAL_FAILED");
    }

    return NextResponse.redirect(data.url, 303);
  } catch (error) {
    console.error("Stripe billing portal failed", error);
    const url = publicUrl("/preise");
    url.searchParams.set("error", "Das Abrechnungsportal konnte gerade nicht geöffnet werden.");
    return NextResponse.redirect(url, 303);
  }
}
