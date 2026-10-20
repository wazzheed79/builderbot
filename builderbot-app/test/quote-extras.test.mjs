import test from "node:test";
import assert from "node:assert/strict";
import { viewLabel, reminderDue } from "../lib/quote-follow.mjs";
import { buildChoiceOptions, chosenOptionFigures } from "../lib/quote-options.mjs";
import { applyRememberedPrices, priceKey } from "../lib/price-memory.mjs";

test("view label says how many times the customer opened the quote", () => {
  assert.equal(viewLabel({ status: "Sent", viewCount: 0 }), "Not opened yet");
  assert.equal(viewLabel({ status: "Viewed", viewCount: 1 }), "Viewed");
  assert.equal(viewLabel({ status: "Viewed", viewCount: 3 }), "Viewed 3 times");
});

test("reminder is due three days after a sent quote, and not after it is accepted", () => {
  const sentAt = "2026-10-01T09:00:00.000Z";
  const later = new Date("2026-10-05T09:00:00.000Z");
  const sooner = new Date("2026-10-02T09:00:00.000Z");
  assert.equal(reminderDue({ status: "Sent", sentAt }, sooner), false);
  assert.equal(reminderDue({ status: "Viewed", sentAt }, later), true);
  assert.equal(reminderDue({ status: "Accepted", sentAt }, later), false);
});

test("choice options keep a single price working and price the three tiers", () => {
  const items = [{ id: "1", type: "labor", description: "Labour", quantity: 4, unit: "hrs", rate: 50 }];
  const options = buildChoiceOptions(items, false, 0);
  assert.equal(options.length, 3);
  assert.equal(options[0].label, "Standard");
  assert.equal(options[0].total, 200);
  assert.ok(options[2].total > options[1].total);
  assert.equal(chosenOptionFigures({ options: [options[0]] }, "opt-better"), null);
  assert.equal(chosenOptionFigures({ options }, "opt-premium")?.label, "Premium");
});

test("remembered prices replace a similar line and mark it as the usual price", () => {
  const key = priceKey("Double switched socket outlets", "sockets");
  const [line] = applyRememberedPrices(
    [{ type: "material", description: "Double switched socket outlets", quantity: 3, unit: "sockets", rate: 8.5 }],
    [{ key, unit: "sockets", rate: 12, itemType: "material" }]
  );
  assert.equal(line.rate, 12);
  assert.equal(line.usualPrice, true);

  const [untouched] = applyRememberedPrices(
    [{ type: "material", description: "Skip hire", quantity: 1, unit: "skip", rate: 220 }],
    [{ key, unit: "sockets", rate: 12, itemType: "material" }]
  );
  assert.equal(untouched.rate, 220);
  assert.equal(untouched.usualPrice, false);
});
