import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: "https://crm.lifescientific.com/",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://crm.lifescientific.com/login",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
