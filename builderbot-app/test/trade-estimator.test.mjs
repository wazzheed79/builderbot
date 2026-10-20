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

  const sockets = estimateTradeJob("Replace 3 double sockets, half a day");
  assert.equal(sockets.title, "Socket Replacement");
  assert.equal(
    sockets.items.some((i) => /consumer unit/i.test(i.description)),
    false
  );
  const socketMaterials = sockets.items.find((i) => i.type === "material");
  assert.equal(socketMaterials.quantity, 3);
  const socketLabour = sockets.items.find((i) => i.type === "labor");
  assert.equal(socketLabour.quantity, 4);
  assert.equal(socketLabour.unit, "hrs");

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

  // 9. Bricklaying & Masonry
  const brick = estimateTradeJob("Build 1m high garden brick wall with coping stones");
  assert.equal(brick.title, "Brickwork, Masonry & Wall Construction");
  assert.ok(brick.items.some((i) => i.description.includes("Bricks")));

  // 10. Kitchen Fitting
  const kitchen = estimateTradeJob("Fit 8 kitchen base and wall cabinets and laminate worktops");
  assert.equal(kitchen.title, "Kitchen Fitting & Worktop Installation");
  assert.ok(kitchen.items.some((i) => i.description.includes("Worktops")));

  // 11. Patio & Paving
  const patio = estimateTradeJob("Dig out sub-base and lay 30m2 Indian sandstone patio");
  assert.equal(patio.title, "Patio, Paving & Groundworks");
  assert.ok(patio.items.some((i) => i.description.includes("Sandstone")));

  // 12. Decking
  const deck = estimateTradeJob("Build raised composite decking area with balustrades");
  assert.equal(deck.title, "Decking & Timber Structures");
  assert.ok(deck.items.some((i) => i.description.includes("Decking")));

  // 13. Flooring
  const floor = estimateTradeJob("Fit 25m2 laminate flooring and underlay with scotia beading");
  assert.equal(floor.title, "Flooring Installation & Subfloor Preparation");
  assert.ok(floor.items.some((i) => i.description.includes("Flooring")));

  // 14. Turfing & Landscaping
  const turf = estimateTradeJob("Rotovate garden soil and lay 50m2 turf lawn");
  assert.equal(turf.title, "Landscaping & Lawn Installation");
  assert.ok(turf.items.some((i) => i.description.includes("Turf")));

  // 15. Windows & Glazing
  const windowJob = estimateTradeJob("Replace 2 uPVC double glazed casement windows");
  assert.equal(windowJob.title, "Window & Door Glazing Installation");
  assert.ok(windowJob.items.some((i) => i.description.includes("Windows")));

  // 16. Demolition & Strip-Out
  const demo = estimateTradeJob("Demolish internal partition wall and strip out rubbish to skip");
  assert.equal(demo.title, "Demolition, Strip-Out & Site Clearance");
  assert.ok(demo.items.some((i) => i.description.includes("Skip")));

  // 17. Any completely custom / arbitrary prompt
  const bespoke = estimateTradeJob("Install outdoor cedar sauna in corner of back garden");
  assert.equal(bespoke.title, "Specified Trade Works & Labour");
  assert.ok(bespoke.items.some((i) => i.description.includes("Trade materials")));
  assert.ok(bespoke.items.some((i) => i.type === "labor"));
  assert.ok(bespoke.items.length >= 3);
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
