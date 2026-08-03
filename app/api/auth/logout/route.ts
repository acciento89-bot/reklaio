import { NextResponse } from "next/server";
import { publicUrl } from "@/lib/public-url";
import { deleteCurrentSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  await deleteCurrentSession();
  return NextResponse.redirect(publicUrl("/"), 303);
}
