import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getCaseTypeByValue } from "@/lib/case-types";
import { parseAmountCents } from "@/lib/cases";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateSchema = z.object({
  type: z.string().trim(),
  title: z.string().trim().min(3).max(140),
  companyName: z.string().trim().max(160).optional().default(""),
  orderReference: z.string().trim().max(120).optional().default(""),
  amount: z.string().trim().max(32).optional().default(""),
  incidentDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional().default(""),
  summary: z.string().trim().max(5000).optional().default("")
});

function errorRedirect(caseId: string, message: string) {
  const url = publicUrl(`/faelle/${caseId}/bearbeiten`);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  const formData = await request.formData();
  const parsed = updateSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    companyName: formData.get("companyName"),
    orderReference: formData.get("orderReference"),
    amount: formData.get("amount"),
    incidentDate: formData.get("incidentDate"),
    summary: formData.get("summary")
  });

  if (!parsed.success) {
    return errorRedirect(id, "Bitte prüfe die eingegebenen Falldaten.");
  }

  const caseType = getCaseTypeByValue(parsed.data.type);
  if (!caseType) {
    return errorRedirect(id, "Bitte wähle eine gültige Fallart.");
  }

  let amountCents: number | null;
  try {
    amountCents = parseAmountCents(parsed.data.amount);
  } catch {
    return errorRedirect(id, "Der Betrag ist ungültig. Beispiel: 129,90");
  }

  try {
    const result = await query<{ id: string }>(
      `UPDATE cases
       SET type = $1,
           title = $2,
           company_name = NULLIF($3, ''),
           order_reference = NULLIF($4, ''),
           amount_cents = $5,
           incident_date = NULLIF($6, '')::date,
           summary = NULLIF($7, ''),
           updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING id`,
      [
        caseType.dbValue,
        parsed.data.title,
        parsed.data.companyName,
        parsed.data.orderReference,
        amountCents,
        parsed.data.incidentDate,
        parsed.data.summary,
        id,
        user.id
      ]
    );

    if (!result.rows[0]) {
      return new Response("Nicht gefunden", { status: 404 });
    }

    await query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'case_updated', 'Falldaten aktualisiert', 'Die Stammdaten des Falls wurden bearbeitet.', NOW())`,
      [id]
    );

    return NextResponse.redirect(publicUrl(`/faelle/${id}`), 303);
  } catch (error) {
    console.error("Case update failed", error);
    return errorRedirect(id, "Die Änderungen konnten gerade nicht gespeichert werden.");
  }
}
