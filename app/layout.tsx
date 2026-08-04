import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./account.css";
import "./cases.css";
import "./documents.css";
import "./selects.css";
import "./letters.css";
import "./case-tools.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

export const metadata: Metadata = {
  title: {
    default: "Reklaio – Dein Fall. Deine Frist. Dein Überblick.",
    template: "%s | Reklaio"
  },
  description:
    "Reklamationen, Rückzahlungen, Kündigungen und offene Verbraucherfälle übersichtlich organisieren.",
  applicationName: "Reklaio",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#121629",
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
