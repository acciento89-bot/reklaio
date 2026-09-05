"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n-shared";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function changeLocale(nextLocale: Locale) {
    document.cookie = `reklaio_locale=${nextLocale}; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    const unprefixed = pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
    const nextPath = nextLocale === "en" ? (unprefixed === "/" ? "/en" : `/en${unprefixed}`) : unprefixed;
    const query = searchParams.toString();
    window.location.assign(query ? `${nextPath}?${query}` : nextPath);
  }

  return (
    <div className="language-switcher" role="group" aria-label={locale === "en" ? "Language" : "Sprache"}>
      <button type="button" className={locale === "de" ? "active" : undefined} aria-pressed={locale === "de"} onClick={() => changeLocale("de")}>DE</button>
      <span aria-hidden="true">|</span>
      <button type="button" className={locale === "en" ? "active" : undefined} aria-pressed={locale === "en"} onClick={() => changeLocale("en")}>EN</button>
    </div>
  );
}
