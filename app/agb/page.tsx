import { LegalLayout } from "@/components/legal-layout";
import { AGB_VERSION, getPaidContractSummary } from "@/lib/legal-documents";
import { legalOperator } from "@/lib/legal";

export default function AgbPage() {
  const paid = getPaidContractSummary();

  return (
    <LegalLayout eyebrow="Vertragliche Regeln" title="Allgemeine Geschäftsbedingungen (AGB)" updated={AGB_VERSION}>
      <section>
        <h2>1. Anbieter und Geltungsbereich</h2>
        <p>Diese AGB gelten für die Nutzung von Reklaio durch Verbraucher. Anbieter ist {legalOperator.businessName}, Inhaber {legalOperator.operatorName}. Abweichende Bedingungen gelten nur, wenn sie ausdrücklich bestätigt wurden.</p>
      </section>

      <section>
        <h2>2. Zweck von Reklaio</h2>
        <p>Reklaio ist eine digitale Organisations- und Formulierungshilfe für private Verbraucherfälle. Nutzer können Fallakten, Belege, Ereignisse, Aufgaben, Fristen, Anbieterantworten und Schreiben verwalten.</p>
        <p>Reklaio erbringt keine Rechtsberatung, übernimmt keine Vertretung und garantiert weder das Bestehen eines Anspruchs noch den Erfolg eines Schreibens oder einer Eskalation.</p>
      </section>

      <section>
        <h2>3. Reklaio Free</h2>
        <p>Der Free-Tarif umfasst die auf der Preisseite beschriebenen Grundfunktionen, insbesondere Fallakten, Dokumentablage, Fristen, Aufgaben, Vorlagen, E-Mail-Versand, Fallassistent und PDF-Export. Einzelne angemessene technische Nutzungsgrenzen können zum Schutz des Dienstes gelten.</p>
      </section>

      <section>
        <h2>4. Reklaio Pro</h2>
        <p>Reklaio Pro ergänzt die Free-Funktionen insbesondere um freiwillige KI-Dokumentanalysen und individuelle KI-Schreiben. Monatliche Kontingente und der aktuelle Leistungsumfang werden vor dem Vertragsschluss angezeigt.</p>
        <p>Aktuelle Vertragsangaben: <strong>{paid.price}</strong>; {paid.interval}; Mindestlaufzeit: {paid.minimumTerm}; Kündigung: {paid.cancellation}</p>
      </section>

      <section>
        <h2>5. Registrierung</h2>
        <p>Für geschützte Funktionen ist ein persönliches Konto erforderlich. Nutzer müssen zutreffende Angaben machen, Zugangsdaten schützen und Reklaio bei einem vermuteten Missbrauch unverzüglich informieren.</p>
      </section>

      <section>
        <h2>6. Vertragsschluss bei Reklaio Pro</h2>
        <p>Vor dem kostenpflichtigen Bestellvorgang werden Leistung, Gesamtpreis, Abrechnungszeitraum, automatische Verlängerung, Kündigung, AGB und Widerrufsbelehrung angezeigt. Der Nutzer bestätigt die erforderlichen Erklärungen und startet den Zahlungsvorgang über eine eindeutig als zahlungspflichtig bezeichnete Schaltfläche.</p>
        <p>Die Zahlungsabwicklung erfolgt über Stripe. Der Pro-Vertrag wird wirksam, wenn der Bestell- und Zahlungsvorgang erfolgreich abgeschlossen und der Status an Reklaio übermittelt wurde. Eine Vertragsbestätigung wird per E-Mail versendet.</p>
      </section>

      <section>
        <h2>7. Preise und Zahlung</h2>
        <p>Es gilt der unmittelbar vor der Bestellung hervorgehoben angezeigte Gesamtpreis. Angaben zu Steuern, Abrechnungsintervall und akzeptierten Zahlungsmitteln werden im Bestellprozess angezeigt. Reklaio speichert keine vollständigen Kartendaten.</p>
        <p>Bei fehlgeschlagener, zurückgebuchter oder ausbleibender Zahlung kann der Pro-Zugang nach angemessener Prüfung eingeschränkt werden. Free-Daten bleiben grundsätzlich erhalten.</p>
      </section>

      <section>
        <h2>8. Laufzeit, Verlängerung und Kündigung</h2>
        <p>Das Pro-Abonnement läuft für den angezeigten Abrechnungszeitraum und verlängert sich automatisch um einen weiteren Zeitraum, sofern es nicht rechtzeitig über das Stripe-Kundenportal gekündigt wird. Die Kündigung wirkt grundsätzlich zum Ende der laufenden Periode.</p>
        <p>Ein kostenloses Konto kann unabhängig davon in den Einstellungen gelöscht werden. Eine Kontolöschung ersetzt nicht automatisch die Kündigung eines noch bei Stripe bestehenden Abonnements.</p>
      </section>

      <section>
        <h2>9. Widerrufsrecht</h2>
        <p>Verbrauchern steht grundsätzlich ein gesetzliches Widerrufsrecht zu. Die aktuelle Widerrufsbelehrung und das Musterformular sind unter <a href="/widerruf">/widerruf</a> abrufbar und werden im Bestellprozess bereitgestellt.</p>
        <p>Verlangt der Nutzer ausdrücklich, dass Reklaio Pro vor Ablauf der Widerrufsfrist bereitgestellt wird, kann im Widerrufsfall für die bis dahin erbrachte Leistung ein angemessener anteiliger Betrag geschuldet sein, soweit die gesetzlichen Voraussetzungen erfüllt sind.</p>
      </section>

      <section>
        <h2>10. KI-Kontingente und Fair Use</h2>
        <p>KI-Funktionen unterliegen den im Tarif oder Konto angezeigten monatlichen Kontingenten. Fehlgeschlagene technische Vorgänge werden grundsätzlich nicht auf das Kontingent angerechnet. Reklaio kann angemessene Schutzmaßnahmen gegen automatisierte oder missbräuchliche Massennutzung einsetzen.</p>
        <p>Kontingente sind nicht übertragbar und werden zu Beginn des jeweiligen Kalendermonats beziehungsweise des angegebenen Nutzungszeitraums zurückgesetzt. Individuell gewährte Beta- oder Adminlimits können abweichen.</p>
      </section>

      <section>
        <h2>11. Verantwortung für Inhalte</h2>
        <p>Nutzer sind für eingegebene, hochgeladene, übernommene und versendete Inhalte verantwortlich. Sie dürfen nur Daten und Dokumente verarbeiten, die sie rechtmäßig verwenden dürfen.</p>
        <ul>
          <li>Keine rechtswidrigen, täuschenden oder beleidigenden Inhalte,</li>
          <li>keine gefälschten Belege oder bewusst falschen Tatsachen,</li>
          <li>keine Schadsoftware oder unzulässige Massennachrichten,</li>
          <li>keine Weitergabe eigener Zugangsdaten.</li>
        </ul>
      </section>

      <section>
        <h2>12. KI-Ausgaben</h2>
        <p>KI-Ergebnisse können unvollständig oder falsch sein. Erkannte Dokumentwerte werden nicht ungeprüft übernommen und KI-Schreiben werden nicht automatisch versendet. Nutzer müssen Originaldokument, Tatsachen, Beträge, Adressen, Fristen und Text vor Nutzung vollständig kontrollieren.</p>
      </section>

      <section>
        <h2>13. E-Mail-Versand</h2>
        <p>Beim Versand bestimmt der Nutzer Empfänger, Inhalt, Betreff, Anhänge und Fristen. Reklaio schuldet die technische Übergabe an den eingesetzten Mailanbieter, nicht den tatsächlichen Zugang beim Empfänger oder eine Reaktion.</p>
      </section>

      <section>
        <h2>14. Verfügbarkeit, Wartung und Änderungen</h2>
        <p>Eine ununterbrochene Verfügbarkeit wird nicht garantiert. Wartung, Sicherheitsmaßnahmen, Störungen und Ausfälle externer Anbieter können den Dienst vorübergehend beeinträchtigen.</p>
        <p>Wesentliche nachteilige Änderungen kostenpflichtiger Leistungen werden mit angemessenem Vorlauf mitgeteilt. Zwingende gesetzliche Rechte bleiben unberührt.</p>
      </section>

      <section>
        <h2>15. Sperrung</h2>
        <p>Konten können bei konkretem Missbrauchsverdacht, erheblichen Sicherheitsrisiken, Zahlungsstörungen oder schweren Vertragsverstößen vorübergehend gesperrt werden. Soweit möglich, erhält der Nutzer Gelegenheit zur Stellungnahme oder Abhilfe.</p>
      </section>

      <section>
        <h2>16. Haftung</h2>
        <p>Für Vorsatz, grobe Fahrlässigkeit, Verletzungen von Leben, Körper oder Gesundheit sowie nach zwingenden gesetzlichen Vorschriften haften wir unbeschränkt.</p>
        <p>Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vorhersehbaren, vertragstypischen Schaden begrenzt. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen, soweit rechtlich zulässig.</p>
        <p>Reklaio haftet nicht für die rechtliche Richtigkeit einer Nutzerentscheidung oder dafür, dass ein Anspruch durchgesetzt wird. Zwingende Verbraucherrechte bleiben unberührt.</p>
      </section>

      <section>
        <h2>17. Datenschutz und Datensicherung</h2>
        <p>Einzelheiten stehen in der <a href="/datenschutz">Datenschutzerklärung</a>. Nutzer sollten wichtige Unterlagen zusätzlich außerhalb von Reklaio sichern und vor einer Kontolöschung einen Export erstellen.</p>
      </section>

      <section>
        <h2>18. Schlussbestimmungen</h2>
        <p>Es gilt deutsches Recht. Bei Verbrauchern gilt diese Rechtswahl nur, soweit zwingende Schutzvorschriften des Staates des gewöhnlichen Aufenthalts nicht entzogen werden.</p>
        <p>Sollte eine Bestimmung unwirksam sein, bleiben die übrigen Regelungen wirksam. Kontakt: <a href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a> oder <a href="/kontakt">Kontaktformular</a>.</p>
      </section>
    </LegalLayout>
  );
}
