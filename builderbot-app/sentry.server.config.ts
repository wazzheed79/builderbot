import * as Sentry from "@sentry/nextjs";
import { buildSentryOptions } from "@/lib/sentry-options.mjs";

try {
  const options = buildSentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (options) {
    Sentry.init({
      ...options,
      traceLifecycle: "static",
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
    });
  }
} catch {
  // Monitoring must never stop a quote from being saved.
}
