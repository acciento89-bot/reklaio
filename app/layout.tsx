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
import { GlobalLegalLinks } from "@/components/global-legal-links";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

export const metadata: Metadata = {
  metadataBase: new URL("https://reklaio.de"),
  title: {
    default: "Reklaio – Verbraucherfälle strukturiert dokumentieren",
    template: "%s | Reklaio"
  },
  description:
    "Reklamationen, Rückzahlungen, Kündigungen, Belege und Fristen in einer nachvollziehbaren digitalen Fallakte organisieren.",
  applicationName: "Reklaio",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }]
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://reklaio.de",
    siteName: "Reklaio",
    title: "Reklaio – Dein Fall. Deine Frist. Dein Überblick.",
    description: "Belege, Chronik, Fristen, Schreiben und empfohlene nächste Schritte in einer vollständigen digitalen Fallakte.",
    images: [{ url: "/reklaio-banner.svg", width: 2048, height: 682, alt: "Reklaio – Dein Fall. Deine Frist. Dein Überblick." }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Reklaio – Dein Fall. Deine Frist. Dein Überblick.",
    description: "Belege, Chronik, Fristen und empfohlene nächste Schritte an einem Ort.",
    images: ["/reklaio-banner.svg"]
  }
};

export const viewport: Viewport = {
  themeColor: "#0b1538",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <ServiceWorkerRegistration />
        {children}
        <GlobalLegalLinks />
      </body>
    </html>
  );
}
