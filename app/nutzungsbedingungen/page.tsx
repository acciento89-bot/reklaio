import { LegalLayout } from "@/components/legal-layout";
import { LEGAL_VERSION, legalOperator } from "@/lib/legal";

export default function TermsPage() {
  return (
    <LegalLayout eyebrow="Vertragliche Regeln" title="Nutzungsbedingungen" updated={LEGAL_VERSION}>
      <section>
        <h2>1. Geltungsbereich und Anbieter</h2>
        <p>Diese Nutzungsbedingungen gelten für die Nutzung von Reklaio, einem digitalen Dienst von {legalOperator.businessName}, Inhaber {legalOperator.operatorName}. Abweichende Bedingungen gelten nur, wenn sie ausdrücklich vereinbart wurden.</p>
      </section>

      <section>
        <h2>2. Leistungsumfang</h2>
        <p>Reklaio unterstützt Nutzer dabei, private Verbraucherfälle zu strukturieren, Dokumente zu speichern, Fristen und Aufgaben zu verwalten, Schreiben zu erstellen und auf Wunsch per E-Mail zu versenden.</p>
        <p>Reklaio ist keine Rechtsanwaltskanzlei, keine Verbraucherberatungsstelle und kein Inkassodienst. Inhalte, Vorlagen, Prioritäten, Eskalationsstufen und KI-Ausgaben sind Organisations- und Formulierungshilfen. Sie ersetzen keine individuelle rechtliche Prüfung.</p>
      </section>

      <section>
        <h2>3. Tarife</h2>
        <p><strong>Reklaio Free</strong> umfasst die grundlegende Fallorganisation, Dokumentablage, Fristen, Aufgaben, Vorlagen, E-Mail-Versand, Fallassistent und PDF-Export.</p>
        <p><strong>Reklaio Pro</strong> ergänzt insbesondere freiwillige KI-Dokumentanalysen und individuelle KI-Schreiben. Der jeweils geltende Preis, Abrechnungszeitraum und Leistungsumfang werden vor Abschluss auf der Preisseite und im Stripe-Checkout angezeigt.</p>
        <p>Bestehende Testkonten können zeitlich oder funktional einen unentgeltlichen Beta-Pro-Zugang erhalten. Daraus entsteht kein Anspruch auf eine dauerhafte kostenlose Bereitstellung kostenpflichtiger Funktionen.</p>
      </section>

      <section>
        <h2>4. Registrierung und Vertragsschluss</h2>
        <p>Für die geschützten Funktionen ist ein Nutzerkonto erforderlich. Der kostenlose Nutzungsvertrag kommt zustande, wenn die Registrierung abgeschlossen und das Konto bereitgestellt wird.</p>
        <p>Ein kostenpflichtiges Pro-Abonnement kommt zustande, wenn der Nutzer den Stripe-Checkout erfolgreich abschließt und Stripe den erfolgreichen Abonnementstatus an Reklaio übermittelt. Die im Checkout angezeigten Angaben sind Bestandteil des kostenpflichtigen Vertrags.</p>
      </section>

      <section>
        <h2>5. Zahlung, Laufzeit und Abrechnung</h2>
        <p>Die Abrechnung von Reklaio Pro erfolgt über Stripe. Das Entgelt wird zu Beginn des jeweils im Checkout ausgewiesenen Abrechnungszeitraums fällig. Stripe stellt die verfügbaren Zahlungsmethoden, Zahlungsbestätigungen und Rechnungsfunktionen bereit.</p>
        <p>Schlägt eine Zahlung fehl oder endet das Abonnement, kann der Zugang zu Pro-Funktionen eingeschränkt werden. Die im Free-Tarif enthaltenen Funktionen und bereits gespeicherten Daten bleiben grundsätzlich erhalten, soweit das Konto nicht gelöscht wird.</p>
      </section>

      <section>
        <h2>6. Verlängerung und Kündigung</h2>
        <p>Ein Pro-Abonnement verlängert sich automatisch um den im Checkout angegebenen Zeitraum, sofern es nicht vor Ablauf über das Stripe-Kundenportal gekündigt wird. Eine Kündigung wirkt grundsätzlich zum Ende des laufenden Abrechnungszeitraums, sofern im Portal nichts anderes angezeigt wird.</p>
        <p>Das kostenlose Konto kann unabhängig vom Pro-Abonnement über die Reklaio-Einstellungen gelöscht werden. Vor einer Kontolöschung sollte ein benötigter Datenexport erstellt werden.</p>
      </section>

      <section>
        <h2>7. Widerrufsrecht bei kostenpflichtigen Leistungen</h2>
        <p>Verbrauchern kann bei einem kostenpflichtigen Fernabsatzvertrag ein gesetzliches Widerrufsrecht zustehen. Die erforderliche Widerrufsbelehrung und gegebenenfalls eine ausdrückliche Zustimmung zum vorzeitigen Beginn digitaler Leistungen müssen vor dem produktiven Verkauf im Checkout- und Vertragsprozess rechtskonform bereitgestellt werden.</p>
        <p>Diese Regelung ist eine technische Arbeitsfassung und ersetzt nicht die für den konkreten Verkaufsstart erforderliche rechtliche Prüfung des Checkout-Prozesses.</p>
      </section>

      <section>
        <h2>8. Pflichten der Nutzer</h2>
        <p>Nutzer sind für die von ihnen gespeicherten, analysierten und versendeten Inhalte verantwortlich. Insbesondere verpflichten sie sich:</p>
        <ul>
          <li>nur Daten und Dokumente zu verarbeiten, die sie rechtmäßig verwenden dürfen,</li>
          <li>keine rechtswidrigen, beleidigenden, bedrohenden, täuschenden oder schädlichen Inhalte zu versenden,</li>
          <li>keine Schadsoftware, fremden Zugangsdaten oder unzulässige Massennachrichten einzubringen,</li>
          <li>erzeugte Schreiben, Fristen, Adressen, Beträge und Tatsachen vor Nutzung oder Versand selbst zu prüfen,</li>
          <li>besonders sensible Daten nur einzustellen, wenn dies für den eigenen Fall erforderlich ist.</li>
        </ul>
      </section>

      <section>
        <h2>9. Dokumente und Nutzerinhalte</h2>
        <p>Die Rechte an hochgeladenen Dokumenten und eingegebenen Inhalten verbleiben beim jeweiligen Rechteinhaber. Nutzer räumen Reklaio die technisch notwendige, auf die Vertragsdauer beschränkte Berechtigung ein, Inhalte zu speichern, darzustellen, zu sichern und auf ausdrückliche Anweisung zu verarbeiten oder zu versenden.</p>
      </section>

      <section>
        <h2>10. KI-gestützte Funktionen</h2>
        <p>KI-Dokumentenanalysen und KI-Schreiben sind optionale Pro-Funktionen. Sie werden nur nach einer gesonderten Bestätigung ausgelöst. KI-Ausgaben können Fehler enthalten, Inhalte übersehen oder Zusammenhänge unzutreffend wiedergeben.</p>
        <p>Erkannte Dokumentwerte werden nicht automatisch übernommen. KI-Schreiben werden als bearbeitbare Entwürfe gespeichert und nicht automatisch versendet. Nutzer müssen jede Ausgabe vor Übernahme oder Versand vollständig prüfen.</p>
        <p>Es dürfen keine KI-Funktionen genutzt werden, um rechtswidrige Täuschungen, Drohungen, gefälschte Nachweise oder automatisierte Massenkommunikation zu erzeugen.</p>
      </section>

      <section>
        <h2>11. E-Mail-Versand</h2>
        <p>Beim Versand über Reklaio bestimmt der Nutzer Empfänger, Inhalt, Betreff, Anhänge und gegebenenfalls eine Antwortfrist. Der Nutzer bestätigt mit dem Absenden, dass die Kontaktaufnahme zulässig und der Inhalt geprüft wurde.</p>
        <p>Reklaio kann die technische Zustellung anstoßen, schuldet jedoch keinen Zugang beim Empfänger und keine Reaktion des Empfängers.</p>
      </section>

      <section>
        <h2>12. Verfügbarkeit und Änderungen</h2>
        <p>Wir bemühen uns um eine zuverlässige Bereitstellung. Eine ununterbrochene oder fehlerfreie Verfügbarkeit kann nicht zugesichert werden. Wartung, Sicherheitsmaßnahmen, technische Störungen oder externe Anbieter können Funktionen zeitweise beeinträchtigen.</p>
        <p>Funktionen können weiterentwickelt, ersetzt oder eingestellt werden, soweit berechtigte Nutzerinteressen angemessen berücksichtigt werden. Wesentliche Änderungen kostenpflichtiger Leistungen werden in geeigneter Form mitgeteilt.</p>
      </section>

      <section>
        <h2>13. Haftung</h2>
        <p>Für Vorsatz, grobe Fahrlässigkeit, Verletzungen von Leben, Körper oder Gesundheit sowie nach zwingenden gesetzlichen Vorschriften haften wir unbeschränkt.</p>
        <p>Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen, soweit gesetzlich zulässig.</p>
        <p>Reklaio haftet nicht dafür, dass ein Anspruch besteht, eine Frist rechtlich zutreffend ist, ein Schreiben die gewünschte Wirkung erzielt oder eine KI-Ausgabe vollständig und richtig ist. Zwingende Verbraucherrechte bleiben unberührt.</p>
      </section>

      <section>
        <h2>14. Kontolöschung und Beendigung</h2>
        <p>Nutzer können ihr Konto jederzeit über die Einstellungen löschen. Mit der Löschung endet der kostenlose Nutzungsvertrag. Ein bei Stripe bestehendes Abonnement sollte zuvor über das Kundenportal gekündigt werden; eine Kontolöschung ersetzt nicht automatisch die Kündigung eines extern verwalteten Zahlungsabonnements.</p>
        <p>Wir können den Vertrag aus wichtigem Grund beenden, insbesondere bei schwerwiegenden Sicherheits-, Missbrauchs- oder Rechtsverstößen.</p>
      </section>

      <section>
        <h2>15. Datenschutz</h2>
        <p>Informationen zur Verarbeitung personenbezogener Daten stehen in der <a href="/datenschutz">Datenschutzerklärung</a>.</p>
      </section>

      <section>
        <h2>16. Schlussbestimmungen</h2>
        <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Bei Verbrauchern gilt diese Rechtswahl nur, soweit dadurch zwingender Schutz des Staates des gewöhnlichen Aufenthalts nicht entzogen wird.</p>
        <p>Sollte eine Bestimmung unwirksam sein, bleiben die übrigen Bedingungen wirksam. An die Stelle der unwirksamen Bestimmung treten die gesetzlichen Regelungen.</p>
        <p>Kontakt zu diesen Bedingungen: <a href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a> oder über das <a href="/kontakt">Kontaktformular</a>.</p>
      </section>
    </LegalLayout>
  );
}
