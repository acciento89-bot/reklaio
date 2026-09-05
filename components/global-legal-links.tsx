import Link from "next/link";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { localizedPath, type Locale } from "@/lib/i18n-shared";

export function GlobalLegalLinks({ locale }: { locale: Locale }) {
  return (
    <nav className="global-legal-links" aria-label={locale === "en" ? "Legal information" : "Rechtliche Informationen"}>
      <Link href={localizedPath("/kontakt", locale)}>{locale === "en" ? "Contact" : "Kontakt"}</Link>
      <Link href={localizedPath("/preise", locale)}>{locale === "en" ? "Pricing" : "Preise"}</Link>
      <Link href={localizedPath("/impressum", locale)}>{locale === "en" ? "Legal notice" : "Impressum"}</Link>
      <Link href={localizedPath("/datenschutz", locale)}>{locale === "en" ? "Privacy" : "Datenschutz"}</Link>
      <CookieSettingsButton locale={locale} />
      <Link href={localizedPath("/agb", locale)}>{locale === "en" ? "Terms" : "AGB"}</Link>
      <Link href={localizedPath("/widerruf", locale)}>{locale === "en" ? "Withdrawal" : "Widerruf"}</Link>
      <Link href={localizedPath("/hilfe", locale)}>{locale === "en" ? "Help" : "Hilfe"}</Link>
    </nav>
  );
}
