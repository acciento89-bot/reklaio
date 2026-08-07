import { NextResponse } from "next/server";
import { deleteMobileSession } from "@/lib/mobile-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await deleteMobileSession(request);
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" }
  });
}
