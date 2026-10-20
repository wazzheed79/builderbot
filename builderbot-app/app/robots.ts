import type { MetadataRoute } from "next";
import { configuredSiteUrl } from "@/lib/brand.mjs";

function siteUrl() {
  return configuredSiteUrl() || "https://www.tradematequotes.co.uk";
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/q/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
