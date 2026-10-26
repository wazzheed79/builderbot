import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  OWN_PRICES_LINE,
  PRICE_LIST_LIMIT,
  PROMPT_PRICE_LIMIT,
  TRY_PRICES_NOTE,
  applyRememberedPrices,
  planPriceListDelete,
  planPriceListUpsert,
  priceKey,
  rememberedPricesPrompt,
  unitLabel,
} from "../lib/price-memory.mjs";

test("a price can be added, edited, renamed, and deleted", () => {
  const added = planPriceListUpsert([], { description: "Copper pipe", unit: "per metre", rate: "4.5" });
  assert.equal(added.ok, true);
  assert.equal(added.item.description, "Copper pipe");
  assert.equal(added.item.unit, "m");
  assert.equal(added.item.rate, 4.5);
  assert.equal(added.item.key, priceKey("Copper pipe", "m"));
  assert.equal(added.next.length, 1);
  assert.deepEqual(added.deleteKeys, []);

  const repriced = planPriceListUpsert(added.next, { description: "Copper pipe", unit: "m", rate: 5 }, added.item.key);
  assert.equal(repriced.ok, true);
  assert.equal(repriced.next.length, 1);
  assert.equal(repriced.next[0].rate, 5);
  assert.deepEqual(repriced.deleteKeys, []);

  const renamed = planPriceListUpsert(
    repriced.next,
    { description: "15mm copper pipe", unit: "per metre", rate: 5.126 },
    repriced.item.key
  );
  assert.equal(renamed.ok, true);
  assert.equal(renamed.next.length, 1);
  assert.equal(renamed.next[0].description, "15mm copper pipe");
  assert.equal(renamed.next[0].rate, 5.13);
  assert.deepEqual(renamed.deleteKeys, [repriced.item.key]);
  assert.equal(renamed.next.some((row) => row.key === repriced.item.key), false);

  const removed = planPriceListDelete(renamed.next, renamed.item.key);
  assert.equal(removed.ok, true);
  assert.deepEqual(removed.next, []);
  assert.deepEqual(removed.deleteKeys, [renamed.item.key]);
});

test("a price list rejects a blank name, a bad price, an unknown empty unit, and an 81st row", () => {
  assert.equal(planPriceListUpsert([], { description: " ", unit: "each", rate: 10 }).ok, false);
  assert.equal(planPriceListUpsert([], { description: "Pipe", unit: "each", rate: -1 }).ok, false);
  assert.equal(planPriceListUpsert([], { description: "Pipe", unit: "each", rate: 50001 }).ok, false);
  assert.equal(planPriceListUpsert([], { description: "Pipe", unit: "", rate: 10 }).ok, false);
  assert.equal(planPriceListUpsert([], { description: "12", unit: "each", rate: 10 }).ok, false);

  const rows = Array.from({ length: PRICE_LIST_LIMIT }, (_, index) => ({
    key: `saved item ${index}|each`,
    description: `Saved item ${index}`,
    unit: "each",
    rate: 1,
    itemType: "material",
  }));
  const overflow = planPriceListUpsert(rows, { description: "One more item", unit: "each", rate: 2 });
  assert.equal(overflow.ok, false);

  const updated = planPriceListUpsert(rows, { description: "Saved item 0", unit: "each", rate: 9 }, rows[0].key);
  assert.equal(updated.ok, true);
  assert.equal(updated.next.length, PRICE_LIST_LIMIT);
  assert.equal(updated.next[0].rate, 9);
});

test("an hourly price and a daily price with the same name stay separate", () => {
  const hourly = planPriceListUpsert([], { description: "Labour", unit: "per hour", rate: 55 });
  const both = planPriceListUpsert(hourly.next, { description: "Labour", unit: "per day", rate: 280 });
  assert.equal(both.ok, true);
  assert.equal(both.next.length, 2);
  assert.equal(both.next.find((row) => row.unit === "hr").rate, 55);
  assert.equal(both.next.find((row) => row.unit === "day").rate, 280);
  assert.equal(both.next.find((row) => row.unit === "hr").itemType, "labor");
});

test("saved prices are written into the AI prompt, including more than the old dozen", () => {
  const rows = Array.from({ length: PROMPT_PRICE_LIMIT + 1 }, (_, index) => ({
    key: `item ${index}|m`,
    description: `Saved material ${index}`,
    unit: index === 12 ? "m" : "each",
    rate: 3 + index,
  }));
  rows[12] = {
    key: priceKey("15mm copper pipe", "m"),
    description: "15mm copper pipe",
    unit: "m",
    rate: 4.5,
  };
  const prompt = rememberedPricesPrompt(rows);
  assert.match(prompt, /15mm copper pipe/);
  assert.match(prompt, /£4\.50 per metre/);
  assert.match(prompt, /You choose the quantities/);
  assert.match(prompt, /tradesperson's own prices/);
  assert.match(prompt, new RegExp(`Saved material ${PROMPT_PRICE_LIMIT - 1}`));
  assert.doesNotMatch(prompt, new RegExp(`Saved material ${PROMPT_PRICE_LIMIT}`));
  assert.equal(rememberedPricesPrompt([]), "");
  assert.equal(unitLabel("hr"), "per hour");
  assert.equal(unitLabel("m2"), "per m²");
});

test("a saved price replaces a matching AI line, including per hour written as hrs", () => {
  const [pipe] = applyRememberedPrices(
    [{ type: "material", description: "15mm copper pipe", quantity: 8, unit: "lengths", rate: 2 }],
    [{ key: priceKey("15mm copper pipe", "m"), description: "15mm copper pipe", unit: "m", rate: 4.5, itemType: "material" }]
  );
  assert.equal(pipe.rate, 4.5);
  assert.equal(pipe.unit, "m");
  assert.equal(pipe.usualPrice, true);

  const [hours] = applyRememberedPrices(
    [{ type: "labor", description: "Consumer unit change", quantity: 2, unit: "hrs", rate: 40 }],
    [{ key: priceKey("Consumer unit change", "hr"), description: "Consumer unit change", unit: "hr", rate: 65, itemType: "labor" }]
  );
  assert.equal(hours.rate, 65);
  assert.equal(hours.unit, "hr");

  const [socket] = applyRememberedPrices(
    [{ type: "material", description: "Double switched socket outlets", quantity: 4, unit: "each", rate: 8 }],
    [{ key: priceKey("Double socket", "each"), description: "Double socket", unit: "each", rate: 12, itemType: "material" }]
  );
  assert.equal(socket.rate, 12);
  assert.equal(socket.usualPrice, true);
});

test("a call-out price does not replace other labour, and a labour rate does", () => {
  const [callout] = applyRememberedPrices(
    [{ type: "labor", description: "First fix labour", quantity: 6, unit: "hrs", rate: 40 }],
    [{ key: priceKey("Call-out", "hr"), description: "Call-out", unit: "hr", rate: 90, itemType: "labor" }]
  );
  assert.equal(callout.rate, 40);
  assert.equal(callout.usualPrice, false);

  const [general] = applyRememberedPrices(
    [{ type: "labor", description: "First fix labour", quantity: 6, unit: "hrs", rate: 40 }],
    [{ key: priceKey("Labour", "hr"), description: "Labour", unit: "hr", rate: 55, itemType: "labor" }]
  );
  assert.equal(general.rate, 55);
  assert.equal(general.usualPrice, true);

  const [dayLine] = applyRememberedPrices(
    [{ type: "labor", description: "Labour", quantity: 2, unit: "days", rate: 200 }],
    [
      { key: priceKey("Labour", "hr"), description: "Labour", unit: "hr", rate: 55, itemType: "labor" },
      { key: priceKey("Labour", "day"), description: "Labour", unit: "day", rate: 280, itemType: "labor" },
    ]
  );
  assert.equal(dayLine.rate, 280);
  assert.equal(dayLine.unit, "day");
});

test("the quote builder sends saved prices to the AI, and the guest demo does not", () => {
  const root = new URL("../", import.meta.url);
  const generate = fs.readFileSync(new URL("app/api/quote/generate/route.ts", root), "utf8");
  const demo = fs.readFileSync(new URL("app/api/quote/demo/route.ts", root), "utf8");
  const prices = fs.readFileSync(new URL("lib/price-memory.ts", root), "utf8");
  const tryPage = fs.readFileSync(new URL("app/try/TryClient.tsx", root), "utf8");
  const home = fs.readFileSync(new URL("app/page.tsx", root), "utf8");

  assert.match(generate, /rememberedPricesPrompt\(remembered\)/);
  assert.match(prices, /from\("price_memory"\)/);
  assert.match(prices, /order\("updated_at"/);
  assert.match(prices, /planPriceListUpsert/);
  assert.match(prices, /planPriceListDelete/);
  assert.match(prices, /if \(!ownerId\) return \{ ok: false/);

  assert.equal(demo.includes("price_memory"), false);
  assert.equal(demo.includes("rememberedPricesPrompt"), false);
  assert.equal(demo.includes("pricingMemory"), false);
  assert.equal(tryPage.includes("savePriceListEntry"), false);
  assert.equal(tryPage.includes("loadPriceList"), false);
  assert.equal(tryPage.includes("from(\"price_memory\")"), false);

  assert.equal(
    OWN_PRICES_LINE,
    "Set your day rate and prices once, and every quote uses them. The AI just does the quantities and the paperwork."
  );
  assert.match(TRY_PRICES_NOTE, /does not save a price list/);
  assert.match(TRY_PRICES_NOTE, /example prices/);
  assert.doesNotMatch(OWN_PRICES_LINE, /\d/);
  assert.match(home, /OWN_PRICES_LINE/);
  assert.match(tryPage, /OWN_PRICES_LINE/);
  assert.match(tryPage, /TRY_PRICES_NOTE/);
});
