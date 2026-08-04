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
        <p>Reklaio verarbeitet personenbezogene Daten, um Nutzerkonten, private Fallakten, Dokumente, Fristen, Aufgaben, Schreiben, E-Mail-Versand, Kontaktanfragen, Abonnements und die ausdrücklich aktivierten KI-Funktionen bereitzustellen.</p>
        <p>Reklaio ist eine Organisations- und Formulierungshilfe. Es findet keine ausschließlich automatisierte Entscheidung mit rechtlicher oder vergleichbar erheblicher Wirkung statt. KI-Ergebnisse werden nicht automatisch in eine Fallakte übernommen und Schreiben werden nicht ohne Freigabe versendet.</p>
      </section>

      <section>
        <h2>3. Beim Aufruf der Website</h2>
        <p>Beim Aufruf können technisch erforderliche Verbindungsdaten verarbeitet werden, insbesondere IP-Adresse, Zeitpunkt, aufgerufene Adresse, HTTP-Status, Browser- und Geräteinformationen. Die Verarbeitung dient der sicheren Auslieferung, Fehleranalyse und Abwehr von Missbrauch.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im sicheren und stabilen Betrieb des Dienstes.</p>
      </section>

      <section>
        <h2>4. Hosting</h2>
        <p>Die Anwendung und Datenbank werden auf einem von uns verwalteten Server bei {legalOperator.hostingProvider} in {legalOperator.hostingCountry} betrieben. Hochgeladene Dokumente werden in einem geschützten, nicht öffentlich erreichbaren Speicherbereich abgelegt.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO für die Bereitstellung des Dienstes sowie Art. 6 Abs. 1 lit. f DSGVO für einen sicheren und wirtschaftlichen Betrieb.</p>
      </section>

      <section>
        <h2>5. Nutzerkonto und Anmeldung</h2>
        <p>Für ein Konto verarbeiten wir E-Mail-Adresse, optionalen Anzeigenamen, einen ausschließlich gehasht gespeicherten Passwortwert, Bestätigungsstatus, Tarifstatus, Kontodatumsangaben und sichere Sitzungstoken. Das Klartextpasswort wird nicht gespeichert.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Sicherheitsdaten werden ergänzend auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO verarbeitet.</p>
      </section>

      <section>
        <h2>6. Fallakten, Dokumente und Kommunikation</h2>
        <p>Nutzer können Falldaten, Chronikeinträge, Aufgaben, Anbieterantworten, Fristen, Schreiben und Dokumente speichern. Diese Inhalte können personenbezogene Daten des Nutzers sowie Daten von Unternehmen, Beschäftigten oder sonstigen Kommunikationspartnern enthalten.</p>
        <p>Die Verarbeitung erfolgt zur Erfüllung des Nutzungsvertrags gemäß Art. 6 Abs. 1 lit. b DSGVO. Nutzer dürfen nur Inhalte hochladen, die sie rechtmäßig verarbeiten dürfen.</p>
      </section>

      <section>
        <h2>7. E-Mail-Versand und Fristerinnerungen</h2>
        <p>Für Bestätigungslinks, Passwort-Wiederherstellung, Fristerinnerungen und den vom Nutzer ausgelösten Versand von Schreiben werden Absender-, Empfänger-, Betreff-, Versand- und technische Zustelldaten verarbeitet. Der E-Mail-Versand erfolgt über den konfigurierten Mailanbieter, derzeit one.com.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Bei Erinnerungen und Sicherheitsnachrichten liegt die Verarbeitung zudem im Interesse einer zuverlässigen und sicheren Dienstbereitstellung.</p>
      </section>

      <section>
        <h2>8. Kontaktformular</h2>
        <p>Bei Nutzung des Kontaktformulars verarbeiten wir Name, E-Mail-Adresse, ausgewähltes Thema, Nachricht, Zeitpunkt, optional die Zuordnung zu einem angemeldeten Konto sowie einen technisch pseudonymisierten Hash der IP-Adresse zur Missbrauchsbegrenzung.</p>
        <p>Die Daten werden zur Bearbeitung der Anfrage verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO bei vertragsbezogenen Anfragen und im Übrigen Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in der Beantwortung von Anfragen und der Abwehr automatisierten Missbrauchs.</p>
        <p>Kontaktanfragen werden gelöscht, sobald sie für die Bearbeitung und etwaige Nachweiszwecke nicht mehr erforderlich sind, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>
      </section>

      <section>
        <h2>9. Reklaio Pro und Stripe</h2>
        <p>Für kostenpflichtige Reklaio-Pro-Abonnements wird Stripe als Zahlungs- und Abrechnungsdienst eingesetzt. Reklaio übermittelt an Stripe insbesondere Konto-E-Mail, eine interne Nutzerkennung, den ausgewählten Preis und technische Checkoutdaten. Stripe verarbeitet Zahlungsdaten, Rechnungsanschrift, Zahlungsmittel, Steuer- und Transaktionsdaten in eigener Verantwortung beziehungsweise im Rahmen der vereinbarten Rollen.</p>
        <p>Reklaio speichert keine vollständigen Kartendaten. Gespeichert werden Stripe-Kunden- und Abonnementkennungen, Abonnementstatus, Laufzeitende und Kündigungsstatus, damit Premiumfunktionen bereitgestellt oder entzogen werden können.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO zur Vertragsdurchführung sowie Art. 6 Abs. 1 lit. c DSGVO für gesetzliche Abrechnungs- und Aufbewahrungspflichten. Empfänger ist Stripe Payments Europe, Limited, 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland, einschließlich eingesetzter verbundener Unternehmen und Unterauftragsverarbeiter.</p>
      </section>

      <section>
        <h2>10. Optionale KI-Dokumentenanalyse und KI-Schreiben</h2>
        <p>KI-Funktionen gehören zum Pro-Tarif, bleiben aber auch dort freiwillig und werden nur nach einer gesonderten, eindeutigen Bestätigung für den jeweiligen Vorgang ausgeführt. Bei einer Dokumentenanalyse wird das ausgewählte PDF oder Bild zusammen mit einer technischen Aufgabenbeschreibung an die OpenAI API übermittelt. Bei einem KI-Schreiben werden die vom Nutzer bestätigten Falldaten, die gewählte Schreibenart und ergänzende Anweisungen übermittelt.</p>
        <p>Empfänger ist für Kunden im Europäischen Wirtschaftsraum grundsätzlich OpenAI Ireland Ltd., 1st Floor, The Liffey Trust Centre, 117-126 Sheriff Street Upper, Dublin 1, D01 YC43, Irland, einschließlich der zur Leistungserbringung eingesetzten verbundenen Unternehmen und Unterauftragsverarbeiter.</p>
        <p>Rechtsgrundlage ist die Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO. Soweit ein Dokument besondere Kategorien personenbezogener Daten enthält, stützt sich die vom Nutzer ausdrücklich veranlasste Verarbeitung zusätzlich auf Art. 9 Abs. 2 lit. a DSGVO.</p>
        <p>OpenAI verwendet API-Eingaben und -Ausgaben nach den veröffentlichten Bedingungen standardmäßig nicht zum Training der Modelle. API-Inhalte können abhängig von den vereinbarten Datenkontrollen technisch begrenzt gespeichert werden. Reklaio fordert Antworten mit deaktivierter Anwendungsspeicherung an, soweit die verwendete Schnittstelle dies unterstützt.</p>
        <p>Reklaio speichert das strukturierte Analyseergebnis, das verwendete Modell, den Zeitpunkt, den Zustimmungsvorgang und eine technische Antwortkennung. Erkannte Angaben werden erst nach einer separaten Auswahl des Nutzers übernommen. KI-Ausgaben können falsch oder unvollständig sein und müssen geprüft werden.</p>
      </section>

      <section>
        <h2>11. Cookies und lokale Speicherung</h2>
        <p>Reklaio verwendet technisch notwendige Cookies beziehungsweise vergleichbare Speichermechanismen für Anmeldung, Sitzungsverwaltung und Sicherheitsfunktionen. Es werden derzeit keine Werbe-, Profiling- oder Reichweitenanalyse-Cookies eingesetzt.</p>
        <p>Technisch notwendige Speicherung erfolgt gemäß § 25 Abs. 2 TDDDG sowie Art. 6 Abs. 1 lit. b und lit. f DSGVO.</p>
      </section>

      <section>
        <h2>12. Speicherdauer und Löschung</h2>
        <p>Kontodaten und private Fallinhalte werden grundsätzlich gespeichert, solange das Konto besteht oder der jeweilige Inhalt benötigt wird. Nutzer können Dokumente, Schreiben, KI-Analyseergebnisse, Fälle und das gesamte Konto über die vorgesehenen Funktionen löschen.</p>
        <p>Abrechnungsdaten können aufgrund gesetzlicher Aufbewahrungspflichten länger gespeichert werden. Stripe-Daten unterliegen zusätzlich den Aufbewahrungsregeln von Stripe.</p>
      </section>

      <section>
        <h2>13. Empfänger und Auftragsverarbeiter</h2>
        <ul>
          <li>Hosting- und Infrastruktur-Anbieter für den technischen Betrieb,</li>
          <li>one.com für den E-Mail-Versand,</li>
          <li>Stripe für Checkout, Zahlungsabwicklung, Abonnementverwaltung und Rechnungen,</li>
          <li>OpenAI Ireland Ltd. und eingesetzte Unterauftragsverarbeiter ausschließlich bei freiwillig aktivierten KI-Funktionen,</li>
          <li>Behörden oder sonstige Stellen, soweit eine gesetzliche Verpflichtung besteht.</li>
        </ul>
        <p>Eine Weitergabe zu Werbezwecken oder ein Verkauf personenbezogener Daten findet nicht statt.</p>
      </section>

      <section>
        <h2>14. Rechte betroffener Personen</h2>
        <p>Betroffene Personen haben im Rahmen der gesetzlichen Voraussetzungen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Erteilte Einwilligungen können mit Wirkung für die Zukunft widerrufen werden.</p>
        <p>Anfragen können an <a href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a> oder über das <a href="/kontakt">Kontaktformular</a> gerichtet werden. Zudem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.</p>
      </section>

      <section>
        <h2>15. Sicherheit</h2>
        <p>Wir verwenden technische und organisatorische Maßnahmen, um Daten vor Verlust, unberechtigtem Zugriff und Veränderung zu schützen. Dazu gehören verschlüsselte Übertragung, Zugriffskontrollen, sichere Passwort-Hashes, zufällige Sitzungstoken, Eigentümerprüfungen, private Dateispeicherung und signaturgeprüfte Stripe-Webhooks.</p>
      </section>

      <section>
        <h2>16. Änderungen</h2>
        <p>Diese Datenschutzerklärung kann angepasst werden, wenn Funktionen, eingesetzte Anbieter oder rechtliche Anforderungen geändert werden. Die jeweils aktuelle Fassung wird mit einem neuen Stand auf dieser Seite veröffentlicht.</p>
      </section>
    </LegalLayout>
  );
}
