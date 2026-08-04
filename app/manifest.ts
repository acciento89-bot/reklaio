import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reklaio – Digitale Fallakte",
    short_name: "Reklaio",
    description: "Reklamationen, Fristen, Schreiben und Belege übersichtlich organisieren.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1821",
    theme_color: "#14364b",
    lang: "de",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
