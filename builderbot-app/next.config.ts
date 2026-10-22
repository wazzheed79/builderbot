import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { legacyRedirects } from "./lib/domain-redirect.mjs";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentUpgrade: "security",
  },
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

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
const uploadSourceMaps = Boolean(sentryAuthToken && sentryOrg && sentryProject);

export default withSentryConfig(nextConfig, {
  ...(sentryOrg ? { org: sentryOrg } : {}),
  ...(sentryProject ? { project: sentryProject } : {}),
  ...(sentryAuthToken ? { authToken: sentryAuthToken } : {}),
  silent: true,
  telemetry: false,
  sourcemaps: {
    disable: uploadSourceMaps ? false : true,
  },
  webpack: {
    automaticVercelMonitors: false,
  },
  errorHandler(error) {
    console.warn(`Sentry source map upload skipped: ${error.message}`);
  },
});
