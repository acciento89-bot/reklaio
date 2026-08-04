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
        <p>Reklaio unterstützt Nutzer dabei, private Verbraucherfälle zu strukturieren, Dokumente zu speichern, Fristen und Aufgaben zu verwalten, Schreiben zu erstellen und auf Wunsch per E-Mail zu versenden. Einzelne Funktionen können als freiwillige KI-gestützte Hilfen angeboten werden.</p>
        <p>Reklaio ist keine Rechtsanwaltskanzlei, keine Verbraucherberatungsstelle und kein Inkassodienst. Inhalte, Vorlagen, Prioritäten, Eskalationsstufen und KI-Ausgaben sind Organisations- und Formulierungshilfen. Sie ersetzen keine individuelle rechtliche Prüfung.</p>
      </section>

      <section>
        <h2>3. Registrierung und Vertragsschluss</h2>
        <p>Für die geschützten Funktionen ist ein Nutzerkonto erforderlich. Der Nutzungsvertrag kommt zustande, wenn die Registrierung abgeschlossen und das Konto bereitgestellt wird. Nutzer müssen korrekte Kontaktdaten angeben und ihre Zugangsdaten geheim halten.</p>
        <p>Die Nutzung ist nur Personen gestattet, die rechtlich wirksam handeln dürfen. Minderjährige dürfen Reklaio nur mit Zustimmung ihrer gesetzlichen Vertretung nutzen.</p>
      </section>

      <section>
        <h2>4. Pflichten der Nutzer</h2>
        <p>Nutzer sind für die von ihnen gespeicherten, analysierten und versendeten Inhalte verantwortlich. Insbesondere verpflichten sie sich:</p>
        <ul>
          <li>nur Daten und Dokumente zu verarbeiten, die sie rechtmäßig verwenden dürfen,</li>
          <li>keine rechtswidrigen, beleidigenden, bedrohen­den, täuschenden oder schädlichen Inhalte zu versenden,</li>
          <li>keine Schadsoftware, fremden Zugangsdaten oder unzulässige Massennachrichten einzubringen,</li>
          <li>erzeugte Schreiben, Fristen, Adressen, Beträge und Tatsachen vor Nutzung oder Versand selbst zu prüfen,</li>
          <li>besonders sensible Daten nur einzustellen, wenn dies für den eigenen Fall erforderlich ist.</li>
        </ul>
      </section>

      <section>
        <h2>5. Dokumente und Nutzerinhalte</h2>
        <p>Die Rechte an hochgeladenen Dokumenten und eingegebenen Inhalten verbleiben beim jeweiligen Rechteinhaber. Nutzer räumen Reklaio die technisch notwendige, auf die Vertragsdauer beschränkte Berechtigung ein, Inhalte zu speichern, darzustellen, zu sichern und auf ausdrückliche Anweisung zu verarbeiten oder zu versenden.</p>
        <p>Reklaio darf offensichtlich rechtswidrige Inhalte sperren oder entfernen und Konten bei erheblichen oder wiederholten Verstößen einschränken. Gesetzliche Ansprüche und Anhörungsrechte bleiben unberührt.</p>
      </section>

      <section>
        <h2>6. KI-gestützte Funktionen</h2>
        <p>KI-Dokumentenanalysen und KI-Schreiben sind optionale Zusatzfunktionen. Sie werden nur nach einer gesonderten Bestätigung ausgelöst. KI-Ausgaben können Fehler enthalten, Inhalte übersehen oder Zusammenhänge unzutreffend wiedergeben.</p>
        <p>Erkannte Dokumentwerte werden nicht automatisch übernommen. KI-Schreiben werden als bearbeitbare Entwürfe gespeichert und nicht automatisch versendet. Nutzer müssen jede Ausgabe vor Übernahme oder Versand vollständig prüfen.</p>
        <p>Es dürfen keine KI-Funktionen genutzt werden, um rechtswidrige Täuschungen, Drohungen, gefälschte Nachweise oder automatisierte Massenkommunikation zu erzeugen.</p>
      </section>

      <section>
        <h2>7. E-Mail-Versand</h2>
        <p>Beim Versand über Reklaio bestimmt der Nutzer Empfänger, Inhalt, Betreff, Anhänge und gegebenenfalls eine Antwortfrist. Der Nutzer bestätigt mit dem Absenden, dass die Kontaktaufnahme zulässig und der Inhalt geprüft wurde.</p>
        <p>Reklaio kann die technische Zustellung anstoßen, schuldet jedoch keinen Zugang beim Empfänger und keine Reaktion des Empfängers. Spamfilter, falsche Adressen, Störungen beim Mailanbieter oder Ablehnungen des Empfängers können die Zustellung verhindern.</p>
      </section>

      <section>
        <h2>8. Verfügbarkeit und Änderungen</h2>
        <p>Wir bemühen uns um eine zuverlässige Bereitstellung. Eine ununterbrochene oder fehlerfreie Verfügbarkeit kann nicht zugesichert werden. Wartung, Sicherheitsmaßnahmen, technische Störungen oder externe Anbieter können Funktionen zeitweise beeinträchtigen.</p>
        <p>Funktionen können weiterentwickelt, ersetzt oder eingestellt werden, soweit dadurch berechtigte Nutzerinteressen angemessen berücksichtigt werden. Wesentliche Änderungen werden in geeigneter Form mitgeteilt.</p>
      </section>

      <section>
        <h2>9. Entgelt</h2>
        <p>Soweit Reklaio ohne gesonderte Preisangabe bereitgestellt wird, ist die Nutzung unentgeltlich. Kostenpflichtige Funktionen oder Tarife werden nur auf Grundlage einer gesonderten, vor Abschluss klar angezeigten Vereinbarung angeboten.</p>
      </section>

      <section>
        <h2>10. Haftung</h2>
        <p>Für Vorsatz, grobe Fahrlässigkeit, Verletzungen von Leben, Körper oder Gesundheit sowie nach zwingenden gesetzlichen Vorschriften haften wir unbeschränkt.</p>
        <p>Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen, soweit gesetzlich zulässig.</p>
        <p>Reklaio haftet nicht dafür, dass ein Anspruch besteht, eine Frist rechtlich zutreffend ist, ein Schreiben die gewünschte Wirkung erzielt oder eine KI-Ausgabe vollständig und richtig ist. Zwingende Verbraucherrechte bleiben unberührt.</p>
      </section>

      <section>
        <h2>11. Laufzeit, Kündigung und Löschung</h2>
        <p>Der Nutzungsvertrag läuft auf unbestimmte Zeit. Nutzer können ihr Konto jederzeit über die Einstellungen löschen. Mit der Löschung endet der Nutzungsvertrag, soweit keine gesetzlichen Pflichten fortbestehen.</p>
        <p>Wir können den Vertrag aus wichtigem Grund beenden, insbesondere bei schwerwiegenden Sicherheits-, Missbrauchs- oder Rechtsverstößen. Soweit möglich, wird vorher Gelegenheit zur Stellungnahme oder Abhilfe gegeben.</p>
      </section>

      <section>
        <h2>12. Datenschutz</h2>
        <p>Informationen zur Verarbeitung personenbezogener Daten stehen in der <a href="/datenschutz">Datenschutzerklärung</a>.</p>
      </section>

      <section>
        <h2>13. Schlussbestimmungen</h2>
        <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Bei Verbrauchern gilt diese Rechtswahl nur, soweit dadurch zwingender Schutz des Staates des gewöhnlichen Aufenthalts nicht entzogen wird.</p>
        <p>Sollte eine Bestimmung unwirksam sein, bleiben die übrigen Bedingungen wirksam. An die Stelle der unwirksamen Bestimmung treten die gesetzlichen Regelungen.</p>
        <p>Kontakt zu diesen Bedingungen: <a href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a>.</p>
      </section>
    </LegalLayout>
  );
}
