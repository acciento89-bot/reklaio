import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { publicUrl } from "@/lib/public-url";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128)
});

function invalidLogin() {
  const url = publicUrl("/anmelden");
  url.searchParams.set("error", "E-Mail-Adresse oder Passwort ist nicht korrekt.");
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return invalidLogin();
  }

  const result = await query<{
    id: string;
    password_hash: string | null;
  }>(
    `SELECT id, password_hash
     FROM app_users
     WHERE LOWER(email) = $1
     LIMIT 1`,
    [parsed.data.email]
  );

  const user = result.rows[0];
  if (!user?.password_hash) {
    return invalidLogin();
  }

  const valid = await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid) {
    return invalidLogin();
  }

  await createSession(user.id);
  return NextResponse.redirect(publicUrl("/dashboard"), 303);
}
