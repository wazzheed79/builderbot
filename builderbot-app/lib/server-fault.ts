import * as Sentry from "@sentry/nextjs";

/** Log a server fault. Sent to Sentry only when a DSN is configured. No customer text. */
export function reportServerFault(message: string): void {
  const text = String(message || "Server check failed").slice(0, 300);
  console.error(text);
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.captureMessage(text, { level: "error" });
}

/**
 * The AI call failed or gave an unusable reply, so the app used its fallback.
 * Sent to Sentry with the route and a short code (e.g. http_429). No customer text.
 */
export function reportAiFallback(route: "generate" | "expand" | "demo", code: string): void {
  const safeCode = String(code || "unknown").slice(0, 60);
  console.error(`Gemini ${route} failed (${safeCode}). Fallback used.`);
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.captureMessage(`Gemini ${route} failed, fallback used`, {
    level: "warning",
    tags: { area: "ai-fallback", route, code: safeCode },
  });
}
