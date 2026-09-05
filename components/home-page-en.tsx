import Image from "next/image";
import Link from "next/link";
import { caseTypesEn } from "@/lib/case-types";
import { CaseTypeIcon } from "@/components/case-type-icon";

const APP_STORE_URL = "https://apps.apple.com/de/app/reklaio/id6799375798";

export function HomePageEn({ authenticated }: { authenticated: boolean }) {
  return (
    <main className="marketing-page">
      <header className="site-header container">
        <Link className="brand" href="/en" aria-label="Reklaio home"><span className="brand-mark">R</span><span className="brand-copy"><strong>Reklaio</strong><small>by Kamilunavo</small></span></Link>
        <nav className="header-actions" aria-label="Main navigation">
          <Link className="text-link" href="#case-types">Case types</Link>
          <Link className="text-link" href="#how-it-works">How it works</Link>
          <Link className="text-link" href="/en/preise">Pricing</Link>
          <Link className="text-link" href="/en/kontakt">Contact</Link>
          {authenticated ? <Link className="button button-primary" href="/en/dashboard">Dashboard</Link> : <><Link className="text-link" href="/en/anmelden">Sign in</Link><Link className="button button-primary" href="/en/registrieren">Start for free</Link></>}
        </nav>
      </header>

      <section className="brand-banner container" aria-label="Reklaio brand banner">
        <Image src="/reklaio-banner.svg" alt="Reklaio – Your case. Your deadline. Your overview." width={2048} height={682} priority />
      </section>

      <section className="hero hero-brand-copy container">
        <div className="hero-content">
          <div className="eyebrow">Create a complaint letter with AI</div>
          <h1>Your complaint. <span>Professionally written.</span></h1>
          <p className="hero-copy">Describe what happened and Reklaio helps you prepare a suitable complaint letter. Keep evidence, communication and deadlines organised in one clear case file.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href={authenticated ? "/en/neuer-fall" : "/en/registrieren"}>Create a complaint for free</Link>
            <a href={APP_STORE_URL} target="_blank" rel="noreferrer" aria-label="Download Reklaio on the App Store" style={{ display: "inline-block", lineHeight: 0 }}>
              <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83" alt="Download on the App Store" width="170" height="56" style={{ display: "block", width: "170px", height: "auto" }} />
            </a>
            <Link className="button button-secondary" href="/en/preise">Compare Free and Pro</Link>
          </div>
          {!authenticated && <p className="hero-copy" style={{ marginTop: "0.8rem", fontSize: "0.95rem" }}>Start for free · no credit card required</p>}
          <div className="trust-row" aria-label="Benefits"><span>AI-assisted letters</span><span>Protected documents</span><span>Automatic deadline reminders</span><span>No legal advice</span></div>
        </div>
      </section>

      <section className="professional-strip"><div className="container professional-strip-grid">
        <div><strong>One case file</strong><span>Everything in one place</span></div><div><strong>Clear timeline</strong><span>Track promises and events</span></div><div><strong>Case assistant</strong><span>See what is missing and what comes next</span></div><div><strong>Free + Pro</strong><span>Core tools are free, AI is optional with Pro</span></div>
      </div></section>

      <section className="container section" id="case-types">
        <div className="section-heading professional-section-heading"><div><span className="eyebrow">Common consumer cases</span><h2>Start with the right structure</h2></div><p>Each case type guides you through the relevant details and shows which evidence can help.</p></div>
        <div className="case-grid professional-case-grid">
          {caseTypesEn.map((item) => <article className="case-card professional-case-card" key={item.slug}><div className="case-icon" aria-hidden="true"><CaseTypeIcon type={item.dbValue} /></div><div className="case-card-copy"><h3>{item.title}</h3><p>{item.description}</p></div><ul>{item.checklist.slice(0, 2).map(entry => <li key={entry}>{entry}</li>)}</ul><Link href={authenticated ? `/en/neuer-fall?typ=${item.slug}` : "/en/registrieren"}>Select case type <span>→</span></Link></article>)}
        </div>
      </section>

      <section className="container section workflow-section" id="how-it-works">
        <div className="section-heading professional-section-heading"><div><span className="eyebrow">A transparent process</span><h2>From the problem to your next step</h2></div><p>Reklaio does not replace legal advice. It keeps your information complete, organised and available on time.</p></div>
        <div className="workflow professional-workflow">
          {[["01","Create a case","Choose the situation and record the key details."],["02","Collect evidence","Store invoices, emails, photos and other documents securely."],["03","Track deadlines","See open dates in one place and receive automatic reminders."],["04","See the next step","The case assistant checks completeness and prioritises the appropriate action."]].map(([number,title,text]) => <div className="workflow-step" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}
        </div>
      </section>

      <section className="container section home-faq-section" aria-labelledby="home-faq-title">
        <div className="section-heading professional-section-heading"><div><span className="eyebrow">Frequently asked questions</span><h2 id="home-faq-title">What Reklaio does for you</h2></div><p>Clear answers about pricing, privacy and the difference between organisation and legal advice.</p></div>
        <div className="home-faq">
          <details><summary>Can I use Reklaio for free?</summary><p>Yes. Case files, evidence, deadlines, tasks, templates, email, the case assistant and PDF export are included with Free. Optional AI features require Reklaio Pro.</p></details>
          <details><summary>Does Reklaio create complaint letters?</summary><p>Reklaio provides proven templates and, with Pro, can prepare an individual draft from the case details you confirm. You review and send every letter yourself.</p></details>
          <details><summary>Is Reklaio legal advice?</summary><p>No. Reklaio organises information and helps with clear wording, but it does not make a binding assessment of your claim or the legal action required in an individual case.</p></details>
          <details><summary>Where are my documents stored?</summary><p>Your private case files and documents are stored on Reklaio infrastructure in Germany and are not publicly accessible.</p></details>
        </div>
      </section>

      <section className="container closing-cta"><div><span className="eyebrow">Ready to make your complaint?</span><h2>Describe the problem, prepare your letter and keep the entire case organised.</h2></div><div className="hero-actions"><Link className="button button-primary" href={authenticated ? "/en/neuer-fall" : "/en/registrieren"}>Create a complaint for free</Link><Link className="button button-secondary" href="/en/preise">View pricing</Link></div></section>
      <footer className="container footer"><Link className="brand" href="/en"><span className="brand-mark">R</span><span className="brand-copy"><strong>Reklaio</strong><small>by Kamilunavo</small></span></Link><p>Digital organisation for consumer cases · No legal advice.</p></footer>
    </main>
  );
}
