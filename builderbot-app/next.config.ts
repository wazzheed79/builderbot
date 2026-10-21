import type { NextConfig } from "next";
import { legacyRedirects } from "./lib/domain-redirect.mjs";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return legacyRedirects();
  },
  async rewrites() {
    return [{ source: "/manifest.json", destination: "/api/pwa-manifest" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
