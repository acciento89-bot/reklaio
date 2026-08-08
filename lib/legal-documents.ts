import { legalAddressLines, legalOperator } from "@/lib/legal";

export const AGB_VERSION = "2026-08-08-store-v1";
export const PRIVACY_VERSION = "2026-08-08-store-v1";
export const WITHDRAWAL_VERSION = "2026-08-05-v1";

export function getPaidContractSummary() {
  return {
    service: "Reklaio Pro",
    price: process.env.REKLAIO_PRO_PRICE_LABEL?.trim() || "Preis wird im Checkout angezeigt",
    interval: process.env.REKLAIO_PRO_INTERVAL_LABEL?.trim() || "monatlich, automatisch verlängernd",
    taxNotice: process.env.REKLAIO_TAX_LABEL?.trim() || "Der im Checkout angezeigte Gesamtpreis ist maßgeblich.",
    cancellation: "Web-Abonnements sind zum Ende des laufenden Abrechnungszeitraums über das Stripe-Kundenportal kündbar. In der mobilen App abgeschlossene Abonnements werden im jeweiligen Apple- oder Google-Konto verwaltet.",
    minimumTerm: "Ein Abrechnungszeitraum",
    paymentProvider: "Stripe im Web; Apple beziehungsweise Google in der mobilen App"
  };
}

export function withdrawalInstructionText() {
  const address = legalAddressLines().join("\n");
  return `WIDERRUFSBELEHRUNG\nStand: ${WITHDRAWAL_VERSION}\n\nWiderrufsrecht\nSie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.\n\nUm Ihr Widerrufsrecht auszuüben, müssen Sie uns\n${address}\nE-Mail: ${legalOperator.email}\nKontaktformular: https://reklaio.de/widerruf\n\nmittels einer eindeutigen Erklärung über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.\n\nZur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung vor Ablauf der Widerrufsfrist absenden.\n\nFolgen des Widerrufs\nWenn Sie diesen Vertrag widerrufen, erstatten wir alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab Eingang Ihres Widerrufs. Für die Rückzahlung verwenden wir grundsätzlich dasselbe Zahlungsmittel.\n\nHaben Sie ausdrücklich verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, kann für die bis zum Widerruf erbrachte Leistung ein angemessener anteiliger Betrag geschuldet sein, soweit die gesetzlichen Voraussetzungen vorliegen.\n`;
}

export function withdrawalFormText() {
  return `MUSTER-WIDERRUFSFORMULAR\n\nAn:\n${legalAddressLines().join("\n")}\nE-Mail: ${legalOperator.email}\n\nHiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über Reklaio Pro.\n\nBestellt am:\nName:\nAnschrift:\nE-Mail des Reklaio-Kontos:\nDatum:\nUnterschrift (nur bei Mitteilung auf Papier):\n`;
}

export function paidContractConfirmationText(input: {
  customerEmail: string;
  checkoutReference: string;
  startedAt: string;
}) {
  const summary = getPaidContractSummary();
  return [
    "VERTRAGSBESTÄTIGUNG REKLAIO PRO",
    `Vertragsreferenz: ${input.checkoutReference}`,
    `Konto: ${input.customerEmail}`,
    `Vertragsbeginn: ${input.startedAt}`,
    "",
    `Leistung: ${summary.service}`,
    `Gesamtpreis: ${summary.price}`,
    `Abrechnung: ${summary.interval}`,
    `Mindestlaufzeit: ${summary.minimumTerm}`,
    `Kündigung: ${summary.cancellation}`,
    `Zahlungsdienst: ${summary.paymentProvider}`,
    summary.taxNotice,
    "",
    `AGB-Version: ${AGB_VERSION}`,
    "AGB: https://reklaio.de/agb",
    "Datenschutz: https://reklaio.de/datenschutz",
    "Widerrufsbelehrung: https://reklaio.de/widerruf",
    "",
    withdrawalInstructionText(),
    "",
    withdrawalFormText()
  ].join("\n");
}
