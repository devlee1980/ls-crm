import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: "https://www.ls-nexus.com/",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.ls-nexus.com/login",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
