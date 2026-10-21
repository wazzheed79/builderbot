// Gemini quote and scope replies. A failed check means the route keeps the rough estimate or the original notes.
import test from "node:test";
import assert from "node:assert/strict";

import { parseGeminiJson } from "../lib/gemini.mjs";
import {
  MAX_LINE_ITEMS,
  MAX_RATE,
  sanitizeExpandedScope,
  sanitizeGeneratedQuote,
} from "../lib/quote-ai.mjs";

const usable = {
  title: "Replace the bath",
  scopeOfWork: "Remove the old bath and fit a new one.",
  suggestedDepositPercent: 20,
  items: [
    { type: "labour", description: "Fit the bath", quantity: "2", unit: "hrs", rate: "45.5" },
    { type: "material", description: "Bath", quantity: 1, unit: "unit", rate: 320 },
  ],
};

test("a usable Gemini quote is kept, with labour mapped and string numbers repaired", () => {
  const cleaned = sanitizeGeneratedQuote(usable, { notes: "new bath" });
  assert.equal(cleaned.ok, true);
  if (!cleaned.ok) return;
  assert.equal(cleaned.title, "Replace the bath");
  assert.equal(cleaned.items[0].type, "labor");
  assert.equal(cleaned.items[0].quantity, 2);
  assert.equal(cleaned.items[0].rate, 45.5);
  assert.equal(cleaned.items[1].rate, 320);
  assert.equal("html" in cleaned.items[0], false);
});

test("out of range prices and quantities stay inside the existing clamps", () => {
  const cleaned = sanitizeGeneratedQuote({
    title: "Roof",
    scopeOfWork: "Strip and retile.",
    suggestedDepositPercent: 250,
    items: [
      { type: "material", description: "Tiles", quantity: -4, unit: "m2", rate: 999999 },
      { type: "service", description: "Skip", quantity: 0, unit: "lot", rate: -20 },
    ],
  });
  assert.equal(cleaned.ok, true);
  if (!cleaned.ok) return;
  assert.equal(cleaned.suggestedDepositPercent, 100);
  assert.equal(cleaned.items[0].quantity, 0.01);
  assert.equal(cleaned.items[0].rate, MAX_RATE);
  assert.equal(cleaned.items[1].quantity, 1);
  assert.equal(cleaned.items[1].rate, 0);
});

test("a missing deposit becomes 20 percent, and a negative deposit becomes zero", () => {
  const missing = sanitizeGeneratedQuote({
    items: [{ description: "Labour", quantity: 1, unit: "day", rate: 280 }],
  });
  const negative = sanitizeGeneratedQuote({
    suggestedDepositPercent: -5,
    items: [{ description: "Labour", quantity: 1, unit: "day", rate: 280 }],
  });
  assert.equal(missing.ok && missing.suggestedDepositPercent, 20);
  assert.equal(negative.ok && negative.suggestedDepositPercent, 0);
});

test("malformed Gemini quotes are rejected so the rough estimate can be used", () => {
  assert.equal(sanitizeGeneratedQuote(null).ok, false);
  assert.equal(sanitizeGeneratedQuote(["not", "a", "quote"]).ok, false);
  assert.equal(sanitizeGeneratedQuote({ title: "Only a title" }).ok, false);
  assert.equal(sanitizeGeneratedQuote({ items: "tiles" }).ok, false);
  assert.equal(sanitizeGeneratedQuote({ items: [null, "nope", 4] }).ok, false);
  assert.equal(sanitizeGeneratedQuote({ items: [] }).ok, false);
});

test("one bad line is dropped and the rest of the quote is kept", () => {
  const cleaned = sanitizeGeneratedQuote({
    title: "Driveway",
    items: [null, { description: "Block paving", quantity: 12, unit: "m2", rate: 80 }],
  });
  assert.equal(cleaned.ok, true);
  if (!cleaned.ok) return;
  assert.equal(cleaned.items.length, 1);
  assert.equal(cleaned.items[0].description, "Block paving");
  assert.equal(cleaned.title, "Driveway");
});

test("line items stop at 50 and text is trimmed", () => {
  const items = Array.from({ length: MAX_LINE_ITEMS + 5 }, (_, index) => ({
    description: `Line ${index} ${"x".repeat(300)}`,
    quantity: 1,
    unit: "unit",
    rate: 10,
  }));
  const cleaned = sanitizeGeneratedQuote({
    title: `  ${"T".repeat(200)}`,
    scopeOfWork: "Scope\u0000 with a null.",
    items,
  });
  assert.equal(cleaned.ok, true);
  if (!cleaned.ok) return;
  assert.equal(cleaned.items.length, MAX_LINE_ITEMS);
  assert.equal(cleaned.title.length, 150);
  assert.equal(cleaned.scopeOfWork.includes("\u0000"), false);
  assert.equal(cleaned.items[0].description.length, 200);
});

test("fenced Gemini JSON is parsed and then checked", () => {
  const parsed = parseGeminiJson('```json\n{"title":"Fence","items":[{"description":"Panels","quantity":3,"unit":"unit","rate":70}]}\n```');
  const cleaned = sanitizeGeneratedQuote(parsed, { notes: "fence panels" });
  assert.equal(cleaned.ok, true);
  if (!cleaned.ok) return;
  assert.equal(cleaned.items[0].rate, 70);
});

test("a scope rewrite must be text, and a broken reply is rejected", () => {
  const cleaned = sanitizeExpandedScope(
    { title: "Boiler swap", scopeOfWork: "  Isolate, drain, and fit the new combi.  " },
    { title: "Old title", notes: "boiler" }
  );
  assert.equal(cleaned.ok, true);
  if (!cleaned.ok) return;
  assert.equal(cleaned.scopeOfWork, "Isolate, drain, and fit the new combi.");

  assert.equal(sanitizeExpandedScope({ title: "Boiler", scopeOfWork: { text: "nope" } }, { notes: "boiler" }).ok, false);
  assert.equal(sanitizeExpandedScope(["scope"], { notes: "boiler" }).ok, false);
  assert.equal(sanitizeExpandedScope({ scopeOfWork: "   " }, { notes: "boiler" }).ok, false);
  const titled = sanitizeExpandedScope({ scopeOfWork: "Fit and test." }, { title: "Existing title" });
  assert.equal(titled.ok && titled.title, "Existing title");
});
