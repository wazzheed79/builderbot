import { scrubText } from "./privacy-scrub.mjs";

const ROUTES = new Set(["generate", "expand", "demo"]);

/**
 * Warning sent when a quote route uses the rough estimate.
 * The message is the Sentry title. There is no stack trace, so the issue is
 * not named after a minified frame such as Module.ij. Fingerprint groups one
 * issue per route and failure code. No job notes.
 * @param {string} route
 * @param {string} code
 */
export function buildAiFallbackReport(route, code) {
  const safeRoute = ROUTES.has(route) ? route : "unknown";
  const collapsed = String(code || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  const scrubbed = scrubText(collapsed);
  const safeCode = scrubbed && scrubbed.trim() ? scrubbed : "unknown";
  const title = `AI quote fallback: ${safeRoute} ${safeCode}`;
  return {
    log: `Gemini ${safeRoute} failed (${safeCode}). Fallback used.`,
    event: {
      message: title,
      level: "warning",
      fingerprint: ["ai-quote-fallback", safeRoute, safeCode],
      tags: { area: "ai-fallback", route: safeRoute, code: safeCode },
      exception: {
        values: [
          {
            type: "AI quote fallback",
            value: `${safeRoute} ${safeCode}`,
          },
        ],
      },
    },
  };
}
