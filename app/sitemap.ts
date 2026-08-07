import type { MetadataRoute } from "next";

const BASE_URL = "https://reklaio.de";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${BASE_URL}/preise`,
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
    }
  ];
}
