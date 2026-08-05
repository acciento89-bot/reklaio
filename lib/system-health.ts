import fs from "node:fs/promises";
import path from "node:path";
import { getAiModel, isAiConfigured } from "@/lib/ai";
import { getStripeDiagnostics } from "@/lib/billing";
import { query } from "@/lib/db";
import { isMailConfigured } from "@/lib/mail";

export type HealthCheck = {
  key: string;
  label: string;
  status: "ok" | "warning" | "critical";
  detail: string;
};

type BackupHealthRow = {
  status: string;
  completed_at: string;
  database_bytes: string | null;
  uploads_bytes: string | null;
  error_message: string | null;
};

export async function getSystemHealthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];

  try {
    await query("SELECT 1");
    checks.push({ key: "database", label: "PostgreSQL", status: "ok", detail: "Datenbankverbindung erfolgreich." });
  } catch (error) {
    checks.push({ key: "database", label: "PostgreSQL", status: "critical", detail: error instanceof Error ? error.message : "Datenbank nicht erreichbar." });
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.access(uploadDir);
    const stats = await fs.statfs(uploadDir);
    const freeBytes = Number(stats.bavail) * Number(stats.bsize);
    const freeGb = freeBytes / 1024 / 1024 / 1024;
    checks.push({
      key: "uploads",
      label: "Dokumentspeicher",
      status: freeGb < 2 ? "warning" : "ok",
      detail: `${freeGb.toFixed(1)} GB frei in ${uploadDir}.`
    });
  } catch (error) {
    checks.push({ key: "uploads", label: "Dokumentspeicher", status: "critical", detail: error instanceof Error ? error.message : "Upload-Verzeichnis nicht erreichbar." });
  }

  checks.push({
    key: "mail",
    label: "E-Mail",
    status: isMailConfigured() ? "ok" : "critical",
    detail: isMailConfigured() ? "SMTP-Konfiguration vollständig." : "SMTP-Konfiguration unvollständig."
  });

  checks.push({
    key: "openai",
    label: "OpenAI",
    status: isAiConfigured() ? "ok" : "warning",
    detail: isAiConfigured() ? `API-Schlüssel vorhanden · Modell ${getAiModel()}.` : "KI-Funktionen sind deaktiviert."
  });

  const stripe = await getStripeDiagnostics();
  checks.push({
    key: "stripe",
    label: "Stripe",
    status: stripe.configured && stripe.apiReachable && stripe.priceActive && stripe.recurring && !stripe.error ? "ok" : stripe.configured ? "warning" : "critical",
    detail: stripe.error || `${stripe.mode.toUpperCase()} · ${stripe.currency?.toUpperCase() ?? "–"} · ${stripe.interval ?? "kein Intervall"}.`
  });

  let backup: BackupHealthRow | null = null;
  try {
    const backupResult = await query<BackupHealthRow>(
      `SELECT status, completed_at, database_bytes, uploads_bytes, error_message
       FROM backup_runs
       ORDER BY completed_at DESC
       LIMIT 1`
    );
    backup = backupResult.rows[0] ?? null;
  } catch (error) {
    checks.push({
      key: "backup-table",
      label: "Backup-Protokoll",
      status: "critical",
      detail: error instanceof Error ? error.message : "Backup-Protokoll nicht erreichbar."
    });
  }

  if (!backup) {
    checks.push({ key: "backup", label: "Backup", status: "warning", detail: "Noch kein erfolgreich protokolliertes Backup vorhanden." });
  } else {
    const ageHours = (Date.now() - new Date(backup.completed_at).getTime()) / 3_600_000;
    checks.push({
      key: "backup",
      label: "Backup",
      status: backup.status === "completed" && ageHours <= 30 ? "ok" : ageHours <= 72 ? "warning" : "critical",
      detail: backup.status === "completed"
        ? `Letzter Lauf vor ${ageHours.toFixed(1)} Stunden.`
        : backup.error_message || "Letzter Backup-Lauf fehlgeschlagen."
    });
  }

  for (const [name, minimum] of [["SESSION_SECRET", 32], ["CRON_SECRET", 24]] as const) {
    const value = process.env[name] ?? "";
    checks.push({
      key: name.toLowerCase(),
      label: name,
      status: value.length >= minimum ? "ok" : "critical",
      detail: value.length >= minimum ? "Ausreichende Länge." : `Mindestens ${minimum} Zeichen erforderlich.`
    });
  }

  checks.push({
    key: "admin",
    label: "Admin-Zugang",
    status: (process.env.ADMIN_EMAILS ?? "").trim() ? "ok" : "critical",
    detail: (process.env.ADMIN_EMAILS ?? "").trim() ? "ADMIN_EMAILS ist gesetzt." : "ADMIN_EMAILS fehlt; kein sicherer Bootstrap-Admin."
  });

  return checks;
}
