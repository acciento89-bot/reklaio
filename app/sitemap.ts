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
      url: `${BASE_URL}/ratgeber`,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${BASE_URL}/reklamation-schreiben`,
      changeFrequency: "monthly",
      priority: 0.9
    },
    {
      url: `${BASE_URL}/defekte-ware-reklamieren`,
      changeFrequency: "monthly",
      priority: 0.9
    },
    {
      url: `${BASE_URL}/rueckzahlung-fordern`,
      changeFrequency: "monthly",
      priority: 0.9
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
