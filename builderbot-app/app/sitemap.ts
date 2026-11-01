import type { MetadataRoute } from "next";
import { PUBLIC_SITEMAP_PATHS, absoluteCanonicalUrl } from "@/lib/site-urls.mjs";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: absoluteCanonicalUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
