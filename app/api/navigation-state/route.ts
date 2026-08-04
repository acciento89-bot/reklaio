import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBillingAccount } from "@/lib/billing";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, {
      status: 401,
      headers: { "Cache-Control": "private, no-store" }
    });
  }

  const [onboardingResult, billing] = await Promise.all([
    query<{ onboarding_completed_at: string | null }>(
      `SELECT onboarding_completed_at FROM app_users WHERE id = $1 LIMIT 1`,
      [user.id]
    ),
    getBillingAccount(user.id)
  ]);

  return NextResponse.json({
    authenticated: true,
    onboardingOpen: !onboardingResult.rows[0]?.onboarding_completed_at,
    planCode: billing.planCode
  }, {
    headers: { "Cache-Control": "private, no-store" }
  });
}
