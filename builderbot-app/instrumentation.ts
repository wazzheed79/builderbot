import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError: typeof Sentry.captureRequestError = (error, request, errorContext) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.captureRequestError(error, request, errorContext);
};
