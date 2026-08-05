import { isAdminUser } from "@/lib/admin";
import type { AuthUser } from "@/lib/auth";
import { getDb, query } from "@/lib/db";

export type AiOperation = "document_analysis" | "letter_draft";

type UserQuotaRow = {
  plan_code: "free" | "pro";
  ai_document_limit_override: number | null;
  ai_letter_limit_override: number | null;
};

export type AiQuotaItem = {
  operation: AiOperation;
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
};

export type AiQuotaSummary = {
  periodStart: string;
  periodEnd: string;
  documentAnalysis: AiQuotaItem;
  letterDraft: AiQuotaItem;
};

function parseLimit(value: string | undefined, fallback: number) {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= -1 ? parsed : fallback;
}

export function defaultAiLimit(operation: AiOperation) {
  return operation === "document_analysis"
    ? parseLimit(process.env.PRO_AI_DOCUMENTS_MONTHLY, 20)
    : parseLimit(process.env.PRO_AI_LETTERS_MONTHLY, 40);
}

function effectiveLimit(row: UserQuotaRow, operation: AiOperation, admin: boolean) {
  if (admin) return -1;
  const override = operation === "document_analysis"
    ? row.ai_document_limit_override
    : row.ai_letter_limit_override;
  return override ?? defaultAiLimit(operation);
}

function item(operation: AiOperation, used: number, limit: number): AiQuotaItem {
  const unlimited = limit === -1;
  return {
    operation,
    used,
    limit,
    unlimited,
    remaining: unlimited ? -1 : Math.max(0, limit - used)
  };
}

export async function getAiQuotaSummary(user: AuthUser): Promise<AiQuotaSummary> {
  const [accountResult, usageResult] = await Promise.all([
    query<UserQuotaRow>(
      `SELECT plan_code, ai_document_limit_override, ai_letter_limit_override
       FROM app_users WHERE id = $1 LIMIT 1`,
      [user.id]
    ),
    query<{ operation: AiOperation; used: number }>(
      `SELECT operation, COUNT(*)::int AS used
       FROM ai_usage_events
       WHERE user_id = $1
         AND status IN ('reserved', 'completed')
         AND created_at >= date_trunc('month', NOW())
         AND created_at < date_trunc('month', NOW()) + INTERVAL '1 month'
       GROUP BY operation`,
      [user.id]
    )
  ]);

  const account = accountResult.rows[0] ?? {
    plan_code: "free" as const,
    ai_document_limit_override: null,
    ai_letter_limit_override: null
  };
  const usage = new Map(usageResult.rows.map((row) => [row.operation, row.used]));
  const admin = isAdminUser(user);
  const periodStart = new Date();
  periodStart.setUTCDate(1);
  periodStart.setUTCHours(0, 0, 0, 0);
  const periodEnd = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1));

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    documentAnalysis: item(
      "document_analysis",
      usage.get("document_analysis") ?? 0,
      effectiveLimit(account, "document_analysis", admin)
    ),
    letterDraft: item(
      "letter_draft",
      usage.get("letter_draft") ?? 0,
      effectiveLimit(account, "letter_draft", admin)
    )
  };
}

export class AiQuotaError extends Error {
  code: "PRO_REQUIRED" | "QUOTA_EXHAUSTED";
  limit?: number;

  constructor(code: "PRO_REQUIRED" | "QUOTA_EXHAUSTED", message: string, limit?: number) {
    super(message);
    this.code = code;
    this.limit = limit;
  }
}

export async function reserveAiUsage(input: {
  user: AuthUser;
  operation: AiOperation;
  caseId?: string | null;
  documentId?: string | null;
  modelName: string;
  consentAt: Date;
  inputBytes?: number | null;
  metadata?: Record<string, unknown>;
}) {
  const client = await getDb().connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`reklaio-ai:${input.user.id}:${input.operation}:${new Date().toISOString().slice(0, 7)}`]
    );

    const accountResult = await client.query<UserQuotaRow & { role: "user" | "admin"; email: string }>(
      `SELECT plan_code, ai_document_limit_override, ai_letter_limit_override, role, email
       FROM app_users
       WHERE id = $1
       LIMIT 1
       FOR UPDATE`,
      [input.user.id]
    );
    const account = accountResult.rows[0];
    if (!account || (account.plan_code !== "pro" && !isAdminUser(input.user))) {
      throw new AiQuotaError("PRO_REQUIRED", "Diese KI-Funktion gehört zu Reklaio Pro.");
    }

    const limit = effectiveLimit(account, input.operation, isAdminUser(input.user));
    const countResult = await client.query<{ used: number }>(
      `SELECT COUNT(*)::int AS used
       FROM ai_usage_events
       WHERE user_id = $1
         AND operation = $2
         AND status IN ('reserved', 'completed')
         AND created_at >= date_trunc('month', NOW())
         AND created_at < date_trunc('month', NOW()) + INTERVAL '1 month'`,
      [input.user.id, input.operation]
    );
    const used = countResult.rows[0]?.used ?? 0;

    if (limit !== -1 && used >= limit) {
      throw new AiQuotaError(
        "QUOTA_EXHAUSTED",
        `Das monatliche KI-Kontingent von ${limit} Vorgängen ist verbraucht.`,
        limit
      );
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO ai_usage_events (
         user_id, case_id, document_id, operation, provider, model_name,
         consent_at, metadata_json, status, input_bytes
       ) VALUES ($1, $2, $3, $4, 'openai', $5, $6, $7::jsonb, 'reserved', $8)
       RETURNING id`,
      [
        input.user.id,
        input.caseId ?? null,
        input.documentId ?? null,
        input.operation,
        input.modelName,
        input.consentAt,
        JSON.stringify(input.metadata ?? {}),
        input.inputBytes ?? null
      ]
    );

    await client.query("COMMIT");
    return inserted.rows[0]!.id;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function completeAiUsage(input: {
  reservationId: string;
  responseId?: string | null;
  metadata?: Record<string, unknown>;
  estimatedCostMicros?: number | null;
}) {
  await query(
    `UPDATE ai_usage_events
     SET status = 'completed',
         response_id = $2,
         metadata_json = metadata_json || $3::jsonb,
         estimated_cost_micros = $4,
         completed_at = NOW()
     WHERE id = $1`,
    [
      input.reservationId,
      input.responseId ?? null,
      JSON.stringify(input.metadata ?? {}),
      input.estimatedCostMicros ?? null
    ]
  );
}

export async function failAiUsage(reservationId: string, errorCode: string) {
  await query(
    `UPDATE ai_usage_events
     SET status = 'failed', error_code = $2, completed_at = NOW()
     WHERE id = $1`,
    [reservationId, errorCode.slice(0, 120)]
  );
}
