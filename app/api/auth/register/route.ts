import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

const registrationSchema = z.object({
  displayName: z.string().trim().max(80).optional().default(""),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10).max(128)
});

function redirectWithError(request: Request, message: string) {
  const url = new URL("/registrieren", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = registrationSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return redirectWithError(request, "Bitte prüfe deine Eingaben. Das Passwort muss mindestens 10 Zeichen haben.");
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    const result = await query<{ id: string }>(
      `INSERT INTO app_users (email, display_name, password_hash)
       VALUES ($1, NULLIF($2, ''), $3)
       RETURNING id`,
      [parsed.data.email, parsed.data.displayName, passwordHash]
    );

    await createSession(result.rows[0].id);
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return redirectWithError(request, "Für diese E-Mail-Adresse besteht bereits ein Konto.");
    }

    console.error("Registration failed", error);
    return redirectWithError(request, "Die Registrierung konnte gerade nicht abgeschlossen werden.");
  }
}
