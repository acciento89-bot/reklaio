import Link from "next/link";
import { CookieSettingsButton } from "@/components/cookie-settings-button";

export function GlobalLegalLinks() {
  return (
    <nav className="global-legal-links" aria-label="Rechtliche Informationen">
      <Link href="/kontakt">Kontakt</Link>
      <Link href="/preise">Preise</Link>
      <Link href="/impressum">Impressum</Link>
      <Link href="/datenschutz">Datenschutz</Link>
      <CookieSettingsButton />
      <Link href="/agb">AGB</Link>
      <Link href="/widerruf">Widerruf</Link>
      <Link href="/hilfe">Hilfe</Link>
    </nav>
  );
}
