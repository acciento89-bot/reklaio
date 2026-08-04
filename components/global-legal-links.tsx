import Link from "next/link";

export function GlobalLegalLinks() {
  return (
    <nav className="global-legal-links" aria-label="Rechtliche Informationen">
      <Link href="/kontakt">Kontakt</Link>
      <Link href="/preise">Preise</Link>
      <Link href="/impressum">Impressum</Link>
      <Link href="/datenschutz">Datenschutz</Link>
      <Link href="/nutzungsbedingungen">Nutzungsbedingungen</Link>
      <Link href="/hilfe">Hilfe</Link>
    </nav>
  );
}
