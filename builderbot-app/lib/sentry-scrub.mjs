import { scrubText, scrubValue } from "./privacy-scrub.mjs";

function scrubSpan(span) {
  if (!span || typeof span !== "object") return span;
  if (typeof span.description === "string") span.description = scrubText(span.description);
  if (span.data && typeof span.data === "object") span.data = scrubValue(span.data);
  return span;
}

/** Remove customer and quote details from a Sentry error or transaction. */
export function scrubSentryEvent(event) {
  if (!event || typeof event !== "object") return event;

  if (event.user && typeof event.user === "object") {
    const id = event.user.id;
    event.user = id ? { id: String(id) } : undefined;
  }

  if (event.request && typeof event.request === "object") {
    const url = typeof event.request.url === "string" ? scrubText(event.request.url) : undefined;
    event.request = { method: event.request.method, url };
  }

  if (typeof event.message === "string") event.message = scrubText(event.message);
  if (typeof event.transaction === "string") event.transaction = scrubText(event.transaction);
  if (typeof event.logentry?.message === "string") event.logentry.message = scrubText(event.logentry.message);

  const values = event.exception?.values;
  if (Array.isArray(values)) {
    for (const entry of values) {
      if (typeof entry?.value === "string") entry.value = scrubText(entry.value);
      const frames = entry?.stacktrace?.frames;
      if (!Array.isArray(frames)) continue;
      for (const frame of frames) {
        if (typeof frame.filename === "string") frame.filename = scrubText(frame.filename);
        if (typeof frame.abs_path === "string") frame.abs_path = scrubText(frame.abs_path);
        delete frame.vars;
      }
    }
  }

  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => scrubSentryBreadcrumb(breadcrumb)).filter(Boolean);
  }
  if (Array.isArray(event.spans)) event.spans = event.spans.map((span) => scrubSpan(span));
  if (event.extra) event.extra = scrubValue(event.extra);
  if (event.contexts) event.contexts = scrubValue(event.contexts);
  if (event.tags) event.tags = scrubValue(event.tags);
  return event;
}

export function scrubSentryBreadcrumb(breadcrumb) {
  if (!breadcrumb || typeof breadcrumb !== "object") return breadcrumb;
  if (typeof breadcrumb.message === "string") breadcrumb.message = scrubText(breadcrumb.message);
  if (breadcrumb.data) breadcrumb.data = scrubValue(breadcrumb.data);
  return breadcrumb;
}
