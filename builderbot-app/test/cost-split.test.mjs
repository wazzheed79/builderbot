import test from "node:test";
import assert from "node:assert/strict";

import { linesForQuoteTotal, splitCostTotals } from "../lib/cost-split.mjs";
import { buildChoiceOptions } from "../lib/quote-options.mjs";
import { preparePrintableQuote } from "../lib/quote-print.mjs";
import { recalculateQuoteTotals, roundMoney } from "../lib/quote-rules.mjs";

test("materials and labour are split, and a £0 row is hidden", () => {
  const split = splitCostTotals([
    { type: "material", description: "Copper pipe", quantity: 4, rate: 3.5 },
    { type: "labor", description: "Fitting", quantity: 2, rate: 45 },
    { type: "material", description: "Free offcut", quantity: 1, rate: 0 },
    { type: "service", description: "No skip", quantity: 1, rate: 0 },
  ]);

  assert.equal(split.material, 14);
  assert.equal(split.labor, 90);
  assert.equal(split.other, 0);
  assert.equal(split.subtotal, 104);
  assert.deepEqual(
    split.rows.map((row) => row.label),
    ["Materials", "Labour"]
  );
  assert.equal(
    roundMoney(split.rows.reduce((sum, row) => sum + row.amount, 0)),
    split.subtotal
  );
});

test("services and other appear only when that kind of line has a price", () => {
  const split = splitCostTotals([
    { type: "material", quantity: 1, rate: 100 },
    { type: "labour", quantity: 1, rate: 50 },
    { type: "service", quantity: 1, rate: 30 },
  ]);

  assert.equal(split.labor, 50);
  assert.equal(split.other, 30);
  assert.deepEqual(
    split.rows.map((row) => [row.label, row.amount]),
    [
      ["Materials", 100],
      ["Labour", 50],
      ["Services/Other", 30],
    ]
  );
});

test("an older line with no type still counts as materials", () => {
  const split = splitCostTotals([{ description: "Boiler", quantity: 1, rate: 900 }]);
  assert.equal(split.material, 900);
  assert.equal(split.labor, 0);
  assert.equal(split.rows.length, 1);
  assert.equal(split.rows[0].label, "Materials");
  assert.equal(splitCostTotals(null).rows.length, 0);
  assert.equal(splitCostTotals(undefined).subtotal, 0);
});

test("negative quantities and rates are left out of the totals", () => {
  const split = splitCostTotals([
    { type: "material", quantity: -2, rate: 10 },
    { type: "labor", quantity: 1, rate: -5 },
    { type: "labor", quantity: 2, rate: 20 },
  ]);
  assert.equal(split.material, 0);
  assert.equal(split.labor, 40);
  assert.equal(split.rows.length, 1);
});

test("a penny of rounding still adds up to the net subtotal", () => {
  const items = [
    { type: "material", quantity: 1, rate: 0.014 },
    { type: "labor", quantity: 1, rate: 0.014 },
  ];
  const totals = recalculateQuoteTotals(items, true, 0);
  const split = splitCostTotals(items, totals.subtotal);
  assert.equal(split.subtotal, totals.subtotal);
  assert.equal(roundMoney(split.material + split.labor + split.other), totals.subtotal);
  assert.equal(totals.vat, roundMoney(totals.subtotal * 0.2));
  assert.equal(totals.total, roundMoney(totals.subtotal + totals.vat));
});

test("Standard, Better, and Premium still add up, and VAT stays 20% of the net", () => {
  const items = [
    { type: "material", description: "Tiles", quantity: 10, unit: "m2", rate: 12.5 },
    { type: "labor", description: "Fixing", quantity: 8, unit: "hrs", rate: 45 },
  ];
  const plain = recalculateQuoteTotals(items, true, 20);
  const options = buildChoiceOptions(items, true, 20, {
    title: "Bathroom tiles",
    notes: "tile the bathroom",
    trade: "tiling",
  });

  assert.equal(options.length, 3);
  assert.equal(options[0].subtotal, plain.subtotal);
  assert.equal(options[0].vat, plain.vat);
  assert.equal(options[0].total, plain.total);
  assert.equal(options[0].vat, 97);

  for (const option of options) {
    const split = splitCostTotals(option.items, option.subtotal);
    assert.equal(roundMoney(split.material + split.labor + split.other), option.subtotal);
    assert.equal(roundMoney(option.subtotal + option.vat), option.total);
    assert.equal(option.vat, roundMoney(option.subtotal * 0.2));
  }

  const standard = splitCostTotals(options[0].items, options[0].subtotal);
  const better = splitCostTotals(options[1].items, options[1].subtotal);
  const premium = splitCostTotals(options[2].items, options[2].subtotal);
  assert.equal(standard.other, 0);
  assert.equal(standard.rows.some((row) => row.label === "Services/Other"), false);
  assert.equal(better.material, 125);
  assert.equal(better.labor, 360);
  assert.equal(better.other, roundMoney(options[1].subtotal - options[0].subtotal));
  assert.equal(premium.material, 125);
  assert.equal(premium.labor, 360);
  assert.ok(premium.other > better.other);
  assert.equal(better.rows.some((row) => row.label === "Services/Other"), true);
});

test("a chosen tier is what the customer total is built from", () => {
  const standardItems = [{ type: "material", description: "Pipe", quantity: 1, rate: 40 }];
  const betterItems = [
    ...standardItems,
    { type: "service", description: "Better finish", quantity: 1, rate: 15 },
  ];
  const quote = {
    total: 55,
    selectedOptionId: "opt-better",
    items: standardItems,
    options: [
      { id: "opt-standard", total: 40, items: standardItems },
      { id: "opt-better", total: 55, items: betterItems },
    ],
  };
  const lines = linesForQuoteTotal(quote);
  assert.equal(lines.length, 2);
  const split = splitCostTotals(lines, 55);
  assert.equal(split.material, 40);
  assert.equal(split.other, 15);
  assert.equal(split.subtotal, 55);

  const notYetChosen = linesForQuoteTotal({ ...quote, total: 40, selectedOptionId: "opt-better" });
  assert.equal(notYetChosen.length, 1);
});

test("the printout lists materials and labour above the VAT total", () => {
  const printed = preparePrintableQuote({
    items: [
      { type: "material", description: "Copper", quantity: 2, unit: "m", rate: 10 },
      { type: "labor", description: "Fitting", quantity: 1, unit: "hr", rate: 50 },
    ],
    vatEnabled: true,
    depositPercent: 0,
  });
  assert.deepEqual(printed.costRows, [
    { key: "material", label: "Materials", amount: "£20.00" },
    { key: "labor", label: "Labour", amount: "£50.00" },
  ]);
  assert.equal(printed.subtotal, "£70.00");
  assert.equal(printed.vat, "£14.00");
  assert.equal(printed.total, "£84.00");

  const freeCallOut = preparePrintableQuote({
    items: [{ description: "Call-out", quantity: 1, unit: "visit", rate: 0, type: "labor" }],
    vatEnabled: false,
    depositPercent: 0,
  });
  assert.deepEqual(freeCallOut.costRows, []);
  assert.equal(freeCallOut.total, "£0.00");
});
