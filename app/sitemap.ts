import type { MetadataRoute } from "next";
import { seoGuides } from "@/lib/seo-guides";

const BASE_URL = "https://reklaio.de";

export default function sitemap(): MetadataRoute.Sitemap {
  const guidePages: MetadataRoute.Sitemap = seoGuides.map((guide) => ({
    url: `${BASE_URL}/${guide.slug}`,
    lastModified: new Date("2026-09-03"),
    changeFrequency: "monthly",
    priority: 0.9
  }));

  const germanPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date("2026-09-03"),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${BASE_URL}/ratgeber`,
      lastModified: new Date("2026-09-03"),
      changeFrequency: "weekly",
      priority: 0.9
    },
    ...guidePages,
    {
      url: `${BASE_URL}/preise`,
      lastModified: new Date("2026-09-03"),
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${BASE_URL}/hilfe`,
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${BASE_URL}/kontakt`,
      changeFrequency: "yearly",
      priority: 0.4
    },
    {
      url: `${BASE_URL}/impressum`,
      changeFrequency: "yearly",
      priority: 0.2
    },
    {
      url: `${BASE_URL}/datenschutz`,
      changeFrequency: "yearly",
      priority: 0.2
    }
  ];
  const translatedPublicPaths = new Set(["", "/preise", "/hilfe", "/kontakt", "/impressum", "/datenschutz"]);
  const englishPages: MetadataRoute.Sitemap = germanPages
    .filter(item => translatedPublicPaths.has(item.url.slice(BASE_URL.length)))
    .map(item => ({ ...item, url: item.url === BASE_URL ? `${BASE_URL}/en` : item.url.replace(BASE_URL, `${BASE_URL}/en`) }));
  return [...germanPages, ...englishPages];
}
