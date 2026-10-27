import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { clearWorkingDraft, readWorkingDraft, shouldOfferRecovery, writeWorkingDraft } from "../lib/quote-autosave.mjs";
import { discardQuotePlan, forgetWorkingDraftIfQuote, workingDraftMatchesQuote } from "../lib/quote-discard.mjs";
import { linesFromPriceList, lineFromPriceList } from "../lib/price-memory.mjs";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

test("discard deletes a draft and leaves a sent quote in the list", () => {
  const draft = discardQuotePlan({
    activeQuoteId: "BB-2001",
    activeStatus: "Draft",
    cloudDraftId: "draft-abc",
  });
  assert.deepEqual(draft.deleteIds, ["draft-abc", "BB-2001"]);
  assert.equal(draft.keepsSentQuote, false);

  const sent = discardQuotePlan({
    activeQuoteId: "BB-2002",
    activeStatus: "Sent",
    cloudDraftId: "BB-2002",
  });
  assert.deepEqual(sent.deleteIds, []);
  assert.equal(sent.keepsSentQuote, true);

  const unsaved = discardQuotePlan({ cloudDraftId: "draft-only" });
  assert.deepEqual(unsaved.deleteIds, ["draft-only"]);
});

test("discarding the working copy means sign-in does not offer it again", () => {
  const storage = memoryStorage();
  const saved = writeWorkingDraft(
    storage,
    { notesInput: "New boiler fit", clientName: "Pat", activeQuoteId: "BB-9", cloudDraftId: "draft-9" },
    "2026-10-27T08:00:00.000Z"
  );
  assert.equal(shouldOfferRecovery(saved, null), true);
  assert.equal(workingDraftMatchesQuote(saved, "BB-9"), true);
  assert.equal(workingDraftMatchesQuote(saved, "draft-9"), true);
  assert.equal(forgetWorkingDraftIfQuote(storage, "BB-9"), true);
  assert.equal(readWorkingDraft(storage), null);
  assert.equal(shouldOfferRecovery(readWorkingDraft(storage), null), false);
  clearWorkingDraft(storage);
});

test("ticked prices become quote lines and do not edit the saved price", () => {
  const boiler = { description: "New boiler", unit: "each", rate: 1800, itemType: "material" };
  const pipe = { description: "15mm copper pipe", unit: "m", rate: 4.5, itemType: "material" };
  const lines = linesFromPriceList([boiler, pipe, { description: "x" }]);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].description, "New boiler");
  assert.equal(lines[0].quantity, 1);
  assert.equal(lines[0].rate, 1800);
  assert.equal(lines[0].rateSource, "list");
  assert.equal(lines[1].description, "15mm copper pipe");
  assert.deepEqual(lineFromPriceList(boiler).rate, 1800);
});

test("the new quote screen leads with the job, a price picker, and discard", () => {
  const root = new URL("../", import.meta.url);
  const quotes = fs.readFileSync(new URL("app/quotes/QuotesClient.tsx", root), "utf8");
  const picker = fs.readFileSync(new URL("components/quotes/PriceListPicker.tsx", root), "utf8");
  const editor = fs.readFileSync(new URL("components/quotes/LineItemEditor.tsx", root), "utf8");
  const dashboard = fs.readFileSync(new URL("app/dashboard/page.tsx", root), "utf8");
  const jobAt = quotes.indexOf("What is the job?");
  const templatesAt = quotes.indexOf("<QuoteTemplatesBar");
  assert.ok(jobAt > 0 && templatesAt > jobAt);
  assert.match(quotes, /placeholder="New boiler fit"/);
  assert.match(quotes, /Add from my price list/);
  assert.match(quotes, /Discard quote/);
  assert.match(quotes, /Discard this quote\?/);
  assert.match(quotes, /onBrowsePrices/);
  assert.doesNotMatch(quotes, /href="\/settings\/prices"[\s\S]{0,120}My price list/);
  assert.match(picker, /type="checkbox"/);
  assert.match(picker, /Add saved prices/);
  assert.match(picker, /Edit price list/);
  assert.match(picker, /does not change your saved list/);
  assert.match(editor, /onBrowsePrices/);
  assert.match(dashboard, /DeleteDraftQuote/);
  assert.match(dashboard, /q\.status === "Draft"/);
});
