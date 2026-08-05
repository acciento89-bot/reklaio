import OpenAI from "openai";
import { z } from "zod";

const evidenceSchema = z.object({
  field: z.string().min(1).max(80),
  value: z.string().min(1).max(500),
  sourceText: z.string().min(1).max(800),
  confidence: z.number().min(0).max(1)
});

export const documentAnalysisSchema = z.object({
  documentKind: z.string().min(1).max(120),
  summary: z.string().min(1).max(4000),
  companyName: z.string().max(240).nullable(),
  companyAddress: z.string().max(500).nullable(),
  orderReference: z.string().max(240).nullable(),
  invoiceNumber: z.string().max(240).nullable(),
  contractNumber: z.string().max(240).nullable(),
  amountCents: z.number().int().nonnegative().nullable(),
  currency: z.string().length(3).nullable(),
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  cancellationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  promisedRefundDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  deadlineDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  senderEmail: z.string().email().nullable(),
  emailSubject: z.string().max(300).nullable(),
  keyStatements: z.array(z.string().max(800)).max(12),
  warnings: z.array(z.string().max(800)).max(12),
  evidence: z.array(evidenceSchema).max(20),
  overallConfidence: z.number().min(0).max(1)
});

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

const letterDraftSchema = z.object({
  subject: z.string().min(3).max(240),
  body: z.string().min(50).max(20000),
  usedFacts: z.array(z.string().max(500)).max(20),
  missingInformation: z.array(z.string().max(500)).max(12)
});

export type AiLetterDraft = z.infer<typeof letterDraftSchema>;

type AiResult<T> = {
  data: T;
  model: string;
  responseId: string | null;
};

type DocumentInput = {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
};

type LetterInput = {
  kindLabel: string;
  caseTitle: string;
  caseType: string;
  companyName: string | null;
  orderReference: string | null;
  amount: string;
  incidentDate: string;
  summary: string | null;
  senderName: string;
  senderEmail: string;
  desiredOutcome: string;
  deadlineDate: string | null;
  confirmedDocumentFacts: string[];
  providerResponses: string[];
};

let client: OpenAI | null = null;

export function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getAiModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
}

function getClient() {
  if (!isAiConfigured()) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}

function parseJsonOutput<T>(raw: string, schema: z.ZodType<T>) {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  return schema.parse(JSON.parse(trimmed));
}

function documentJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "documentKind", "summary", "companyName", "companyAddress", "orderReference",
      "invoiceNumber", "contractNumber", "amountCents", "currency", "documentDate",
      "deliveryDate", "cancellationDate", "promisedRefundDate", "deadlineDate",
      "senderEmail", "emailSubject", "keyStatements", "warnings", "evidence",
      "overallConfidence"
    ],
    properties: {
      documentKind: { type: "string" },
      summary: { type: "string" },
      companyName: { type: ["string", "null"] },
      companyAddress: { type: ["string", "null"] },
      orderReference: { type: ["string", "null"] },
      invoiceNumber: { type: ["string", "null"] },
      contractNumber: { type: ["string", "null"] },
      amountCents: { type: ["integer", "null"], minimum: 0 },
      currency: { type: ["string", "null"] },
      documentDate: { type: ["string", "null"] },
      deliveryDate: { type: ["string", "null"] },
      cancellationDate: { type: ["string", "null"] },
      promisedRefundDate: { type: ["string", "null"] },
      deadlineDate: { type: ["string", "null"] },
      senderEmail: { type: ["string", "null"] },
      emailSubject: { type: ["string", "null"] },
      keyStatements: { type: "array", items: { type: "string" }, maxItems: 12 },
      warnings: { type: "array", items: { type: "string" }, maxItems: 12 },
      evidence: {
        type: "array",
        maxItems: 20,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "value", "sourceText", "confidence"],
          properties: {
            field: { type: "string" },
            value: { type: "string" },
            sourceText: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 }
          }
        }
      },
      overallConfidence: { type: "number", minimum: 0, maximum: 1 }
    }
  };
}

function letterJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["subject", "body", "usedFacts", "missingInformation"],
    properties: {
      subject: { type: "string" },
      body: { type: "string" },
      usedFacts: { type: "array", items: { type: "string" }, maxItems: 20 },
      missingInformation: { type: "array", items: { type: "string" }, maxItems: 12 }
    }
  };
}

export async function analyzeDocument(input: DocumentInput): Promise<AiResult<DocumentAnalysis>> {
  const model = getAiModel();
  const base64 = Buffer.from(input.bytes).toString("base64");
  const supportedImage = ["image/jpeg", "image/png", "image/webp"].includes(input.mimeType);
  const supportedPdf = input.mimeType === "application/pdf";

  if (!supportedImage && !supportedPdf) {
    throw new Error("AI_FILE_TYPE_UNSUPPORTED");
  }

  const fileContent = supportedImage
    ? { type: "input_image", image_url: `data:${input.mimeType};base64,${base64}`, detail: "high" }
    : {
        type: "input_file",
        filename: input.fileName,
        file_data: `data:${input.mimeType};base64,${base64}`
      };

  const prompt = [
    "Analysiere dieses Dokument für eine private Verbraucher-Fallakte in Deutschland.",
    "Extrahiere ausschließlich Angaben, die im Dokument tatsächlich erkennbar sind.",
    "Erfinde keine Daten. Nicht erkennbare Werte müssen null bleiben.",
    "Datumswerte müssen, wenn eindeutig, im Format YYYY-MM-DD ausgegeben werden.",
    "Beträge werden als ganze Centzahl ausgegeben.",
    "Gib zu wichtigen erkannten Feldern einen kurzen Originalausschnitt als sourceText und eine realistische Sicherheit zwischen 0 und 1 an.",
    "Nimm keine rechtliche Bewertung vor. Hinweise auf Widersprüche, fehlende Seiten oder schlechte Lesbarkeit gehören in warnings.",
    "Die Zusammenfassung soll neutral, knapp und auf Deutsch sein."
  ].join("\n");

  const response = await getClient().responses.create({
    model,
    store: false,
    input: [{
      role: "user",
      content: [
        { type: "input_text", text: prompt },
        fileContent
      ]
    }],
    text: {
      format: {
        type: "json_schema",
        name: "reklaio_document_analysis",
        strict: true,
        schema: documentJsonSchema()
      }
    }
  } as any);

  return {
    data: parseJsonOutput(response.output_text, documentAnalysisSchema),
    model,
    responseId: response.id ?? null
  };
}

export async function generateLetterDraft(input: LetterInput): Promise<AiResult<AiLetterDraft>> {
  const model = getAiModel();
  const prompt = `Erstelle einen sachlichen, höflichen deutschen Entwurf für ein Verbraucherschreiben.

Schreibenart: ${input.kindLabel}
Falltitel: ${input.caseTitle}
Fallart: ${input.caseType}
Anbieter: ${input.companyName ?? "nicht angegeben"}
Referenz: ${input.orderReference ?? "nicht angegeben"}
Betrag: ${input.amount}
Vorfallsdatum: ${input.incidentDate}
Zusammenfassung: ${input.summary ?? "nicht angegeben"}
Gewünschte Lösung: ${input.desiredOutcome}
Gewünschte Antwortfrist: ${input.deadlineDate ?? "keine konkrete Frist angegeben"}
Absender: ${input.senderName} <${input.senderEmail}>
Bestätigte Dokumentangaben: ${input.confirmedDocumentFacts.length ? input.confirmedDocumentFacts.join(" | ") : "keine"}
Erfasste Anbieterantworten: ${input.providerResponses.length ? input.providerResponses.join(" | ") : "keine"}

Regeln:
- Verwende nur die oben genannten Fakten.
- Erfinde keine Daten, Paragraphen, Rechtsfolgen, Fristen oder Zusagen.
- Keine Drohungen und keine Behauptung, dass ein Anspruch rechtlich sicher besteht.
- Fehlende Angaben nicht verdeckt ergänzen; liste sie in missingInformation.
- Formuliere einen direkt bearbeitbaren Entwurf mit Anrede und Grußformel.
- Weise im Schreiben nicht auf KI oder Reklaio hin.
- Das Ergebnis ist eine Organisations- und Formulierungshilfe, keine Rechtsberatung.`;

  const response = await getClient().responses.create({
    model,
    store: false,
    input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
    text: {
      format: {
        type: "json_schema",
        name: "reklaio_letter_draft",
        strict: true,
        schema: letterJsonSchema()
      }
    }
  } as any);

  return {
    data: parseJsonOutput(response.output_text, letterDraftSchema),
    model,
    responseId: response.id ?? null
  };
}
