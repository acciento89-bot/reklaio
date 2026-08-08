import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { createMobileSession } from "@/lib/mobile-auth";
import { verifyPassword } from "@/lib/password";
import { consumeRateLimit, requestFingerprint } from "@/lib/rate-limit";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128)
});

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return jsonError("Ungültige Anfrage.", 400);
  }

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return jsonError("E-Mail-Adresse oder Passwort ist nicht korrekt.", 401);

  const emailHash = crypto.createHash("sha256").update(parsed.data.email).digest("hex").slice(0, 24);
  const rate = await consumeRateLimit({
    key: `mobile-login:${requestFingerprint(request, "mobile-login")}:${emailHash}`,
    limit: 10,
    windowSeconds: 900
  });

  if (!rate.allowed) {
    return jsonError("Zu viele Anmeldeversuche. Bitte warte einige Minuten.", 429);
  }

  const result = await query<{
    id: string;
    email: string;
    display_name: string | null;
    role: "user" | "admin";
    plan_code: "free" | "pro";
    password_hash: string | null;
    suspended_at: string | null;
  }>(
    `SELECT id, email, display_name, role, plan_code, password_hash, suspended_at
     FROM app_users
     WHERE LOWER(email) = $1
     LIMIT 1`,
    [parsed.data.email]
  );

  const user = result.rows[0];
  if (!user?.password_hash) return jsonError("E-Mail-Adresse oder Passwort ist nicht korrekt.", 401);
  if (user.suspended_at) return jsonError("Dieses Konto ist derzeit gesperrt.", 403);

  const valid = await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid) return jsonError("E-Mail-Adresse oder Passwort ist nicht korrekt.", 401);

  const session = await createMobileSession(user.id);

  return NextResponse.json(
    {
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role === "admin" ? "admin" : "user",
        planCode: user.plan_code === "pro" ? "pro" : "free"
      }
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
