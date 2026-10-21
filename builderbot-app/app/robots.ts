import type { MetadataRoute } from "next";
import { configuredSiteUrl } from "@/lib/brand.mjs";

function siteUrl() {
  return configuredSiteUrl() || "https://www.chuffedquotes.co.uk";
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/q/", "/i/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
