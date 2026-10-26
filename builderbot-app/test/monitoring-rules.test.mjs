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

test("PostHog page views and demo events keep token, and secrets are still removed", () => {
  const token = "phc_07911123456abcdef";
  const pageview = sanitizeCapturedProperties({
    token,
    distinct_id: "anon-1",
    $session_id: "session-1",
    $window_id: "window-1",
    $config_defaults: "2026-01-30",
    $lib: "web",
    $pathname: "/try",
    $current_url: "https://www.chuffedquotes.co.uk/q/secret-token?email=sarah@example.com",
    $email: "sarah@example.com",
    $ip: "203.0.113.8",
    email: "sarah@example.com",
    notes: "Paint the hall in BS8 4EJ",
    password: "hunter2",
    access_token: "user-secret",
    phone: "07911 123456",
    clientName: "Sarah Jenkins",
    ai_used: true,
  });

  assert.equal(pageview.token, token);
  assert.equal(pageview.distinct_id, "anon-1");
  assert.equal(pageview.$session_id, "session-1");
  assert.equal(pageview.$window_id, "window-1");
  assert.equal(pageview.$config_defaults, "2026-01-30");
  assert.equal(pageview.$lib, "web");
  assert.equal(pageview.$pathname, "/try");
  assert.equal(pageview.ai_used, true);
  assert.match(pageview.$current_url, /\/q\/\[id\]/);
  assert.doesNotMatch(pageview.$current_url, /secret-token|sarah@/);
  assert.equal(pageview.email, undefined);
  assert.equal(pageview.$email, undefined);
  assert.equal(pageview.$ip, undefined);
  assert.equal(pageview.notes, undefined);
  assert.equal(pageview.password, undefined);
  assert.equal(pageview.access_token, undefined);
  assert.equal(pageview.phone, undefined);
  assert.equal(pageview.clientName, undefined);

  const demo = sanitizeCapturedProperties({
    token,
    $lib: "web",
    used_example: false,
    reason: "daily_limit",
    notes: "Kitchen tap is leaking",
    signature: "Sarah Jenkins",
  });
  assert.equal(demo.token, token);
  assert.equal(demo.$lib, "web");
  assert.equal(demo.used_example, false);
  assert.equal(demo.reason, "daily_limit");
  assert.equal(demo.notes, undefined);
  assert.equal(demo.signature, undefined);

  assert.deepEqual(sanitizeEventProperties("demo_build_clicked", { used_example: true, notes: "Paint the hall" }), {
    used_example: true,
  });
  assert.deepEqual(sanitizeEventProperties("demo_quote_generated", { ai_used: true, used_example: false, notes: "Paint" }), {
    ai_used: true,
    used_example: false,
  });
  assert.deepEqual(sanitizeEventProperties("demo_build_failed", { reason: "empty_input", used_example: false }), {
    reason: "empty_input",
    used_example: false,
  });
  assert.deepEqual(sanitizeEventProperties("demo_build_failed", { reason: "daily_limit" }), {
    reason: "daily_limit",
  });
  assert.deepEqual(sanitizeEventProperties("demo_build_failed", { reason: "ai_error" }), {
    reason: "ai_error",
  });
  assert.deepEqual(sanitizeEventProperties("demo_build_failed", { reason: "Paint the hall and the stairs" }), {});
  assert.deepEqual(sanitizeEventProperties("demo_signup_clicked", { email: "a@b.co" }), {});
});
