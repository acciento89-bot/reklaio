"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const CONSENT_STORAGE_KEY = "reklaio-google-consent-v1";
const OPEN_SETTINGS_EVENT = "reklaio:open-cookie-settings";

type ConsentChoice = "accepted" | "rejected";

type TrackingConfig = {
  tagId: string;
  signupConversion: string;
  proConversion: string;
  proValue: number;
  currency: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __reklaioGoogleConfigured?: boolean;
  }
}

let trackingConfigPromise: Promise<TrackingConfig> | null = null;

function emptyConfig(): TrackingConfig {
  return {
    tagId: "",
    signupConversion: "",
    proConversion: "",
    proValue: 9.99,
    currency: "EUR"
  };
}

function getTrackingConfig() {
  if (!trackingConfigPromise) {
    trackingConfigPromise = fetch("/api/tracking/config", {
      cache: "no-store",
      credentials: "same-origin"
    })
      .then(async response => {
        if (!response.ok) return emptyConfig();
        return await response.json() as TrackingConfig;
      })
      .catch(() => emptyConfig());
  }
  return trackingConfigPromise;
}

function getGtag() {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? ((...args: unknown[]) => {
    window.dataLayer?.push(args);
  });
  return window.gtag;
}

function consentState(value: "granted" | "denied") {
  return {
    ad_storage: value,
    analytics_storage: value,
    ad_user_data: value,
    ad_personalization: value
  };
}

function removeKnownGoogleCookies() {
  const names = document.cookie
    .split(";")
    .map(part => part.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name))
    .filter(name => name === "_gid" || name.startsWith("_ga") || name.startsWith("_gcl"));

  const hostParts = window.location.hostname.split(".");
  const rootDomain = hostParts.length > 1 ? `.${hostParts.slice(-2).join(".")}` : undefined;
  const domains = [undefined, window.location.hostname, rootDomain];

  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

function sendConversion(
  sendTo: string,
  marker: string,
  options: { value?: number; currency?: string; transactionId?: string } = {}
) {
  if (!sendTo || !window.gtag || window.localStorage.getItem(marker)) return;

  window.gtag("event", "conversion", {
    send_to: sendTo,
    ...(typeof options.value === "number" ? { value: options.value } : {}),
    ...(options.currency ? { currency: options.currency } : {}),
    ...(options.transactionId ? { transaction_id: options.transactionId } : {})
  });
  window.localStorage.setItem(marker, new Date().toISOString());
}

function trackCurrentConversions(config: TrackingConfig) {
  const params = new URLSearchParams(window.location.search);

  if (params.get("registered") === "1") {
    sendConversion(config.signupConversion, "reklaio:conversion:signup:v1");
  }

  const checkoutSessionId = params.get("session_id");
  if (params.get("checkout") === "success" && checkoutSessionId) {
    sendConversion(
      config.proConversion,
      `reklaio:conversion:pro:${checkoutSessionId}`,
      {
        value: config.proValue,
        currency: config.currency,
        transactionId: checkoutSessionId
      }
    );
  }
}

async function enableGoogleTracking() {
  const config = await getTrackingConfig();
  if (!config.tagId) return;

  const gtag = getGtag();
  gtag("consent", "default", consentState("denied"));
  gtag("consent", "update", consentState("granted"));

  if (!document.querySelector("script[data-reklaio-google-tag]")) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.tagId)}`;
    script.dataset.reklaioGoogleTag = config.tagId;
    document.head.appendChild(script);
  }

  if (!window.__reklaioGoogleConfigured) {
    gtag("js", new Date());
    gtag("config", config.tagId, { send_page_view: true });
    window.__reklaioGoogleConfigured = true;
  }

  trackCurrentConversions(config);
}

function disableGoogleTracking() {
  if (window.gtag) window.gtag("consent", "update", consentState("denied"));
  removeKnownGoogleCookies();
}

export function GoogleConsentManager() {
  const pathname = usePathname();
  const english = pathname === "/en" || pathname.startsWith("/en/");
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    const validChoice = stored === "accepted" || stored === "rejected" ? stored : null;
    setChoice(validChoice);
    setIsOpen(validChoice === null);
    if (validChoice === "accepted") void enableGoogleTracking();

    const openSettings = () => setIsOpen(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, openSettings);
  }, []);

  const accept = useCallback(() => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    setChoice("accepted");
    setIsOpen(false);
    void enableGoogleTracking();
  }, []);

  const reject = useCallback(() => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "rejected");
    setChoice("rejected");
    setIsOpen(false);
    disableGoogleTracking();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="consent-shell" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="consent-card">
        <div>
          <span className="eyebrow">{english ? "Privacy" : "Datenschutz"}</span>
          <h2 id="consent-title">{choice ? (english ? "Cookie settings" : "Cookie-Einstellungen") : (english ? "Your privacy choice" : "Deine Datenschutz-Auswahl")}</h2>
          <p>
            {english
              ? "Essential storage keeps sign-in and the service working. With your consent, we load the Google tag to measure page views, registrations and Pro purchases from Google Ads. Without consent, the Google tag is not loaded."
              : "Notwendige Speicherungen sichern Anmeldung und Betrieb. Mit deiner freiwilligen Zustimmung laden wir das Google-Tag, um Seitenaufrufe sowie Registrierungen und Pro-Abschlüsse aus Google Ads zu messen. Ohne Zustimmung wird das Google-Tag nicht geladen."}
          </p>
          <Link href={english ? "/en/datenschutz" : "/datenschutz"}>{english ? "Read the privacy policy" : "Mehr in der Datenschutzerklärung"}</Link>
        </div>
        <div className="consent-actions">
          <button className="consent-button consent-button-secondary" type="button" onClick={reject}>
            {english ? "Essential only" : "Nur notwendige"}
          </button>
          <button className="consent-button consent-button-primary" type="button" onClick={accept}>
            {english ? "Accept all" : "Alle akzeptieren"}
          </button>
        </div>
      </div>
    </div>
  );
}
