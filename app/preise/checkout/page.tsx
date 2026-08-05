import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getBillingAccount, getProBillingIntervalLabel, getProPriceLabel, hasManagedSubscription, isStripeConfigured } from "@/lib/billing";
import { AGB_VERSION, PRIVACY_VERSION, WITHDRAWAL_VERSION, getPaidContractSummary } from "@/lib/legal-documents";

type CheckoutPageProps={searchParams:Promise<{error?:string}>};

export default async function ProCheckoutPage({searchParams}:CheckoutPageProps){
 const user=await requireUser();
 const messages=await searchParams;
 const billing=await getBillingAccount(user.id);
 if(billing.planCode==="pro"||hasManagedSubscription(billing))redirect("/preise");
 const configured=isStripeConfigured();
 const summary=getPaidContractSummary();
 return <main className="checkout-page container">
  <header className="checkout-header"><Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link><Link className="text-link" href="/preise">← Tarife</Link></header>
  <section className="checkout-hero"><span className="eyebrow">Bestellübersicht</span><h1>Reklaio Pro verbindlich bestellen</h1><p>Prüfe Leistung, Preis, Verlängerung und Widerrufsangaben, bevor du zum sicheren Stripe-Checkout wechselst.</p></section>
  {messages.error?<div className="form-error checkout-message" role="alert">{messages.error}</div>:null}
  <div className="checkout-grid">
   <section className="checkout-card checkout-order-summary">
    <span className="eyebrow">Deine Bestellung</span><h2>Reklaio Pro</h2>
    <dl><div><dt>Leistung</dt><dd>Alle Free-Funktionen plus KI-Dokumentanalyse und individuelle KI-Schreiben innerhalb der angezeigten Kontingente.</dd></div><div><dt>Gesamtpreis</dt><dd><strong>{getProPriceLabel()}</strong></dd></div><div><dt>Abrechnung</dt><dd>{getProBillingIntervalLabel()}</dd></div><div><dt>Mindestlaufzeit</dt><dd>{summary.minimumTerm}</dd></div><div><dt>Verlängerung</dt><dd>Automatisch um einen weiteren Abrechnungszeitraum.</dd></div><div><dt>Kündigung</dt><dd>{summary.cancellation}</dd></div><div><dt>Zahlungsanbieter</dt><dd>Stripe; verfügbare Zahlungsmittel werden dort vor Abschluss angezeigt.</dd></div></dl>
    <p className="checkout-tax-note">{summary.taxNotice}</p>
   </section>
   <section className="checkout-card checkout-consent-card">
    <span className="eyebrow">Bestätigung</span><h2>Vertragliche Angaben</h2>
    <form className="checkout-consent-form" action="/api/billing/checkout" method="post">
     <input type="hidden" name="termsVersion" value={AGB_VERSION}/><input type="hidden" name="privacyVersion" value={PRIVACY_VERSION}/><input type="hidden" name="withdrawalVersion" value={WITHDRAWAL_VERSION}/>
     <label className="checkout-check"><input name="acceptTerms" type="checkbox" required/><span>Ich akzeptiere die <Link href="/agb" target="_blank">AGB</Link> in der Version {AGB_VERSION}.</span></label>
     <label className="checkout-check"><input name="acknowledgePrivacy" type="checkbox" required/><span>Ich habe die <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link> gelesen.</span></label>
     <label className="checkout-check"><input name="acknowledgeWithdrawal" type="checkbox" required/><span>Ich habe die <Link href="/widerruf" target="_blank">Widerrufsbelehrung und das Muster-Widerrufsformular</Link> erhalten und zur Kenntnis genommen.</span></label>
     <label className="checkout-check"><input name="immediateStart" type="checkbox" required/><span>Ich verlange ausdrücklich, dass Reklaio Pro bereits vor Ablauf der 14-tägigen Widerrufsfrist bereitgestellt wird. Mir ist bekannt, dass bei einem Widerruf für die bis dahin erbrachte Leistung ein angemessener anteiliger Betrag anfallen kann, soweit die gesetzlichen Voraussetzungen erfüllt sind.</span></label>
     <div className="checkout-final-summary"><strong>{getProPriceLabel()}</strong><span>{getProBillingIntervalLabel()} · automatische Verlängerung · Kündigung zum Periodenende</span></div>
     <button className="button button-primary checkout-pay-button" type="submit" disabled={!configured}>Zahlungspflichtig abonnieren</button>
     {!configured?<p className="checkout-disabled">Stripe ist noch nicht vollständig eingerichtet. Die Bestellung kann noch nicht abgesendet werden.</p>:null}
     <p className="checkout-provider-note">Nach dem Klick wechselst du zur verschlüsselten Stripe-Seite, um das Zahlungsmittel auszuwählen und die Zahlung abzuschließen.</p>
    </form>
   </section>
  </div>
 </main>
}
