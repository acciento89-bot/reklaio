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
        <p>Vor einem kostenpflichtigen Bestellvorgang werden Leistung, Gesamtpreis, Abrechnungszeitraum, automatische Verlängerung und Kündigung angezeigt. Der Vertrag wird wirksam, sobald der jeweilige Bestell- und Zahlungsvorgang erfolgreich bestätigt und der Pro-Status an Reklaio übermittelt wurde.</p>
        <p>Auf der Website erfolgt die Zahlungsabwicklung über Stripe. In der iOS-App erfolgt sie über Apple In-App Purchase und in der Android-App über Google Play Billing. Für Store-Käufe gelten ergänzend die Zahlungs-, Abrechnungs- und Erstattungsbedingungen des jeweiligen Stores.</p>
      </section>

      <section>
        <h2>7. Preise und Zahlung</h2>
        <p>Es gilt der unmittelbar vor der Bestellung hervorgehoben angezeigte Gesamtpreis. Bei mobilen Käufen ist der im Apple App Store beziehungsweise bei Google Play angezeigte lokalisierte Preis maßgeblich. Reklaio speichert keine vollständigen Karten-, Bank- oder Store-Zahlungsdaten.</p>
        <p>Apple, Google oder Stripe können Zahlungs-, Steuer-, Rechnungs- und Transaktionsdaten nach ihren eigenen Bedingungen verarbeiten. Bei fehlgeschlagener, zurückgebuchter oder ausbleibender Zahlung kann der Pro-Zugang nach angemessener Prüfung eingeschränkt werden. Free-Daten bleiben grundsätzlich erhalten.</p>
      </section>

      <section>
        <h2>8. Laufzeit, Verlängerung und Kündigung</h2>
        <p>Das Pro-Abonnement läuft für den angezeigten Abrechnungszeitraum und verlängert sich automatisch, sofern es nicht vor dem nächsten Verlängerungszeitpunkt gekündigt wird.</p>
        <p>Web-Abonnements werden über das Stripe-Kundenportal verwaltet. In der iOS-App abgeschlossene Abonnements werden in den Apple-Abonnementeinstellungen und Android-Abonnements im Google-Play-Konto verwaltet. Eine Kontolöschung bei Reklaio beendet ein Store-Abonnement nicht automatisch; Nutzer werden vor der Löschung hierauf hingewiesen und erhalten einen direkten Verwaltungslink.</p>
      </section>

      <section>
        <h2>9. Widerruf und Erstattungen</h2>
        <p>Für direkt auf der Reklaio-Website abgeschlossene Verträge stehen die Widerrufsbelehrung und das Musterformular unter <a href="/widerruf">/widerruf</a> bereit.</p>
        <p>Bei über Apple oder Google abgeschlossenen Käufen werden Abrechnung, Stornierung und Erstattungsanträge über den jeweiligen Store abgewickelt. Gesetzlich zwingende Verbraucherrechte bleiben unberührt.</p>
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
