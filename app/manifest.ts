import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reklaio",
    short_name: "Reklaio",
    description: "Reklamationen, Fristen und Belege übersichtlich organisieren.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d17",
    theme_color: "#121629",
    lang: "de",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
