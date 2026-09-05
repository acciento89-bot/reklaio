import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getCaseTypeBySlug } from "@/lib/case-types";
import { parseAmountCents } from "@/lib/cases";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const caseSchema = z.object({
  type: z.string().trim(),
  title: z.string().trim().min(3).max(140),
  companyName: z.string().trim().max(160).optional().default(""),
  orderReference: z.string().trim().max(120).optional().default(""),
  amount: z.string().trim().max(32).optional().default(""),
  incidentDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional().default(""),
  summary: z.string().trim().max(5000).optional().default("")
});

function errorRedirect(message: string, selectedType = "", locale: "de" | "en" = "de") {
  const url = publicUrl(locale === "en" ? "/en/neuer-fall" : "/neuer-fall");
  url.searchParams.set("error", message);
  if (selectedType) {
    url.searchParams.set("typ", selectedType);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const formData = await request.formData();
  const locale = formData.get("locale") === "en" ? "en" : "de";
  const parsed = caseSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    companyName: formData.get("companyName"),
    orderReference: formData.get("orderReference"),
    amount: formData.get("amount"),
    incidentDate: formData.get("incidentDate"),
    summary: formData.get("summary")
  });

  if (!parsed.success) {
    return errorRedirect(locale === "en" ? "Please check the highlighted details." : "Bitte prüfe die markierten Angaben.", String(formData.get("type") ?? ""), locale);
  }

  const caseType = getCaseTypeBySlug(parsed.data.type);
  if (!caseType) {
    return errorRedirect(locale === "en" ? "Please select a valid case type." : "Bitte wähle eine gültige Fallart.", "", locale);
  }

  let amountCents: number | null;
  try {
    amountCents = parseAmountCents(parsed.data.amount);
  } catch {
    return errorRedirect(locale === "en" ? "The amount is invalid. Example: 129.90" : "Der Betrag ist ungültig. Beispiel: 129,90", caseType.slug, locale);
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{ id: string }>(
      `INSERT INTO cases (
         user_id, type, status, title, company_name, order_reference,
         amount_cents, currency, incident_date, summary
       )
       VALUES ($1, $2, 'collecting_evidence', $3, NULLIF($4, ''), NULLIF($5, ''), $6, 'EUR', NULLIF($7, '')::date, NULLIF($8, ''))
       RETURNING id`,
      [
        user.id,
        caseType.dbValue,
        parsed.data.title,
        parsed.data.companyName,
        parsed.data.orderReference,
        amountCents,
        parsed.data.incidentDate,
        parsed.data.summary
      ]
    );

    const caseId = result.rows[0].id;

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'case_created', $2, $3, NOW())`,
      [caseId, locale === "en" ? "Case created" : "Fall angelegt", locale === "en" ? "The case was created in Reklaio." : "Der Fall wurde in Reklaio erstellt."]
    );

    await client.query("COMMIT");
    return NextResponse.redirect(publicUrl(locale === "en" ? `/en/faelle/${caseId}` : `/faelle/${caseId}`), 303);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Case creation failed", error);
    return errorRedirect(locale === "en" ? "The case could not be saved right now." : "Der Fall konnte gerade nicht gespeichert werden.", caseType.slug, locale);
  } finally {
    client.release();
  }
}
