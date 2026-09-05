import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./account.css";
import "./cases.css";
import "./documents.css";
import "./selects.css";
import "./letters.css";
import "./case-tools.css";
import "./settings.css";
import "./dashboard-tools.css";
import "./mail-features.css";
import "./professional-overrides.css";
import "./assistant-brand.css";
import "./assistant-brand-fixes.css";
import "./workflow.css";
import "./legal.css";
import "./onboarding.css";
import "./ai.css";
import "./letter-management.css";
import "./navigation-billing.css";
import "./global-app-navigation.css";
import "./admin.css";
import "./checkout.css";
import "./consent.css";
import "./ratgeber.css";
import { GlobalAppNavigation } from "@/components/global-app-navigation";
import { GlobalLegalLinks } from "@/components/global-legal-links";
import { GoogleConsentManager } from "@/components/google-consent-manager";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const en = locale === "en";
  return {
  metadataBase: new URL("https://reklaio.de"),
  title: {
    default: en ? "Reklaio – Organise consumer complaints" : "Reklaio – Verbraucherfälle strukturiert dokumentieren",
    template: "%s | Reklaio"
  },
  description: en ? "Organise complaints, refunds, cancellations, evidence and deadlines in one clear digital case file." : "Reklamationen, Rückzahlungen, Kündigungen, Belege und Fristen in einer nachvollziehbaren digitalen Fallakte organisieren.",
  keywords: [
    "Reklamation schreiben",
    "Reklamationsschreiben",
    "Paket nicht angekommen",
    "Rückzahlung fehlt",
    "defekte Ware reklamieren",
    "Kündigung wird ignoriert"
  ],
  authors: [{ name: "Kamilunavo", url: "https://kamilunavo.com" }],
  creator: "Kamilunavo",
  publisher: "Kamilunavo",
  category: "Verbraucherservice",
  applicationName: "Reklaio",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }]
  },
  openGraph: {
    type: "website",
    locale: en ? "en_GB" : "de_DE",
    url: en ? "https://reklaio.de/en" : "https://reklaio.de",
    siteName: "Reklaio",
    title: en ? "Reklaio – Your case. Your deadline. Your overview." : "Reklaio – Dein Fall. Deine Frist. Dein Überblick.",
    description: en ? "Evidence, timeline, deadlines, letters and recommended next steps in one complete digital case file." : "Belege, Chronik, Fristen, Schreiben und empfohlene nächste Schritte in einer vollständigen digitalen Fallakte.",
    images: [{ url: "/reklaio-banner.svg", width: 2048, height: 682, alt: en ? "Reklaio – Your case. Your deadline. Your overview." : "Reklaio – Dein Fall. Deine Frist. Dein Überblick." }]
  },
  twitter: {
    card: "summary_large_image",
    title: en ? "Reklaio – Your case. Your deadline. Your overview." : "Reklaio – Dein Fall. Deine Frist. Dein Überblick.",
    description: en ? "Evidence, timeline, deadlines and recommended next steps in one place." : "Belege, Chronik, Fristen und empfohlene nächste Schritte an einem Ort.",
    images: ["/reklaio-banner.svg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
  };
}

export const viewport: Viewport = {
  themeColor: "#0b1538",
  colorScheme: "dark"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <ServiceWorkerRegistration />
        <GoogleConsentManager />
        <GlobalAppNavigation locale={locale} />
        <LanguageSwitcher locale={locale} />
        {children}
        <GlobalLegalLinks locale={locale} />
      </body>
    </html>
  );
}
