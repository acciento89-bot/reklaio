"use client";

import type { Locale } from "@/lib/i18n-shared";

export function CookieSettingsButton({ locale }: { locale: Locale }) {
  return (
    <button
      className="global-legal-button"
      type="button"
      onClick={() => window.dispatchEvent(new Event("reklaio:open-cookie-settings"))}
    >
      {locale === "en" ? "Cookie settings" : "Cookie-Einstellungen"}
    </button>
  );
}
