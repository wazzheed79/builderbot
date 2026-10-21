import * as Sentry from "@sentry/nextjs";

/** Log a server fault. Sent to Sentry only when a DSN is configured. No customer text. */
export function reportServerFault(message: string): void {
  const text = String(message || "Server check failed").slice(0, 300);
  console.error(text);
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.captureMessage(text, { level: "error" });
}
