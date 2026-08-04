import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getCaseTypeByValue } from "@/lib/case-types";
import { parseAmountCents } from "@/lib/cases";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function redirectToEditor(caseId: string, message: string) {
  const url = publicUrl(`/faelle/${caseId}/bearbeiten`);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

function readText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
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
  const type = readText(formData, "type");
  const title = readText(formData, "title");
  const companyName = readText(formData, "companyName");
  const orderReference = readText(formData, "orderReference");
  const amount = readText(formData, "amount");
  const incidentDate = readText(formData, "incidentDate");
  const summary = readText(formData, "summary");

  if (!getCaseTypeByValue(type)) {
    return redirectToEditor(id, "Bitte wähle eine gültige Fallart aus.");
  }

  if (title.length < 3 || title.length > 140) {
    return redirectToEditor(id, "Der Titel muss zwischen 3 und 140 Zeichen lang sein.");
  }

  if (companyName.length > 160 || orderReference.length > 120 || summary.length > 5000) {
    return redirectToEditor(id, "Mindestens eine Eingabe ist zu lang.");
  }

  if (incidentDate && !DATE_PATTERN.test(incidentDate)) {
    return redirectToEditor(id, "Das Vorfallsdatum ist ungültig.");
  }

  let amountCents: number | null;
  try {
    amountCents = parseAmountCents(amount);
  } catch {
    return redirectToEditor(id, "Der Betrag ist ungültig. Beispiel: 129,90");
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const updateResult = await client.query<{ id: string }>(
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
      [type, title, companyName, orderReference, amountCents, incidentDate, summary, id, user.id]
    );

    if (!updateResult.rows[0]) {
      await client.query("ROLLBACK");
      return new Response("Nicht gefunden", { status: 404 });
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'case_edited', 'Falldaten bearbeitet', 'Die Angaben des Falls wurden aktualisiert.', NOW())`,
      [id]
    );

    await client.query("COMMIT");
    return NextResponse.redirect(publicUrl(`/faelle/${id}`), 303);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Case edit failed", error);
    return redirectToEditor(id, "Die Änderungen konnten gerade nicht gespeichert werden.");
  } finally {
    client.release();
  }
}
