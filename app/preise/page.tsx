import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getBillingAccount, getProPriceLabel, isStripeConfigured } from "@/lib/billing";
import { formatDateTime } from "@/lib/cases";

export default async function PricingPage() {
  const user = await getCurrentUser();
  const billing = user ? await getBillingAccount(user.id) : null;
  const stripeReady = isStripeConfigured();
  const isPro = billing?.planCode === "pro";

  return (
    <main className="pricing-page container">
      <header className="pricing-header">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={user ? "/dashboard" : "/"}>← Zurück</Link>
      </header>

      <section className="pricing-hero">
        <span className="eyebrow">Tarife</span>
        <h1>Die Fallakte bleibt einfach. KI wird Pro.</h1>
        <p>Alle wichtigen Werkzeuge zur Organisation eines Verbraucherfalls bleiben im kostenlosen Tarif. Reklaio Pro erweitert den Dienst um freiwillige KI-Dokumentanalyse und individuelle KI-Schreiben.</p>
      </section>

      <section className="pricing-grid">
        <article className="pricing-card">
          {billing?.planCode === "free" ? <span className="pricing-current">Aktueller Tarif</span> : null}
          <span className="eyebrow">Kostenlos</span>
          <h2>Reklaio Free</h2>
          <p>Für die vollständige Organisation und Dokumentation deiner Fälle.</p>
          <div className="pricing-price">0 €</div>
          <ul>
            <li>Fallakten und Chronik</li>
            <li>Dokumente sicher speichern</li>
            <li>Fristen, Aufgaben und Erinnerungen</li>
            <li>Vorlagen für Schreiben</li>
            <li>E-Mail-Versand mit Anhängen</li>
            <li>Fallassistent und PDF-Export</li>
          </ul>
          {user ? <Link className="button button-secondary" href="/dashboard">Free weiter nutzen</Link> : <Link className="button button-secondary" href="/registrieren">Kostenlos starten</Link>}
        </article>

        <article className="pricing-card is-pro">
          {isPro ? <span className="pricing-current">Aktueller Tarif</span> : null}
          <span className="eyebrow">Mit KI-Funktionen</span>
          <h2>Reklaio Pro</h2>
          <p>Für Nutzer, die Dokumente schneller auswerten und individuelle Entwürfe vorbereiten möchten.</p>
          <div className="pricing-price">{getProPriceLabel()}</div>
          <ul>
            <li>Alle Funktionen aus Reklaio Free</li>
            <li>KI-Analyse von PDF- und Bilddokumenten</li>
            <li>Erkannte Werte einzeln prüfen und übernehmen</li>
            <li>Individuelle Mahn- und Aufforderungsentwürfe</li>
            <li>KI-Protokoll und separate Löschung</li>
            <li>Neue Premium-Funktionen während der Weiterentwicklung</li>
          </ul>

          {isPro ? (
            billing?.subscriptionStatus === "beta" ? (
              <Link className="button button-primary" href="/dashboard">Beta-Pro aktiv</Link>
            ) : billing?.stripeCustomerId ? (
              <form action="/api/billing/portal" method="post"><button className="button button-primary" type="submit">Abo verwalten</button></form>
            ) : (
              <Link className="button button-primary" href="/dashboard">Pro aktiv</Link>
            )
          ) : !user ? (
            <Link className="button button-primary" href="/registrieren">Konto erstellen</Link>
          ) : stripeReady ? (
            <form action="/api/billing/checkout" method="post"><button className="button button-primary" type="submit">Reklaio Pro abonnieren</button></form>
          ) : (
            <span className="button button-secondary" aria-disabled="true">Checkout wird eingerichtet</span>
          )}
        </article>
      </section>

      {billing ? (
        <div className="pricing-note">
          <strong>Kontostatus:</strong> {billing.planCode === "pro" ? "Pro" : "Free"}
          {billing.subscriptionStatus ? ` · ${billing.subscriptionStatus}` : ""}
          {billing.currentPeriodEnd ? ` · Zeitraum bis ${formatDateTime(billing.currentPeriodEnd)}` : ""}
          {billing.cancelAtPeriodEnd ? " · Kündigung zum Periodenende vorgemerkt" : ""}
        </div>
      ) : (
        <div className="pricing-note">Die Abrechnung erfolgt über eine von Stripe gehostete Checkout-Seite. Zahlungsdaten werden nicht in Reklaio gespeichert.</div>
      )}
    </main>
  );
}
