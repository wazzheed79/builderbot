import { scrubSentryBreadcrumb, scrubSentryEvent } from "./sentry-scrub.mjs";

/** Shared Sentry options. Returns null when no DSN is configured. */
export function buildSentryOptions(dsn) {
  if (typeof dsn !== "string" || !dsn.trim()) return null;
  return {
    dsn: dsn.trim(),
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      stackFrameVariables: false,
    },
    beforeSend: scrubSentryEvent,
    beforeSendTransaction: scrubSentryEvent,
    beforeBreadcrumb: scrubSentryBreadcrumb,
  };
}
