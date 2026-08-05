import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await query("SELECT 1");
    const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.access(uploadDir);
    return NextResponse.json(
      { status: "ok", service: "reklaio", version: "0.2.0" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      { status: "degraded", service: "reklaio" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
