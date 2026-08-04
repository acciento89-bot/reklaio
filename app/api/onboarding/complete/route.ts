import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const formData = await request.formData();
  const mode = formData.get("mode") === "dismiss" ? "dismiss" : "complete";

  if (mode === "dismiss") {
    await query(
      `UPDATE app_users
       SET onboarding_dismissed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );
  } else {
    await query(
      `UPDATE app_users
       SET onboarding_completed_at = NOW(), onboarding_dismissed_at = NULL, updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );
  }

  const url = publicUrl("/dashboard");
  url.searchParams.set("notice", mode === "dismiss" ? "Die Einführung kann jederzeit über Hilfe erneut geöffnet werden." : "Einführung abgeschlossen.");
  return NextResponse.redirect(url, 303);
}
