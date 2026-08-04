import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const profileSchema = z.object({
  displayName: z.string().trim().max(80)
});

function settingsRedirect(type: "notice" | "error", message: string) {
  const url = publicUrl("/einstellungen");
  url.searchParams.set(type, message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const formData = await request.formData();
  const parsed = profileSchema.safeParse({ displayName: formData.get("displayName") });

  if (!parsed.success) {
    return settingsRedirect("error", "Der Anzeigename darf höchstens 80 Zeichen lang sein.");
  }

  try {
    await query(
      `UPDATE app_users
       SET display_name = NULLIF($1, ''), updated_at = NOW()
       WHERE id = $2`,
      [parsed.data.displayName, user.id]
    );

    return settingsRedirect("notice", "Profil gespeichert.");
  } catch (error) {
    console.error("Profile update failed", error);
    return settingsRedirect("error", "Das Profil konnte gerade nicht gespeichert werden.");
  }
}
