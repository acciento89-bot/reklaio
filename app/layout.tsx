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
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }]
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://reklaio.de",
    siteName: "Reklaio",
    title: "Reklaio – Dein Fall. Deine Frist. Dein Überblick.",
    description: "Belege, Chronik, Fristen und Schreiben in einer vollständigen digitalen Fallakte.",
    images: [{ url: "/reklaio-banner.svg", width: 1200, height: 760, alt: "Reklaio digitale Fallakte" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Reklaio – Verbraucherfälle strukturiert dokumentieren",
    description: "Belege, Chronik, Fristen und Schreiben an einem Ort.",
    images: ["/reklaio-banner.svg"]
  }
};

export const viewport: Viewport = {
  themeColor: "#14364b",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
