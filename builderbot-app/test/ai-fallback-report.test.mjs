import test from "node:test";
import assert from "node:assert/strict";

import { buildAiFallbackReport } from "../lib/ai-fallback-report.mjs";

test("AI fallback warning is titled and grouped by route and failure code", () => {
  const report = buildAiFallbackReport("demo", "http_504");
  assert.equal(report.log, "Gemini demo failed (http_504). Fallback used.");
  assert.equal(report.event.message, "AI quote fallback: demo http_504");
  assert.equal(report.event.level, "warning");
  assert.deepEqual(report.event.fingerprint, ["ai-quote-fallback", "demo", "http_504"]);
  assert.deepEqual(report.event.tags, { area: "ai-fallback", route: "demo", code: "http_504" });
  assert.equal(report.event.exception.values[0].type, "AI quote fallback");
  assert.equal(report.event.exception.values[0].value, "demo http_504");
  assert.equal(report.event.exception.values[0].stacktrace, undefined);

  const other = buildAiFallbackReport("generate", "http_429");
  assert.equal(other.event.message, "AI quote fallback: generate http_429");
  assert.notDeepEqual(other.event.fingerprint, report.event.fingerprint);
});

test("AI fallback warning drops notes, a long code, and an unknown route", () => {
  const report = buildAiFallbackReport(
    "expand",
    `sarah.jenkins@example.com ${"x".repeat(80)}`
  );
  assert.equal(report.event.tags.route, "expand");
  assert.ok(report.event.tags.code.length <= 60);
  assert.equal(report.event.tags.code.includes("sarah.jenkins"), false);
  assert.match(report.event.tags.code, /\[redacted-email\]/);
  assert.match(report.event.message, /^AI quote fallback: expand /);
  assert.equal(report.event.fingerprint[0], "ai-quote-fallback");
  assert.equal(report.event.fingerprint[1], "expand");

  const blank = buildAiFallbackReport("not-a-route", "   ");
  assert.equal(blank.event.message, "AI quote fallback: unknown unknown");
  assert.deepEqual(blank.event.fingerprint, ["ai-quote-fallback", "unknown", "unknown"]);
});
