import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getAiQuotaSummary } from "@/lib/ai-quota";
import { getBillingAccount, getProPriceLabel, isStripeConfigured } from "@/lib/billing";
import { formatDateTime } from "@/lib/cases";
import { getLocale, localizedPath, type Locale } from "@/lib/i18n";

type PricingPageProps = {
  searchParams: Promise<{ error?: string; checkout?: string }>;
};

function quotaText(used:number,limit:number,unlimited:boolean,locale:Locale){return locale === "en" ? (unlimited ? `${used} used · unlimited` : `${used} of ${limit} used`) : (unlimited?`${used} verwendet · unbegrenzt`:`${used} von ${limit} verwendet`)}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const locale = await getLocale();
  const en = locale === "en";
  const user = await getCurrentUser();
  const messages = await searchParams;
  const billing = user ? await getBillingAccount(user.id) : null;
  const quotas = user ? await getAiQuotaSummary(user) : null;
  const stripeReady = isStripeConfigured();
  const isPro = billing?.planCode === "pro";

  return (
    <main className="pricing-page container">
      <header className="pricing-header">
        <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={localizedPath(user ? "/dashboard" : "/", locale)}>← {en ? "Back" : "Zurück"}</Link>
      </header>

      <section className="pricing-hero">
        <span className="eyebrow">{en ? "Pricing" : "Tarife"}</span>
        <h1>{en ? "Case management stays simple. AI becomes Pro." : "Die Fallakte bleibt einfach. KI wird Pro."}</h1>
        <p>{en ? "All essential tools for organising a consumer case remain free. Reklaio Pro adds optional AI document analysis and individual AI letters with transparent monthly allowances." : "Alle wichtigen Werkzeuge zur Organisation eines Verbraucherfalls bleiben kostenlos. Reklaio Pro erweitert den Dienst um freiwillige KI-Dokumentanalyse und individuelle KI-Schreiben mit transparenten Monatskontingenten."}</p>
      </section>

      {messages.checkout === "success" ? <div className="notice-card pricing-note" role="status"><strong>{en ? "Payment complete." : "Zahlung abgeschlossen."}</strong><span>{en ? "Stripe is sending your subscription status to Reklaio. Refresh the page in a few seconds if Pro is not shown yet." : "Stripe übermittelt den Abostatus gerade an Reklaio. Lade die Seite in wenigen Sekunden erneut, falls Pro noch nicht angezeigt wird."}</span></div> : null}
      {messages.checkout === "cancelled" ? <div className="pricing-note">{en ? "Checkout was cancelled. Your existing plan remains unchanged." : "Der Checkout wurde abgebrochen. Dein bisheriger Tarif bleibt unverändert."}</div> : null}
      {messages.error ? <div className="form-error pricing-note" role="alert">{messages.error}</div> : null}

      <section className="pricing-grid">
        <article className="pricing-card">
          {billing?.planCode === "free" ? <span className="pricing-current">{en ? "Current plan" : "Aktueller Tarif"}</span> : null}
          <span className="eyebrow">{en ? "Free" : "Kostenlos"}</span>
          <h2>Reklaio Free</h2>
          <p>{en ? "For complete organisation and documentation of your cases." : "Für die vollständige Organisation und Dokumentation deiner Fälle."}</p>
          <div className="pricing-price">0 €</div>
          <ul>
            {(en ? ["Case files and timeline","Secure document storage","Deadlines, tasks and reminders","Letter templates","Email with attachments","Case assistant and PDF export"] : ["Fallakten und Chronik","Dokumente sicher speichern","Fristen, Aufgaben und Erinnerungen","Vorlagen für Schreiben","E-Mail-Versand mit Anhängen","Fallassistent und PDF-Export"]).map(item => <li key={item}>{item}</li>)}
          </ul>
          {user ? <Link className="button button-secondary" href={localizedPath("/dashboard", locale)}>{en ? "Continue with Free" : "Free weiter nutzen"}</Link> : <Link className="button button-secondary" href={localizedPath("/registrieren", locale)}>{en ? "Start for free" : "Kostenlos starten"}</Link>}
        </article>

        <article className="pricing-card is-pro">
          {isPro ? <span className="pricing-current">{en ? "Current plan" : "Aktueller Tarif"}</span> : null}
          <span className="eyebrow">{en ? "With AI features" : "Mit KI-Funktionen"}</span>
          <h2>Reklaio Pro</h2>
          <p>{en ? "For users who want to analyse documents faster and prepare individual drafts." : "Für Nutzer, die Dokumente schneller auswerten und individuelle Entwürfe vorbereiten möchten."}</p>
          <div className="pricing-price">{getProPriceLabel()}</div>
          <ul>
            {(en ? ["Everything in Reklaio Free","Monthly allowance for AI document analysis","Monthly allowance for individual AI letters","Review and accept detected values individually","AI log with separate deletion","New premium features as Reklaio evolves"] : ["Alle Funktionen aus Reklaio Free","Monatliches Kontingent für KI-Dokumentanalysen","Monatliches Kontingent für individuelle KI-Schreiben","Erkannte Werte einzeln prüfen und übernehmen","KI-Protokoll und separate Löschung","Neue Premium-Funktionen während der Weiterentwicklung"]).map(item => <li key={item}>{item}</li>)}
          </ul>

          {isPro ? (
            billing?.subscriptionStatus === "beta" || billing?.subscriptionStatus === "manual" ? (
              <Link className="button button-primary" href={localizedPath("/dashboard", locale)}>{en ? "Pro active" : "Pro aktiv"}</Link>
            ) : billing?.stripeCustomerId ? (
              <form action="/api/billing/portal" method="post"><button className="button button-primary" type="submit">{en ? "Manage subscription" : "Abo verwalten"}</button></form>
            ) : (
              <Link className="button button-primary" href={localizedPath("/dashboard", locale)}>{en ? "Pro active" : "Pro aktiv"}</Link>
            )
          ) : !user ? (
            <Link className="button button-primary" href={localizedPath("/registrieren", locale)}>{en ? "Create account" : "Konto erstellen"}</Link>
          ) : stripeReady ? (
            <Link className="button button-primary" href={localizedPath("/preise/checkout", locale)}>{en ? "Order Pro" : "Pro verbindlich bestellen"}</Link>
          ) : (
            <span className="button button-secondary" aria-disabled="true">{en ? "Checkout is being prepared" : "Checkout wird eingerichtet"}</span>
          )}
        </article>
      </section>

      {billing ? (
        <div className="pricing-note">
          <strong>{en ? "Account status:" : "Kontostatus:"}</strong> {billing.planCode === "pro" ? "Pro" : "Free"}
          {billing.subscriptionStatus ? ` · ${billing.subscriptionStatus}` : ""}
          {billing.currentPeriodEnd ? ` · ${en ? "Period ends" : "Zeitraum bis"} ${formatDateTime(billing.currentPeriodEnd)}` : ""}
          {billing.cancelAtPeriodEnd ? (en ? " · Cancellation scheduled for the end of the period" : " · Kündigung zum Periodenende vorgemerkt") : ""}
          {quotas && billing.planCode === "pro" ? <><br/>{en ? "Document analyses" : "Dokumentanalysen"}: {quotaText(quotas.documentAnalysis.used,quotas.documentAnalysis.limit,quotas.documentAnalysis.unlimited,locale)} · {en ? "AI letters" : "KI-Schreiben"}: {quotaText(quotas.letterDraft.used,quotas.letterDraft.limit,quotas.letterDraft.unlimited,locale)}</> : null}
        </div>
      ) : (
        <div className="pricing-note">{en ? "Billing takes place on a Stripe-hosted checkout page. Payment details are not stored in Reklaio." : "Die Abrechnung erfolgt über eine von Stripe gehostete Checkout-Seite. Zahlungsdaten werden nicht in Reklaio gespeichert."}</div>
      )}
    </main>
  );
}
