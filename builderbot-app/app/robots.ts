import type { MetadataRoute } from "next";
import { absoluteCanonicalUrl } from "@/lib/site-urls.mjs";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/q/", "/i/"],
    },
    sitemap: absoluteCanonicalUrl("/sitemap.xml"),
  };
}
