import type { MetadataRoute } from "next";

const BASE_URL = "https://reklaio.de";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/dashboard",
        "/dokumente",
        "/einstellungen",
        "/faelle",
        "/fristen",
        "/neuer-fall",
        "/onboarding",
        "/preise/checkout"
      ]
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL
  };
}
