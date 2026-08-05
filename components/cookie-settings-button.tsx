"use client";

export function CookieSettingsButton() {
  return (
    <button
      className="global-legal-button"
      type="button"
      onClick={() => window.dispatchEvent(new Event("reklaio:open-cookie-settings"))}
    >
      Cookie-Einstellungen
    </button>
  );
}
