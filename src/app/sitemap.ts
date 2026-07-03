import type { MetadataRoute } from "next";
import { routing } from "@/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://comply.kaki.llc";
  const today = new Date().toISOString();

  const pages = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "monthly" as const },
  ];

  return routing.locales.flatMap((locale) =>
    pages.map((page) => ({
      url: `${baseUrl}/${locale}${page.path}`,
      lastModified: today,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }))
  );
}
