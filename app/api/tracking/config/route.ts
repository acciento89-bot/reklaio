import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function GET() {
  return NextResponse.json(
    {
      tagId: process.env.GOOGLE_TAG_ID?.trim() || "",
      signupConversion: process.env.GOOGLE_ADS_SIGNUP_CONVERSION?.trim() || "",
      proConversion: process.env.GOOGLE_ADS_PRO_CONVERSION?.trim() || "",
      proValue: positiveNumber(process.env.GOOGLE_ADS_PRO_VALUE, 9.99),
      currency: process.env.GOOGLE_ADS_CURRENCY?.trim().toUpperCase() || "EUR"
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
