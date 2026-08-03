import { formatCurrency, formatDate } from "@/lib/cases";
import type { CaseTypeValue } from "@/lib/case-types";

export const letterKinds = [
  {
    value: "refund_request",
    label: "Rückzahlung anfordern",
    description: "Für bestätigte Retouren, Stornos oder andere noch offene Erstattungen."
  },
  {
    value: "delivery_request",
    label: "Lieferung oder Auskunft anfordern",
    description: "Für verspätete, verschwundene oder fälschlich als zugestellt markierte Sendungen."
  },
  {
    value: "defect_notice",
    label: "Mangel melden",
    description: "Für defekte, beschädigte, falsche oder unvollständige Ware."
  },
  {
    value: "cancellation_confirmation",
    label: "Kündigungsbestätigung anfordern",
    description: "Für nicht bestätigte Kündigungen oder weitere Abbuchungen."
  },
  {
    value: "final_reminder",
    label: "Letzte Erinnerung senden",
    description: "Für ein bereits mitgeteiltes Anliegen, auf das noch keine ausreichende Reaktion kam."
  },
  {
    value: "custom",
    label: "Freies Schreiben",
    description: "Neutrale Vorlage für ein individuelles Anliegen."
  }
] as const;

export type LetterKind = (typeof letterKinds)[number]["value"];

export type LetterCaseData = {
  type: CaseTypeValue;
  title: string;
  companyName: string | null;
  orderReference: string | null;
  amountCents: number | null;
  currency: string;
  incidentDate: string | null;
  summary: string | null;
};

export type LetterUserData = {
  displayName: string | null;
  email: string;
};

export type PreparedLetter = {
  kind: LetterKind;
  label: string;
  description: string;
  subject: string;
  body: string;
};

export function isLetterKind(value: string): value is LetterKind {
  return letterKinds.some((item) => item.value === value);
}

export function getLetterKindLabel(value: string) {
  return letterKinds.find((item) => item.value === value)?.label ?? "Schreiben";
}

export function getSuggestedLetterKind(type: CaseTypeValue): LetterKind {
  switch (type) {
    case "refund_missing":
      return "refund_request";
    case "delivery_missing":
      return "delivery_request";
    case "product_problem":
      return "defect_notice";
    case "cancellation_ignored":
      return "cancellation_confirmation";
    default:
      return "custom";
  }
}

function caseReference(data: LetterCaseData) {
  const parts = [data.orderReference ? `Referenz: ${data.orderReference}` : null, data.incidentDate ? `Datum: ${formatDate(data.incidentDate)}` : null]
    .filter(Boolean)
    .join(" · ");

  return parts ? `\n${parts}\n` : "\n";
}

function detailsBlock(data: LetterCaseData) {
  const details = [
    data.summary ? `Sachverhalt: ${data.summary}` : null,
    data.amountCents !== null ? `Betrag: ${formatCurrency(data.amountCents, data.currency)}` : null
  ].filter(Boolean);

  return details.length ? `\n${details.join("\n")}\n` : "\n";
}

function closing(user: LetterUserData) {
  const sender = user.displayName || user.email;
  return `\nMit freundlichen Grüßen\n${sender}\n${user.email}`;
}

function companyName(data: LetterCaseData) {
  return data.companyName || "Ihr Unternehmen";
}

export function buildLetterTemplate(kind: LetterKind, data: LetterCaseData, user: LetterUserData): PreparedLetter {
  const metadata = letterKinds.find((item) => item.value === kind) ?? letterKinds[letterKinds.length - 1];
  const reference = caseReference(data);
  const details = detailsBlock(data);
  const ending = closing(user);

  switch (kind) {
    case "refund_request":
      return {
        ...metadata,
        kind,
        subject: `Ausstehende Rückzahlung${data.orderReference ? ` – ${data.orderReference}` : ""}`,
        body: `Sehr geehrte Damen und Herren,\n\nzu meinem Vorgang „${data.title}“ steht die angekündigte oder geschuldete Rückzahlung weiterhin aus.${reference}${details}\nBitte prüfen Sie den Vorgang und veranlassen Sie die Rückzahlung. Teilen Sie mir bitte außerdem bis zum [Datum einsetzen] mit, wann der Betrag gutgeschrieben wird.\n\nSollte die Zahlung bereits angewiesen worden sein, senden Sie mir bitte einen entsprechenden Nachweis.${ending}`
      };

    case "delivery_request":
      return {
        ...metadata,
        kind,
        subject: `Klärung der ausstehenden Lieferung${data.orderReference ? ` – ${data.orderReference}` : ""}`,
        body: `Sehr geehrte Damen und Herren,\n\ndie zu meinem Vorgang „${data.title}“ gehörende Lieferung ist bisher nicht ordnungsgemäß bei mir angekommen.${reference}${details}\nBitte teilen Sie mir bis zum [Datum einsetzen] mit, wo sich die Sendung befindet und wann mit einer Zustellung zu rechnen ist. Falls eine Lieferung nicht mehr möglich ist, bitte ich um eine klare Mitteilung zum weiteren Vorgehen.\n\nBei einer als zugestellt markierten Sendung bitte ich zusätzlich um den vollständigen Zustellnachweis.${ending}`
      };

    case "defect_notice":
      return {
        ...metadata,
        kind,
        subject: `Mängelanzeige${data.orderReference ? ` – ${data.orderReference}` : ""}`,
        body: `Sehr geehrte Damen und Herren,\n\nhiermit melde ich einen Mangel zu meinem Vorgang „${data.title}“.${reference}${details}\nBitte prüfen Sie den geschilderten Sachverhalt und teilen Sie mir bis zum [Datum einsetzen] mit, wie die Nacherfüllung erfolgen soll. Ich bitte um eine konkrete Rückmeldung, ob eine Reparatur, Ersatzlieferung oder eine andere Lösung vorgesehen ist.\n\nVorhandene Fotos, Rechnungen oder weitere Nachweise kann ich bei Bedarf erneut bereitstellen.${ending}`
      };

    case "cancellation_confirmation":
      return {
        ...metadata,
        kind,
        subject: `Bestätigung meiner Kündigung${data.orderReference ? ` – ${data.orderReference}` : ""}`,
        body: `Sehr geehrte Damen und Herren,\n\nzu meinem Vorgang „${data.title}“ fehlt mir weiterhin eine eindeutige Bestätigung der Kündigung beziehungsweise der Vertragsbeendigung.${reference}${details}\nBitte bestätigen Sie mir bis zum [Datum einsetzen] schriftlich das Beendigungsdatum und teilen Sie mir mit, ob noch offene Beträge bestehen. Weitere Abbuchungen nach dem wirksamen Vertragsende bitte ich zu unterlassen beziehungsweise nachvollziehbar zu erläutern.${ending}`
      };

    case "final_reminder":
      return {
        ...metadata,
        kind,
        subject: `Letzte Erinnerung zu „${data.title}“`,
        body: `Sehr geehrte Damen und Herren,\n\nich erinnere erneut an meinen bislang nicht abschließend geklärten Vorgang „${data.title}“.${reference}${details}\nBitte bearbeiten Sie mein Anliegen und senden Sie mir bis zum [Datum einsetzen] eine nachvollziehbare schriftliche Antwort. Sollte ich bis dahin keine ausreichende Rückmeldung erhalten, werde ich prüfen, welche weiteren Schritte für die Klärung sinnvoll sind.${ending}`
      };

    default:
      return {
        ...metadata,
        kind: "custom",
        subject: `Anliegen zu „${data.title}“`,
        body: `Sehr geehrte Damen und Herren,\n\nich wende mich wegen meines Vorgangs „${data.title}“ an ${companyName(data)}.${reference}${details}\nBitte prüfen Sie mein Anliegen und senden Sie mir bis zum [Datum einsetzen] eine schriftliche Rückmeldung.\n\n[Gewünschte Lösung hier ergänzen]${ending}`
      };
  }
}

export function buildAllLetterTemplates(data: LetterCaseData, user: LetterUserData) {
  return letterKinds.map((item) => buildLetterTemplate(item.value, data, user));
}
