import type { MetadataRoute } from "next";
import { configuredSiteUrl } from "@/lib/brand.mjs";

function siteUrl() {
  return configuredSiteUrl() || "https://www.chuffedquotes.co.uk";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl();
  const paths = ["/", "/try", "/walkthrough", "/pricing", "/login", "/feedback", "/privacy", "/terms"];
  return paths.map((path) => ({
    url: `${site}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
