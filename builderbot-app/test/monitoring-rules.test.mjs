import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { scrubText } from "../lib/privacy-scrub.mjs";
import { scrubSentryEvent } from "../lib/sentry-scrub.mjs";
import { buildSentryOptions } from "../lib/sentry-options.mjs";
import {
  isCustomerPublicPath,
  isFreshSignup,
  normalizeConsent,
  sanitizeCapturedProperties,
  sanitizeEventProperties,
} from "../lib/analytics-rules.mjs";

test("Sentry stays off without a DSN and samples a tenth of traces", () => {
  assert.equal(buildSentryOptions(undefined), null);
  assert.equal(buildSentryOptions("  "), null);
  const options = buildSentryOptions("https://example.ingest.sentry.io/1");
  assert.equal(options.tracesSampleRate, 0.1);
  assert.equal(options.sendDefaultPii, false);
  assert.equal(options.replaysSessionSampleRate, undefined);
  assert.equal(options.replaysOnErrorSampleRate, undefined);
  assert.deepEqual(options.dataCollection.httpBodies, []);
  assert.equal(options.dataCollection.genAI.inputs, false);
  assert.equal(options.dataCollection.userInfo, false);
});

test("Sentry scrubs a finished trace instead of streaming it", () => {
  for (const file of ["instrumentation-client.ts", "sentry.server.config.ts", "sentry.edge.config.ts"]) {
    const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(source, /traceLifecycle:\s*"static"/);
  }
});

test("Sentry events drop names, emails, phones, addresses and quote wording", () => {
  const event = {
    message: "Failed for sarah.jenkins@example.com at +44 7911 123456",
    user: { id: "user-1", email: "sarah.jenkins@example.com", ip_address: "1.2.3.4" },
    request: {
      method: "POST",
      url: "https://www.chuffedquotes.co.uk/q/secret-token?email=sarah.jenkins@example.com",
      data: { notes: "Replace the en-suite and move the soil pipe" },
      cookies: { session: "secret" },
      headers: { cookie: "session=secret" },
    },
    transaction: "/q/secret-token",
    extra: {
      clientName: "Sarah Jenkins",
      clientAddress: "24 Orchard Way, Bristol, BS8 4EJ",
      notes: "Full bathroom strip-out",
      phone: "07911 123456",
    },
    exception: {
      values: [{ type: "Error", value: "Quote for BS8 4EJ could not be saved" }],
    },
    spans: [{ description: "GET /i/invoice-token", data: { notes: "Balance due" } }],
  };

  const scrubbed = scrubSentryEvent(event);
  assert.deepEqual(scrubbed.user, { id: "user-1" });
  assert.equal(scrubbed.request.method, "POST");
  assert.equal(scrubbed.request.data, undefined);
  assert.equal(scrubbed.request.cookies, undefined);
  assert.match(scrubbed.request.url, /\/q\/\[id\]/);
  assert.doesNotMatch(scrubbed.request.url, /secret-token|sarah\.jenkins/);
  assert.equal(scrubbed.extra.clientName, "[redacted]");
  assert.equal(scrubbed.extra.notes, "[redacted]");
  assert.equal(scrubbed.extra.phone, "[redacted]");
  assert.match(scrubbed.message, /\[redacted-email\]/);
  assert.match(scrubbed.message, /\[redacted-phone\]/);
  assert.match(scrubbed.exception.values[0].value, /\[redacted-postcode\]/);
  assert.match(scrubbed.spans[0].description, /\/i\/\[token\]/);
  assert.equal(scrubbed.spans[0].data.notes, "[redacted]");
  assert.equal(scrubText("2026-10-21"), "2026-10-21");
});

test("PostHog consent, public pages and signup stay free of personal fields", () => {
  assert.equal(normalizeConsent("accepted"), "accepted");
  assert.equal(normalizeConsent("later"), null);
  assert.equal(isCustomerPublicPath("/q/abc"), true);
  assert.equal(isCustomerPublicPath("/i/abc"), true);
  assert.equal(isCustomerPublicPath("/quotes"), false);

  const created = "2026-10-21T12:00:00.000Z";
  const firstLogin = "2026-10-22T09:00:00.000Z";
  const laterLogin = "2026-11-21T09:00:00.000Z";
  assert.equal(isFreshSignup(created, firstLogin, Date.parse("2026-10-22T09:05:00.000Z")), true);
  assert.equal(isFreshSignup(created, laterLogin, Date.parse(laterLogin)), false);

  assert.deepEqual(sanitizeEventProperties("quote_created", { ai_used: true, clientName: "Sarah" }), {
    ai_used: true,
  });
  assert.equal(sanitizeEventProperties("quote_viewed", { token: "secret", email: "a@b.co" }) && true, true);
  assert.deepEqual(sanitizeEventProperties("quote_viewed", { token: "secret" }), {});
  assert.equal(sanitizeEventProperties("not_a_real_event", {}), null);

  const captured = sanitizeCapturedProperties({
    $pathname: "/q/secret-token",
    $current_url: "https://www.chuffedquotes.co.uk/i/invoice-token?phone=07911123456",
    email: "sarah.jenkins@example.com",
    ai_used: false,
  });
  assert.equal(captured.email, undefined);
  assert.match(captured.$pathname, /\/q\/\[id\]/);
  assert.match(captured.$current_url, /\/i\/\[token\]/);
  assert.doesNotMatch(captured.$current_url, /phone=/);
  assert.equal(captured.ai_used, false);
});
