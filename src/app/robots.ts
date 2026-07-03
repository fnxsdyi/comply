import type { MetadataRoute } from "next";
import { routing } from "@/routing";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://comply.kaki.llc/sitemap.xml",
  };
}
