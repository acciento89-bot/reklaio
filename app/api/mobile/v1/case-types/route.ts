import { NextResponse } from "next/server";
import { caseTypes } from "@/lib/case-types";
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
    {
      caseTypes: caseTypes.map((item) => ({
        slug: item.slug,
        value: item.dbValue,
        title: item.title,
        description: item.description,
        icon: item.icon,
        checklistTitle: item.checklistTitle,
        checklist: [...item.checklist]
      }))
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
