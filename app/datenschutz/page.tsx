import { LegalLayout } from "@/components/legal-layout";
import { LEGAL_VERSION, legalAddressLines, legalOperator } from "@/lib/legal";

export default function PrivacyPage() {
  return (
    <LegalLayout eyebrow="Datenschutz" title="Datenschutzerklärung" updated={LEGAL_VERSION}>
      <section>
        <h2>1. Verantwortlicher</h2>
        <div className="legal-address">
          {legalAddressLines().map((line) => <span key={line}>{line}</span>)}
          <span>E-Mail: {legalOperator.email}</span>
        </div>
      </section>

      <section>
        <h2>2. Zweck und Grundprinzipien</h2>
        <p>Reklaio verarbeitet personenbezogene Daten, um Nutzerkonten, private Fallakten, Dokumente, Fristen, Aufgaben, Schreiben, E-Mail-Versand und die ausdrücklich aktivierten KI-Funktionen bereitzustellen. Wir verarbeiten nur Daten, die für diese Zwecke erforderlich sind, und trennen die Daten der einzelnen Konten technisch voneinander.</p>
        <p>Reklaio ist eine Organisations- und Formulierungshilfe. Es findet keine ausschließlich automatisierte Entscheidung mit rechtlicher oder vergleichbar erheblicher Wirkung statt. KI-Ergebnisse werden nicht automatisch in eine Fallakte übernommen und Schreiben werden nicht ohne Freigabe versendet.</p>
      </section>

      <section>
        <h2>3. Beim Aufruf der Website</h2>
        <p>Beim Aufruf können technisch erforderliche Verbindungsdaten verarbeitet werden, insbesondere IP-Adresse, Zeitpunkt, aufgerufene Adresse, HTTP-Status, Browser- und Geräteinformationen. Die Verarbeitung dient der sicheren Auslieferung, Fehleranalyse und Abwehr von Missbrauch.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im sicheren und stabilen Betrieb des Dienstes. Sicherheits- und Serverprotokolle werden nur so lange aufbewahrt, wie dies für Betrieb, Fehleranalyse und Missbrauchsschutz erforderlich ist.</p>
      </section>

      <section>
        <h2>4. Hosting</h2>
        <p>Die Anwendung und Datenbank werden auf einem von uns verwalteten Server bei {legalOperator.hostingProvider} in {legalOperator.hostingCountry} betrieben. Hochgeladene Dokumente werden in einem geschützten, nicht öffentlich erreichbaren Speicherbereich abgelegt.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO für die Bereitstellung des Dienstes sowie Art. 6 Abs. 1 lit. f DSGVO für einen sicheren und wirtschaftlichen Betrieb. Mit eingesetzten Auftragsverarbeitern werden die erforderlichen Vereinbarungen geschlossen.</p>
      </section>

      <section>
        <h2>5. Nutzerkonto und Anmeldung</h2>
        <p>Für ein Konto verarbeiten wir E-Mail-Adresse, optionalen Anzeigenamen, einen ausschließlich gehasht gespeicherten Passwortwert, Bestätigungsstatus, Kontodatumsangaben und sichere Sitzungstoken. Das Klartextpasswort wird nicht gespeichert.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Sicherheitsdaten werden ergänzend auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO verarbeitet.</p>
      </section>

      <section>
        <h2>6. Fallakten, Dokumente und Kommunikation</h2>
        <p>Nutzer können Falldaten, Chronikeinträge, Aufgaben, Anbieterantworten, Fristen, Schreiben und Dokumente speichern. Diese Inhalte können personenbezogene Daten des Nutzers sowie Daten von Unternehmen, Beschäftigten oder sonstigen Kommunikationspartnern enthalten.</p>
        <p>Die Verarbeitung erfolgt zur Erfüllung des Nutzungsvertrags gemäß Art. 6 Abs. 1 lit. b DSGVO. Nutzer dürfen nur Inhalte hochladen, die für ihren Fall erforderlich sind und die sie rechtmäßig verarbeiten dürfen. Besonders sensible Daten sollten nur gespeichert werden, wenn dies für die Dokumentation wirklich notwendig ist.</p>
      </section>

      <section>
        <h2>7. E-Mail-Versand und Fristerinnerungen</h2>
        <p>Für Bestätigungslinks, Passwort-Wiederherstellung, Fristerinnerungen und den vom Nutzer ausgelösten Versand von Schreiben werden Absender-, Empfänger-, Betreff-, Versand- und technische Zustelldaten verarbeitet. Der E-Mail-Versand erfolgt über den konfigurierten Mailanbieter, derzeit one.com.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Bei Erinnerungen und Sicherheitsnachrichten liegt die Verarbeitung zudem im Interesse einer zuverlässigen und sicheren Dienstbereitstellung.</p>
      </section>

      <section>
        <h2>8. Optionale KI-Dokumentenanalyse und KI-Schreiben</h2>
        <p>KI-Funktionen sind freiwillig und werden nur nach einer gesonderten, eindeutigen Bestätigung für den jeweiligen Vorgang ausgeführt. Bei einer Dokumentenanalyse wird das ausgewählte PDF oder Bild zusammen mit einer technischen Aufgabenbeschreibung an die OpenAI API übermittelt. Bei einem KI-Schreiben werden die vom Nutzer bestätigten Falldaten, die gewählte Schreibenart und ergänzende Anweisungen übermittelt.</p>
        <p>Empfänger ist für Kunden im Europäischen Wirtschaftsraum grundsätzlich OpenAI Ireland Ltd., 1st Floor, The Liffey Trust Centre, 117-126 Sheriff Street Upper, Dublin 1, D01 YC43, Irland, einschließlich der zur Leistungserbringung eingesetzten verbundenen Unternehmen und Unterauftragsverarbeiter.</p>
        <p>Rechtsgrundlage ist die Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO. Soweit ein Dokument besondere Kategorien personenbezogener Daten enthält, stützt sich die vom Nutzer ausdrücklich veranlasste Verarbeitung zusätzlich auf Art. 9 Abs. 2 lit. a DSGVO. Die Einwilligung kann für die Zukunft widerrufen werden; bereits abgeschlossene Verarbeitungsvorgänge bleiben davon unberührt.</p>
        <p>OpenAI verwendet API-Eingaben und -Ausgaben nach den veröffentlichten Bedingungen standardmäßig nicht zum Training der Modelle. API-Inhalte können grundsätzlich für einen begrenzten Zeitraum von bis zu 30 Tagen zur Bereitstellung und Missbrauchserkennung gespeichert werden, soweit keine abweichenden Aufbewahrungseinstellungen vereinbart sind. Für Übermittlungen außerhalb des EWR werden nach Angaben von OpenAI geeignete Garantien wie Standardvertragsklauseln eingesetzt.</p>
        <p>Reklaio speichert das strukturierte Analyseergebnis, das verwendete Modell, den Zeitpunkt, den Zustimmungsvorgang und eine technische Antwortkennung. Das Originaldokument bleibt in der privaten Fallakte. Erkannte Angaben werden erst nach einer separaten Auswahl des Nutzers übernommen. KI-Ausgaben können falsch oder unvollständig sein und müssen geprüft werden.</p>
      </section>

      <section>
        <h2>9. Cookies und lokale Speicherung</h2>
        <p>Reklaio verwendet technisch notwendige Cookies beziehungsweise vergleichbare Speichermechanismen für die Anmeldung, Sitzungsverwaltung und Sicherheitsfunktionen. Es werden derzeit keine Werbe-, Profiling- oder Reichweitenanalyse-Cookies eingesetzt.</p>
        <p>Technisch notwendige Speicherung erfolgt gemäß § 25 Abs. 2 TDDDG sowie Art. 6 Abs. 1 lit. b und lit. f DSGVO.</p>
      </section>

      <section>
        <h2>10. Speicherdauer und Löschung</h2>
        <p>Kontodaten und private Fallinhalte werden grundsätzlich gespeichert, solange das Konto besteht oder der jeweilige Inhalt benötigt wird. Nutzer können Dokumente, Schreiben, Fälle und das gesamte Konto über die vorgesehenen Funktionen löschen. Technische Sicherungen und Protokolle können für einen begrenzten Zeitraum fortbestehen, soweit dies für Wiederherstellung, Sicherheit oder gesetzliche Pflichten erforderlich ist.</p>
        <p>Bei einer Kontolöschung werden die dem Konto zugeordneten aktiven Daten und hochgeladenen Dateien entfernt, soweit keine gesetzliche Aufbewahrungspflicht entgegensteht.</p>
      </section>

      <section>
        <h2>11. Empfänger und Auftragsverarbeiter</h2>
        <ul>
          <li>Hosting- und Infrastruktur-Anbieter für den technischen Betrieb,</li>
          <li>one.com für den E-Mail-Versand,</li>
          <li>OpenAI Ireland Ltd. und eingesetzte Unterauftragsverarbeiter ausschließlich bei freiwillig aktivierten KI-Funktionen,</li>
          <li>Behörden oder sonstige Stellen, soweit eine gesetzliche Verpflichtung besteht.</li>
        </ul>
        <p>Eine Weitergabe zu Werbezwecken oder ein Verkauf personenbezogener Daten findet nicht statt.</p>
      </section>

      <section>
        <h2>12. Rechte betroffener Personen</h2>
        <p>Betroffene Personen haben im Rahmen der gesetzlichen Voraussetzungen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Erteilte Einwilligungen können mit Wirkung für die Zukunft widerrufen werden.</p>
        <p>Anfragen können an <a href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a> gerichtet werden. Zudem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde, insbesondere bei der Landesbeauftragten für Datenschutz und Informationsfreiheit Nordrhein-Westfalen.</p>
      </section>

      <section>
        <h2>13. Sicherheit</h2>
        <p>Wir verwenden technische und organisatorische Maßnahmen, um Daten vor Verlust, unberechtigtem Zugriff und Veränderung zu schützen. Dazu gehören verschlüsselte Übertragung, Zugriffskontrollen, sichere Passwort-Hashes, zufällige Sitzungstoken, Eigentümerprüfungen und private Dateispeicherung. Kein System kann jedoch absolute Sicherheit garantieren.</p>
      </section>

      <section>
        <h2>14. Änderungen</h2>
        <p>Diese Datenschutzerklärung kann angepasst werden, wenn Funktionen, eingesetzte Anbieter oder rechtliche Anforderungen geändert werden. Die jeweils aktuelle Fassung wird mit einem neuen Stand auf dieser Seite veröffentlicht.</p>
      </section>
    </LegalLayout>
  );
}
