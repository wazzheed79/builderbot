import test from "node:test";
import assert from "node:assert/strict";
import { quoteDraftForSave } from "../lib/quote-draft.mjs";

const drivewayTemplate = [
  { id: "t4-1", type: "material", description: "Standard 50mm Charcoal Block Paving (45 square metres)", quantity: 45, unit: "m²", rate: 24 },
  { id: "t4-2", type: "material", description: "MOT Type 1 Roadstone Sub-base (6 Bulk Bags) + Heavy Geotextile Membrane", quantity: 6, unit: "bags", rate: 68 },
  { id: "t4-3", type: "labor", description: "Groundworks team excavation, sub-base compaction & block laying", quantity: 32, unit: "hrs", rate: 48 },
  { id: "t4-4", type: "service", description: "Grab wagon soil removal & compactor plate machinery hire", quantity: 1, unit: "hire", rate: 360 },
];

const staleEstimate = [
  {
    id: "opt-standard",
    label: "Standard",
    items: [{ id: "line-1", description: "Calibrated Indian Sandstone", quantity: 25, unit: "m²", rate: 32 }],
    subtotal: 800,
    vat: 0,
    total: 800,
    deposit: 160,
  },
  {
    id: "opt-better",
    label: "Better",
    items: [{ id: "line-1", description: "Calibrated Indian Sandstone", quantity: 25, unit: "m²", rate: 32 }],
    subtotal: 920,
    vat: 0,
    total: 920,
    deposit: 184,
  },
];

test("Saving uses the lines on screen, not an earlier rough estimate", () => {
  const saved = quoteDraftForSave({
    items: drivewayTemplate,
    vatEnabled: false,
    depositPercent: 20,
    choiceOptions: staleEstimate,
    choiceIndex: 0,
  });

  assert.equal(saved.total, 3384);
  assert.equal(saved.deposit, 676.8);
  assert.equal(saved.items[0].description, drivewayTemplate[0].description);
  assert.equal(saved.options[0].items[0].description, drivewayTemplate[0].description);
  assert.equal(saved.options[1].total, 3891.6);
  assert.ok(!JSON.stringify(saved.options).includes("Indian Sandstone"));
});
