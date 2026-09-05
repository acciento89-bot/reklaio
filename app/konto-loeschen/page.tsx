import Link from "next/link";
import { LegalLayout } from "@/components/legal-layout";
import { PRIVACY_VERSION } from "@/lib/legal-documents";
import { legalOperator } from "@/lib/legal";
import { getLocale } from "@/lib/i18n";
import { AccountDeletionEn } from "@/components/legal-pages-en";

export default async function AccountDeletionPage() {
  if (await getLocale() === "en") return <AccountDeletionEn />;
  return (
    <LegalLayout eyebrow="Datenschutz" title="Reklaio-Konto löschen" updated={PRIVACY_VERSION}>
      <section>
        <h2>Konto und zugehörige Daten löschen</h2>
        <p>
          Du kannst die Löschung deines Reklaio-Kontos direkt in der mobilen App unter
          „Konto & Sicherheit“ oder über die Web-Kontoverwaltung einleiten.
        </p>
        <p>
          Bei der Löschung werden das Nutzerkonto sowie die damit verbundenen Fallakten,
          Fristen, Chronikeinträge und hochgeladenen Dokumente dauerhaft entfernt, soweit
          keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
        </p>
      </section>

      <section>
        <h2>Löschung über die App</h2>
        <ol>
          <li>Öffne in Reklaio den Bereich „Konto“.</li>
          <li>Wähle „Konto und Daten löschen“.</li>
          <li>Bestätige die Löschung mit deinem aktuellen Passwort und dem Wort „LÖSCHEN“.</li>
        </ol>
      </section>

      <section>
        <h2>Löschung über den Browser</h2>
        <p>
          Melde dich in der <Link href="/einstellungen">Web-Kontoverwaltung</Link> an und
          nutze dort den Abschnitt „Konto löschen“.
        </p>
      </section>

      <section>
        <h2>Kein Zugriff mehr auf das Konto?</h2>
        <p>
          Sende die Löschanfrage von der für das Reklaio-Konto verwendeten E-Mail-Adresse an
          <a href={`mailto:${legalOperator.email}`}> {legalOperator.email}</a>. Zur Vermeidung
          unberechtigter Löschungen können wir eine Bestätigung der Kontoinhaberschaft anfordern.
        </p>
      </section>

      <section>
        <h2>Abonnements und Kontolöschung</h2>
        <p>
          Ein direkt auf reklaio.de über Stripe abgeschlossenes und noch aktives Abonnement muss
          vor der Kontolöschung über die Web-Kontoverwaltung beendet werden.
        </p>
        <p>
          Ein über Apple oder Google abgeschlossenes Abonnement hindert die sofortige Löschung des
          Reklaio-Kontos nicht. Es wird durch die Kontolöschung jedoch nicht automatisch gekündigt
          und muss separat in den Apple- beziehungsweise Google-Abonnementeinstellungen beendet werden.
        </p>
        <p>
          Abrechnungs-, Vertrags- oder Sicherheitsdaten können im gesetzlich erforderlichen Umfang
          länger gespeichert bleiben. Gelöschte Inhalte können bis zum Ablauf der geschützten
          Backup-Rotation technisch noch in Sicherungen enthalten sein.
        </p>
      </section>
    </LegalLayout>
  );
}
