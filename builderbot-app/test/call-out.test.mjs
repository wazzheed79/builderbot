import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { callOutFeeAmount, callOutLine, isSettingsCallOutLine } from "../lib/call-out.mjs";
import { pricingMemoryForQuote } from "../lib/price-memory.mjs";

test("a call-out fee is optional and becomes one labour line", () => {
  assert.equal(callOutFeeAmount(undefined), 0);
  assert.equal(callOutFeeAmount({}), 0);
  assert.equal(callOutFeeAmount({ callOutFee: 0 }), 0);
  assert.equal(callOutFeeAmount({ callOutFee: -10 }), 0);
  assert.equal(callOutFeeAmount({ callOutFee: "nope" }), 0);
  assert.equal(callOutFeeAmount({ callOutFee: "" }), 0);
  assert.equal(callOutFeeAmount({ callOutFee: "65.5" }), 65.5);
  assert.equal(callOutFeeAmount({ callOutFee: 45.555 }), 45.56);

  const items = [{ type: "material", description: "Pipe", quantity: 1, unit: "m", rate: 4 }];
  const line = callOutLine({ callOutFee: 45 });
  assert.equal(items.length, 1);
  assert.equal(callOutLine({ callOutFee: 0 }), null);
  assert.equal(callOutLine({}), null);
  assert.deepEqual(line, {
    type: "labor",
    description: "Call-out fee",
    quantity: 1,
    unit: "visit",
    rate: 45,
    rateSource: "settings",
  });
});

test("the saved call-out line is not treated as the hourly rate, and a repair call-out still is labour", () => {
  assert.equal(isSettingsCallOutLine({ description: "Call-out fee", type: "labor", rate: 45 }), true);
  assert.equal(isSettingsCallOutLine({ description: "Call out fee", type: "labor", rate: 45 }), true);
  assert.equal(
    isSettingsCallOutLine({ description: "Plumber call-out and repair time", type: "labor", rate: 60 }),
    false
  );
});

test("the call-out fee is not sent to the quote builder on its own", () => {
  const payload = pricingMemoryForQuote(
    { laborHourlyRate: 50, laborDayRate: 280, callOutFee: 45, preferredMarkupPercent: 20 },
    []
  );
  assert.equal(payload.callOutFee, undefined);
  assert.equal(payload.laborDayRate, 280);
  assert.equal(payload.laborHourlyRate, 50);
});

test("settings and the quote editor offer the call-out fee without adding it automatically", () => {
  const root = new URL("../", import.meta.url);
  const settings = fs.readFileSync(new URL("app/settings/page.tsx", root), "utf8");
  const editor = fs.readFileSync(new URL("components/quotes/LineItemEditor.tsx", root), "utf8");
  const picker = fs.readFileSync(new URL("components/quotes/PriceListPicker.tsx", root), "utf8");
  const quotes = fs.readFileSync(new URL("app/quotes/QuotesClient.tsx", root), "utf8");
  const card = fs.readFileSync(new URL("app/q/[id]/opengraph-image.tsx", root), "utf8");
  const totals = fs.readFileSync(new URL("components/VatTotals.tsx", root), "utf8");

  assert.match(settings, /Call-out fee \(£\)/);
  assert.match(settings, /callOutFee/);
  assert.match(settings, /savePricingMemory\(updated\)/);
  assert.match(settings, /Day rate \(£\)/);
  assert.match(editor, /Add call-out fee/);
  assert.match(picker, /Add call-out fee/);
  assert.match(quotes, /onAddCallOut=\{handleAddCallOut\}/);
  assert.match(quotes, /callOutLine\(getPricingMemory\(\)\)/);
  assert.equal(quotes.includes("items: [...items, callOutLine"), false);
  assert.match(card, /costRows/);
  assert.match(totals, /splitCostTotals/);
  assert.match(totals, /Subtotal \(ex VAT\)|view\.subtotalLabel/);
});
