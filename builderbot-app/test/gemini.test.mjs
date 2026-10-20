import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_REQUEST_TIMEOUT_MS,
  modelUsesThinkingLevel,
  parseGeminiJson,
  resolveGeminiModel,
  shouldUseRoughEstimate,
} from "../lib/gemini.mjs";

test("Gemini model defaults to gemini-3.5-flash", () => {
  assert.equal(DEFAULT_GEMINI_MODEL, "gemini-3.5-flash");
  assert.equal(resolveGeminiModel({}), "gemini-3.5-flash");
  assert.equal(resolveGeminiModel({ GEMINI_MODEL: "   " }), "gemini-3.5-flash");
});

test("Gemini model reads GEMINI_MODEL and ignores a models/ prefix", () => {
  assert.equal(
    resolveGeminiModel({ GEMINI_MODEL: " gemini-3.1-flash-lite " }),
    "gemini-3.1-flash-lite"
  );
  assert.equal(
    resolveGeminiModel({ GEMINI_MODEL: "models/gemini-3.5-flash" }),
    "gemini-3.5-flash"
  );
  assert.equal(resolveGeminiModel({ GEMINI_MODEL: "not a model" }), DEFAULT_GEMINI_MODEL);
});

test("Gemini 3 models use thinkingLevel and Gemini 2.5 does not", () => {
  assert.equal(modelUsesThinkingLevel("gemini-3.5-flash"), true);
  assert.equal(modelUsesThinkingLevel("gemini-3.8-flash"), true);
  assert.equal(modelUsesThinkingLevel("gemini-2.5-flash"), false);
  assert.equal(modelUsesThinkingLevel("gemini-flash-latest"), false);
});

test("Gemini request timeout is twenty seconds", () => {
  assert.equal(GEMINI_REQUEST_TIMEOUT_MS, 20_000);
});

test("Gemini HTTP failures and timeouts use the rough estimate", () => {
  assert.equal(shouldUseRoughEstimate({ status: 404, message: "no longer available" }), true);
  assert.equal(shouldUseRoughEstimate({ status: 429, message: "rate limit" }), true);
  assert.equal(shouldUseRoughEstimate({ status: 503, message: "high demand" }), true);
  assert.equal(shouldUseRoughEstimate({ name: "AbortError", message: "This operation was aborted" }), true);
  assert.equal(shouldUseRoughEstimate({ name: "TimeoutError", message: "timed out" }), true);
  assert.equal(
    shouldUseRoughEstimate({ message: "fetch failed", cause: { name: "AbortError", message: "aborted" } }),
    true
  );
  assert.equal(shouldUseRoughEstimate(new SyntaxError("Unexpected token")), true);

  const empty = new Error("Gemini returned an empty response.");
  empty.name = "GeminiEmptyResponseError";
  assert.equal(shouldUseRoughEstimate(empty), true);
});

test("Ordinary code errors are not treated as a Gemini outage", () => {
  assert.equal(shouldUseRoughEstimate(new TypeError("Cannot read properties of undefined")), false);
  assert.equal(shouldUseRoughEstimate(new Error("quote total was not a number")), false);
});

test("parseGeminiJson reads fenced JSON and rejects an empty reply", () => {
  assert.deepEqual(parseGeminiJson('```json\n{"title":"Fence"}\n```'), { title: "Fence" });
  assert.throws(() => parseGeminiJson("   "), /empty response/);
});
