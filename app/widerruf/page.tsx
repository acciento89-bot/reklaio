import Link from "next/link";
import { LegalLayout } from "@/components/legal-layout";
import { getCurrentUser } from "@/lib/auth";
import { WITHDRAWAL_VERSION } from "@/lib/legal-documents";
import { legalAddressLines, legalOperator } from "@/lib/legal";

type WithdrawalPageProps={searchParams:Promise<{sent?:string;error?:string}>};

export default async function WithdrawalPage({searchParams}:WithdrawalPageProps){
 const user=await getCurrentUser();
 const messages=await searchParams;
 return <LegalLayout eyebrow="Verbraucherinformation" title="Widerrufsbelehrung" updated={WITHDRAWAL_VERSION}>
  {messages.sent==="1"?<div className="notice-card"><strong>Widerruf wurde übermittelt.</strong><span>Eine Eingangsbestätigung wurde an die angegebene E-Mail-Adresse gesendet, soweit der Mailversand erfolgreich war.</span></div>:null}
  {messages.error?<div className="form-error" role="alert">{messages.error}</div>:null}
  <section><h2>Widerrufsrecht</h2><p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p></section>
  <section><h2>Ausübung des Widerrufs</h2><p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen Erklärung über Ihren Entschluss informieren:</p><div className="legal-address">{legalAddressLines().map(line=><span key={line}>{line}</span>)}<span>E-Mail: {legalOperator.email}</span></div><p>Sie können dafür das unten stehende Online-Formular oder das Muster-Widerrufsformular verwenden. Beides ist nicht vorgeschrieben.</p><p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung vor Ablauf der Frist absenden.</p></section>
  <section><h2>Folgen des Widerrufs</h2><p>Wenn Sie diesen Vertrag widerrufen, erstatten wir alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab Eingang des Widerrufs. Für die Rückzahlung verwenden wir grundsätzlich dasselbe Zahlungsmittel, sofern nichts anderes vereinbart wurde.</p><p>Haben Sie ausdrücklich verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, kann für die bis zum Widerruf erbrachte Leistung ein angemessener anteiliger Betrag geschuldet sein, soweit die gesetzlichen Voraussetzungen erfüllt sind.</p></section>
  <section><h2>Widerruf online übermitteln</h2><p>Bitte keine Passwörter, API-Schlüssel oder vollständigen Zahlungsdaten eintragen.</p><form className="withdrawal-form" action="/api/withdrawal" method="post">
   <label className="field">Name<input name="name" type="text" maxLength={120} defaultValue={user?.displayName??""} required autoComplete="name"/></label>
   <label className="field">E-Mail des Reklaio-Kontos<input name="email" type="email" maxLength={254} defaultValue={user?.email??""} required autoComplete="email"/></label>
   <label className="field">Vertrags-/Stripe-Referenz <span>(optional)</span><input name="contractReference" type="text" maxLength={240}/></label>
   <label className="field">Erklärung<textarea name="declaration" rows={6} minLength={20} maxLength={3000} defaultValue="Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über Reklaio Pro." required/></label>
   <label className="contact-honeypot" aria-hidden="true">Website<input name="website" type="text" tabIndex={-1} autoComplete="off"/></label>
   <label className="auth-consent-row"><input name="confirm" type="checkbox" required/><span>Ich bestätige, dass ich diese Erklärung absenden möchte und habe die <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link> gelesen.</span></label>
   <button className="button button-primary" type="submit">Widerruf verbindlich absenden</button>
  </form></section>
  <section><h2>Muster-Widerrufsformular</h2><p>An {legalOperator.businessName}, {legalOperator.street}, {legalOperator.postalCity}, E-Mail {legalOperator.email}</p><p>Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über Reklaio Pro.</p><ul><li>Bestellt am</li><li>Name</li><li>Anschrift</li><li>E-Mail des Reklaio-Kontos</li><li>Datum</li><li>Unterschrift, nur bei Mitteilung auf Papier</li></ul></section>
 </LegalLayout>
}
