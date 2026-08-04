import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";
import { escalationStages } from "@/lib/workflow";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const stageValues = escalationStages.map((item) => item.value) as [string, ...string[]];
const schema = z.object({
  stage: z.enum(stageValues),
  note: z.string().trim().max(3000).optional()
});

function redirect(caseId: string, key: "notice" | "error", message: string) {
  const url = publicUrl(`/faelle/${caseId}/steuerung`);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, 303);
}

function taskForStage(stage: string) {
  switch (stage) {
    case "reminder": return { title: "Erneute Aufforderung versenden", days: 1, priority: "high" };
    case "final_deadline": return { title: "Letzte Frist schriftlich versenden", days: 1, priority: "urgent" };
    case "payment_provider": return { title: "Zahlungsanbieter oder Bank kontaktieren", days: 3, priority: "high" };
    case "mediation": return { title: "Passende Schlichtungsstelle prüfen", days: 7, priority: "normal" };
    case "consumer_center": return { title: "Beratung bei einer Verbraucherzentrale prüfen", days: 7, priority: "normal" };
    default: return null;
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return NextResponse.redirect(publicUrl("/dashboard"), 303);

  const formData = await request.formData();
  const parsed = schema.safeParse({
    stage: formData.get("stage"),
    note: String(formData.get("note") ?? "").trim() || undefined
  });
  if (!parsed.success) return redirect(id, "error", "Bitte wähle eine gültige Eskalationsstufe.");

  const stage = escalationStages.find((item) => item.value === parsed.data.stage)!;
  const client = await getDb().connect();

  try {
    await client.query("BEGIN");
    const owner = await client.query<{ id: string }>(
      `SELECT id FROM cases WHERE id = $1 AND user_id = $2 LIMIT 1 FOR UPDATE`,
      [id, user.id]
    );
    if (!owner.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    await client.query(
      `INSERT INTO case_escalations (case_id, stage, note) VALUES ($1, $2, $3)`,
      [id, parsed.data.stage, parsed.data.note ?? null]
    );

    const task = taskForStage(parsed.data.stage);
    if (task) {
      await client.query(
        `INSERT INTO case_tasks (case_id, title, description, priority, source, due_at)
         VALUES ($1, $2, $3, $4, 'assistant', NOW() + make_interval(days => $5::int))`,
        [id, task.title, stage.description, task.priority, task.days]
      );
    }

    if (parsed.data.stage === "final_deadline") {
      await client.query(
        `INSERT INTO case_deadlines (case_id, title, due_at)
         SELECT $1, 'Letzte Frist', ((CURRENT_DATE + 7)::date + time '23:59:59') AT TIME ZONE 'Europe/Berlin'
         WHERE NOT EXISTS (
           SELECT 1 FROM case_deadlines WHERE case_id = $1 AND completed_at IS NULL
         )`,
        [id]
      );
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'escalation_stage', $2, $3, NOW())`,
      [id, `Eskalationsstufe: ${stage.label}`, parsed.data.note ?? stage.description]
    );

    await client.query(
      `UPDATE cases
       SET status = $3, updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, user.id, parsed.data.stage === "closed" ? "closed" : "escalation"]
    );
    await client.query("COMMIT");
    return redirect(id, "notice", parsed.data.stage === "closed" ? "Fall wurde abgeschlossen." : `${stage.label} wurde dokumentiert und als Aufgabe vorbereitet.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Escalation creation failed", error);
    return redirect(id, "error", "Die Eskalationsstufe konnte gerade nicht gespeichert werden.");
  } finally {
    client.release();
  }
}
