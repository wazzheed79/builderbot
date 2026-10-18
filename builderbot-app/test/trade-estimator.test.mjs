import test from "node:test";
import assert from "node:assert/strict";
import { estimateTradeJob } from "../lib/trade-estimator.mjs";

test("estimateTradeJob: generates realistic breakdowns across all major UK trades", () => {
  // 1. Fencing
  const fence = estimateTradeJob("Fit 6 fence panels and concrete posts with gravel boards");
  assert.equal(fence.title, "Timber Fencing & Post Installation");
  assert.ok(fence.items.some((i) => i.description.includes("Featheredge Panels")));
  assert.ok(fence.items.some((i) => i.type === "labor"));

  // 2. Plumbing / Boiler
  const boiler = estimateTradeJob("Install new combi boiler and powerflush heating system");
  assert.equal(boiler.title, "Heating & Plumbing Installation");
  assert.ok(boiler.items.some((i) => i.description.includes("Combi Boiler")));
  assert.equal(boiler.suggestedDepositPercent, 25);

  // 3. Electrical
  const spark = estimateTradeJob("Fit 10-way metal consumer unit and rewire kitchen sockets");
  assert.equal(spark.title, "Electrical Installation & Upgrades");
  assert.ok(spark.items.some((i) => i.description.includes("Consumer Unit")));

  // 4. Roofing
  const roof = estimateTradeJob("Replace broken roof slates and repair guttering");
  assert.equal(roof.title, "Roofing Repair & Weatherproofing");
  assert.ok(roof.items.some((i) => i.description.includes("Slates")));

  // 5. Plastering
  const plaster = estimateTradeJob("Skim ceiling and 3 walls with thistle plaster");
  assert.equal(plaster.title, "Internal Plastering & Skimming");
  assert.ok(plaster.items.some((i) => i.description.includes("Multi-Finish")));

  // 6. Painting
  const paint = estimateTradeJob("Paint living room walls and gloss skirting boards");
  assert.equal(paint.title, "Painting & Decorating Works");
  assert.ok(paint.items.some((i) => i.description.includes("Vinyl Matt Emulsion")));

  // 7. Carpentry
  const doors = estimateTradeJob("Hang 4 new internal oak doors and fit skirting");
  assert.equal(doors.title, "Carpentry & Joinery Installation");
  assert.ok(doors.items.some((i) => i.description.includes("Doors")));

  // 8. Bathroom / Tile
  const bath = estimateTradeJob("Tile bathroom shower area with porcelain tiles");
  assert.equal(bath.title, "Bathroom Fitting & Wall Tiling");
  assert.ok(bath.items.some((i) => i.description.includes("Tiles")));

  // 9. Generic / General Works
  const general = estimateTradeJob("Various handyman repair jobs in back shed");
  assert.equal(general.title, "Specified Trade Works & Labour");
  assert.ok(general.items.length >= 3);
});

test("estimateTradeJob: calibrates labor rates using contractor pricingMemory DNA", () => {
  const customEstimate = estimateTradeJob(
    "Fit 6 fence panels and concrete posts",
    "Fencing",
    { laborHourlyRate: 62.5, laborDayRate: 340 }
  );
  const laborItem = customEstimate.items.find((i) => i.type === "labor");
  assert.ok(laborItem);
  assert.equal(laborItem.rate, 62.5);
});

test("estimateTradeJob: cross-references site inspection photos in scope of work", () => {
  const withPhotos = estimateTradeJob(
    "Replace damaged garden fence",
    "Fencing",
    null,
    ["data:image/jpeg;base64,sample1", "data:image/jpeg;base64,sample2"]
  );
  assert.ok(withPhotos.scopeOfWork.includes("2 site inspection photo(s)"));
});
