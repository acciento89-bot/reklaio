import Link from "next/link";
import { LegalLayout } from "@/components/legal-layout";
import { LEGAL_VERSION, legalAddressLines, legalOperator } from "@/lib/legal";

export default function ImprintPage() {
  return (
    <LegalLayout eyebrow="Rechtliche Angaben" title="Impressum" updated={LEGAL_VERSION}>
      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <div className="legal-address">
          {legalAddressLines().map((line) => <span key={line}>{line}</span>)}
        </div>
        <p className="legal-note">„Kamilunavo“ ist die verwendete Geschäftsbezeichnung. Diensteanbieter und verantwortlich für Reklaio ist die oben genannte natürliche Person.</p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>E-Mail: <a href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a></p>
        <p>Elektronisches Kontaktformular: <Link href="/kontakt">Kontaktformular öffnen</Link></p>
        {legalOperator.phone ? <p>Telefon: {legalOperator.phone}</p> : null}
        <p>Über das Kontaktformular ist eine direkte elektronische Nachricht möglich. Die Antwort erfolgt an die dort angegebene E-Mail-Adresse.</p>
      </section>

      {legalOperator.vatId || legalOperator.registerNumber ? (
        <section>
          <h2>Register- und Steuerangaben</h2>
          {legalOperator.registerNumber ? <p>{legalOperator.registerName || "Register"}: {legalOperator.registerNumber}</p> : null}
          {legalOperator.vatId ? <p>Umsatzsteuer-Identifikationsnummer: {legalOperator.vatId}</p> : null}
        </section>
      ) : null}

      <section>
        <h2>Verantwortlich für Inhalte</h2>
        <p>Soweit für einzelne Inhalte eine verantwortliche Person zu benennen ist: {legalOperator.operatorName}, Anschrift wie oben.</p>
      </section>

      <section>
        <h2>Verbraucherstreitbeilegung</h2>
        <p>Wir sind nicht verpflichtet und derzeit nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </section>

      <section>
        <h2>Hinweis zum Angebot</h2>
        <p>Reklaio unterstützt bei der Organisation, Dokumentation und Formulierung von Verbraucherfällen. Das Angebot ersetzt keine individuelle Rechtsberatung und prüft nicht verbindlich, ob Ansprüche bestehen oder welche rechtlichen Schritte im Einzelfall erforderlich sind.</p>
      </section>
    </LegalLayout>
  );
}
