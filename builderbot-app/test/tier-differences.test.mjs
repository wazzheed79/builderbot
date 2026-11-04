import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { estimateTradeJob } from "../lib/trade-estimator.mjs";
import { buildChoiceOptions } from "../lib/quote-options.mjs";
import { GUEST_EXAMPLES, guestQuotePayload } from "../lib/guest-demo.mjs";
import { sanitizeGeneratedQuote } from "../lib/quote-ai.mjs";
import { quoteDraftForSave } from "../lib/quote-draft.mjs";
import {
  TIER_CHANGES_PROMPT,
  choiceHelp,
  fallbackTierChanges,
  ordinaryChangePoint,
  sanitizeTierChanges,
  selectTierPack,
  tierChangeHeading,
  visibleTierChanges,
} from "../lib/tier-differences.mjs";

const decoratingNotes = GUEST_EXAMPLES.find((example) => example.id === "decorating").notes;
const plumbingNotes = GUEST_EXAMPLES.find((example) => example.id === "plumbing").notes;

function extraRate(option) {
  return option.items[option.items.length - 1].rate;
}

test("a quote with no job keeps the old upgrade line and the same prices", () => {
  const items = [{ id: "1", type: "labor", description: "Labour", quantity: 4, unit: "hrs", rate: 50 }];
  const options = buildChoiceOptions(items, false, 0);
  assert.equal(options[0].total, 200);
  assert.equal(extraRate(options[1]), 30);
  assert.equal(extraRate(options[2]), 60);
  assert.equal(options[1].items.at(-1).description, "Upgraded materials and a neater finish");
  assert.equal(options[1].changes, undefined);
  assert.deepEqual(visibleTierChanges(options[1]), []);
  assert.equal(choiceHelp(options), "Pick one. The lines below match that choice.");
});

test("the decorating example names the extra prep and does not change the price", () => {
  const estimate = estimateTradeJob(decoratingNotes, "", null, []);
  const plain = buildChoiceOptions(estimate.items, true, estimate.suggestedDepositPercent);
  const payload = guestQuotePayload({
    ...estimate,
    notes: decoratingNotes,
    aiPowered: false,
  });

  assert.equal(selectTierPack({ notes: decoratingNotes, title: estimate.title, items: estimate.items }), "decorating-customer-paint");
  assert.equal(payload.options[1].total, plain[1].total);
  assert.equal(payload.options[2].total, plain[2].total);
  assert.equal(extraRate(payload.options[1]), extraRate(plain[1]));
  assert.equal(extraRate(payload.options[2]), extraRate(plain[2]));

  const better = payload.options[1].changes.join(" ");
  assert.match(better, /filled and sanded/i);
  assert.match(better, /extra coat/i);
  assert.match(better, /sharper line/i);
  assert.doesNotMatch(better, /washable paint/i);
  assert.doesNotMatch(payload.options[1].items.at(-1).description, /Upgraded materials and a neater finish/);
  assert.equal(payload.options[1].items.at(-1).description.includes("£"), false);
  assert.equal(tierChangeHeading("Standard"), "What's included");
  assert.equal(tierChangeHeading("Better"), "What changes from Standard");
  assert.equal(tierChangeHeading("Premium"), "What changes from Better");
  assert.match(choiceHelp(payload.options), /what changes/);
});

test("a decorating job where we supply the paint names the paint change", () => {
  const notes = "Paint living room walls and gloss skirting boards";
  const estimate = estimateTradeJob(notes, "", null, []);
  const options = buildChoiceOptions(estimate.items, true, estimate.suggestedDepositPercent, {
    notes,
    title: estimate.title,
    items: estimate.items,
  });
  const plain = buildChoiceOptions(estimate.items, true, estimate.suggestedDepositPercent);
  assert.equal(options[1].total, plain[1].total);
  assert.match(options[1].changes.join(" "), /durable washable paint/i);
  assert.match(options[2].changes.join(" "), /scrubbable|stain-blocking|hard-wearing/i);
});

test("plumbing and the other trade packs name a real difference and keep every price", () => {
  const jobs = [
    plumbingNotes,
    "Fit 6 fence panels and concrete posts with gravel boards",
    "Install new combi boiler and powerflush heating system",
    "Fit 10-way metal consumer unit and rewire kitchen sockets",
    "Replace 3 double sockets, half a day",
    "Replace broken roof slates and repair guttering",
    "Skim ceiling and 3 walls with thistle plaster",
    "Hang 4 new internal oak doors and fit skirting",
    "Tile bathroom shower area with porcelain tiles",
    "Build 1m high garden brick wall with coping stones",
    "Fit 8 kitchen base and wall cabinets and laminate worktops",
    "Dig out sub-base and lay 30m2 Indian sandstone patio",
    "Build raised composite decking area with balustrades",
    "Lay laminate flooring with underlay in the lounge",
    "Lay new turf and topsoil for the back lawn",
    "Replace the guttering and downpipe",
    "Fit two new double glazed windows",
    "Strip out the kitchen and load a skip",
    "Replace the broken door handle",
  ];

  for (const notes of jobs) {
    const estimate = estimateTradeJob(notes, "", null, []);
    const plain = buildChoiceOptions(estimate.items, true, estimate.suggestedDepositPercent);
    const options = buildChoiceOptions(estimate.items, true, estimate.suggestedDepositPercent, {
      notes,
      title: estimate.title,
      items: estimate.items,
    });
    assert.equal(options[1].total, plain[1].total, notes);
    assert.equal(options[2].total, plain[2].total, notes);
    assert.equal(extraRate(options[1]), extraRate(plain[1]), notes);
    assert.equal(extraRate(options[2]), extraRate(plain[2]), notes);
    for (const option of options) {
      assert.ok(option.changes.length >= 2, notes);
      for (const line of option.changes) {
        assert.ok(line.length <= 90, `${notes}: ${line}`);
        assert.equal(/£|\b\d+(?:\.\d+)?\s*%/.test(line), false, line);
        assert.doesNotMatch(line, /upgraded materials|neater finish/i);
        if (option.label !== "Standard") {
          assert.equal(ordinaryChangePoint(line), false, `${notes}: ${line}`);
        }
      }
    }
    assert.equal(selectTierPack({ notes, title: estimate.title, items: estimate.items }) === "general", false, notes);
  }

  const plumbing = fallbackTierChanges({ notes: plumbingNotes, title: "Plumbing Call-Out & Repair" });
  assert.match(plumbing.better.join(" "), /trap|mixer tap/i);
});

test("usable model points replace the trade list and still do not change the price", () => {
  const items = [{ description: "Walls", quantity: 1, unit: "job", rate: 100 }];
  const tierChanges = {
    standard: ["Walls painted in the white emulsion you supply", "Dust sheets down before we start"],
    better: ["Nail holes filled and sanded before any paint", "An extra coat on the walls"],
    premium: ["Caulk along the skirtings before the last coat", "Touch-ups checked in daylight"],
  };
  const plain = buildChoiceOptions(items, false, 0);
  const options = buildChoiceOptions(items, false, 0, {
    notes: decoratingNotes,
    tierChanges,
  });
  assert.equal(options[1].total, plain[1].total);
  assert.equal(options[1].changes[0], tierChanges.better[0]);
  assert.match(options[1].items.at(-1).description, /Nail holes filled/);
});

test("a model reply with prices or vague lines is dropped and the trade list is used", () => {
  assert.equal(sanitizeTierChanges(null), null);
  assert.equal(
    sanitizeTierChanges({
      standard: ["Upgraded materials"],
      better: ["A neater finish"],
      premium: ["Premium materials"],
    }),
    null
  );
  assert.equal(
    sanitizeTierChanges({
      standard: ["Walls in the emulsion you supply", "Woodwork in the satin you supply"],
      better: ["An extra coat for £107.10", "Filled holes"],
      premium: ["Better by 15%", "Another coat"],
    }),
    null
  );

  const notes = "Paint the hall and the stairs";
  const estimate = estimateTradeJob(notes, "", null, []);
  const cleaned = sanitizeGeneratedQuote(
    {
      ...estimate,
      tierChanges: {
        standard: ["Upgraded materials and a neater finish"],
        better: ["£50 of nicer paint"],
        premium: ["Same as better", "Same as better"],
      },
    },
    { notes }
  );
  assert.equal(cleaned.ok, true);
  assert.equal(cleaned.tierChanges, null);
  assert.equal(cleaned.items[0].rate, estimate.items[0].rate);

  const options = buildChoiceOptions(cleaned.items, true, cleaned.suggestedDepositPercent, {
    notes,
    title: cleaned.title,
    items: cleaned.items,
    tierChanges: cleaned.tierChanges,
  });
  assert.match(options[1].changes.join(" "), /washable paint|extra coat|filled/i);
});

test("an older saved option with no points still has nothing to show", () => {
  assert.deepEqual(visibleTierChanges({ label: "Better", items: [] }), []);
  assert.deepEqual(
    visibleTierChanges({
      changes: ["Nail holes filled and sanded first", 4, "£10 more paint", "short", "An extra coat on the walls"],
    }),
    ["Nail holes filled and sanded first", "An extra coat on the walls"]
  );
});

test("saving a quote keeps the tier prices and the points", () => {
  const notes = "Paint two bedrooms. The customer is supplying the paint.";
  const estimate = estimateTradeJob(notes, "", null, []);
  const choices = buildChoiceOptions(estimate.items, false, 0, {
    notes,
    title: estimate.title,
    items: estimate.items,
  });
  const saved = quoteDraftForSave({
    items: estimate.items,
    vatEnabled: false,
    depositPercent: 0,
    choiceOptions: choices,
    choiceIndex: 0,
    notesInput: notes,
    quoteTitle: estimate.title,
  });
  assert.equal(saved.options[1].total, choices[1].total);
  assert.equal(extraRate(saved.options[1]), extraRate(choices[1]));
  assert.match(saved.options[1].changes.join(" "), /extra coat/i);
});

test("what changes drops ordinary work, and keeps a real upgrade", () => {
  const cleaned = sanitizeTierChanges({
    standard: [
      "Light filling and surface sanding",
      "Two coats of customer-supplied paint to walls and ceilings",
      "Two coats of customer-supplied satin to woodwork",
    ],
    better: [
      "Nail holes and deep cracks filled, sanded and primed first",
      "Caulking on skirtings, door frames and sills",
      "Standard dust sheet protection and edge masking included",
    ],
    premium: [
      "Knotting, spot priming and deep filling",
      "Dustless sanding extraction",
      "An extra coat on high-wear trim",
    ],
  });
  assert.ok(cleaned);
  assert.match(cleaned.standard.join(" "), /customer-supplied paint/);
  assert.equal(cleaned.better.some((line) => /dust sheet|masking/i.test(line)), false);
  assert.match(cleaned.better.join(" "), /nail holes/i);
  assert.match(cleaned.better.join(" "), /caulking/i);
  assert.match(cleaned.premium.join(" "), /dustless sanding/i);
  assert.equal(cleaned.better.length, 2);
  assert.equal(cleaned.premium.length, 3);

  const shown = visibleTierChanges({
    label: "Better",
    changes: [
      "Nail holes and deep cracks filled, sanded and primed first",
      "Standard dust sheet protection and edge masking included",
    ],
  });
  assert.deepEqual(shown, ["Nail holes and deep cracks filled, sanded and primed first"]);
  const included = visibleTierChanges({
    label: "Standard",
    changes: ["Dust sheets, masking, and a clean-up", "Two coats of the paint you supply"],
  });
  assert.equal(included.length, 2);
});

test("a change list that is only ordinary work falls back to the trade list", () => {
  assert.equal(
    sanitizeTierChanges({
      standard: ["Walls in the emulsion you supply", "Woodwork in the satin you supply"],
      better: ["Standard dust sheets included", "Masking included as standard", "A clean-up at the end"],
      premium: ["Dust sheet protection", "Edge masking", "Clean-up included"],
    }),
    null
  );

  const notes = "Paint the hall. The customer is supplying the paint.";
  const estimate = estimateTradeJob(notes, "", null, []);
  const plain = buildChoiceOptions(estimate.items, true, estimate.suggestedDepositPercent);
  const options = buildChoiceOptions(estimate.items, true, estimate.suggestedDepositPercent, {
    notes,
    title: estimate.title,
    items: estimate.items,
    tierChanges: {
      standard: ["Walls in the emulsion you supply", "Woodwork in the satin you supply"],
      better: ["Standard dust sheets included", "Masking included as standard"],
      premium: ["A clean-up when finished", "Dust sheets left down"],
    },
  });
  assert.equal(options[1].total, plain[1].total);
  assert.equal(options[2].total, plain[2].total);
  assert.match(options[1].changes.join(" "), /filled and sanded|extra coat/i);
  assert.equal(options[1].changes.some((line) => ordinaryChangePoint(line)), false);
  assert.equal(options[0].changes.some((line) => /dust sheets/i.test(line)), true);
});

test("the quote prompts ask for concrete tier changes and do not price them", () => {
  assert.match(TIER_CHANGES_PROMPT, /what changes compared with Standard/i);
  assert.match(TIER_CHANGES_PROMPT, /durable washable paint/);
  assert.match(TIER_CHANGES_PROMPT, /supplying the paint/);
  assert.match(TIER_CHANGES_PROMPT, /Do not put prices/);
  assert.match(TIER_CHANGES_PROMPT, /only real differences/i);
  assert.match(TIER_CHANGES_PROMPT, /dust sheets, masking, a clean-up/);
  assert.match(TIER_CHANGES_PROMPT, /included as standard/);

  for (const file of ["../app/api/quote/generate/route.ts", "../app/api/quote/demo/route.ts"]) {
    const source = fs.readFileSync(new URL(file, import.meta.url), "utf8");
    assert.match(source, /tierChangesSchema/);
    assert.match(source, /TIER_CHANGES_PROMPT/);
    assert.match(source, /"tierChanges"/);
  }
});
