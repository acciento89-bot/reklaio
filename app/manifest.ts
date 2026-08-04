import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reklaio – Digitale Fallakte",
    short_name: "Reklaio",
    description: "Reklamationen, Fristen, Schreiben, Belege und nächste Schritte übersichtlich organisieren.",
    start_url: "/",
    display: "standalone",
    background_color: "#070d24",
    theme_color: "#0b1538",
    lang: "de",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
