import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Nicht angemeldet." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "no-store" } }
  );
}
