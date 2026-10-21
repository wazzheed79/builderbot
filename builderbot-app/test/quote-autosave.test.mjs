import test from "node:test";
import assert from "node:assert/strict";
import {
  autosaveRowToRetire,
  clearWorkingDraft,
  cloudSyncPlan,
  ensureCloudIdentity,
  readWorkingDraft,
  recoveryWhenLabel,
  shouldOfferRecovery,
  toCloudDraftQuote,
  writeWorkingDraft,
} from "../lib/quote-autosave.mjs";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

const notes = "Replace the boiler, 2 days, Worcester Bosch";

test("a quote being typed is still there after a refresh", () => {
  const storage = memoryStorage();
  writeWorkingDraft(
    storage,
    {
      notesInput: notes,
      quoteTitle: "Boiler swap",
      clientName: "Sarah Jenkins",
      items: [{ id: "line-1", description: "Combi boiler", quantity: 1, unit: "unit", rate: 1800 }],
      vatEnabled: true,
      depositPercent: 20,
    },
    "2026-10-21T08:00:00.000Z"
  );
  const again = readWorkingDraft(storage);
  assert.equal(again.notesInput, notes);
  assert.equal(again.clientName, "Sarah Jenkins");
  assert.equal(again.items.length, 1);
  assert.equal(again.items[0].rate, 1800);
});

test("an empty form does not wipe the saved draft", () => {
  const storage = memoryStorage();
  writeWorkingDraft(storage, { notesInput: notes }, "2026-10-21T08:00:00.000Z");
  const kept = writeWorkingDraft(storage, { notesInput: "  ", items: [] }, "2026-10-21T08:05:00.000Z");
  assert.equal(kept.notesInput, notes);
  assert.equal(readWorkingDraft(storage).notesInput, notes);
});

test("a hundred lines survive a restart", () => {
  const storage = memoryStorage();
  const items = Array.from({ length: 100 }, (_, index) => ({
    id: `line-${index + 1}`,
    description: `Pointing course ${index + 1}`,
    quantity: 1,
    unit: "m",
    rate: 12,
  }));
  writeWorkingDraft(storage, { items, quoteTitle: "Long wall" }, "2026-10-21T08:00:00.000Z");
  const again = readWorkingDraft(storage);
  assert.equal(again.items.length, 100);
  assert.equal(again.items[99].description, "Pointing course 100");
});

test("recovery is offered on the next open, and discarded when asked", () => {
  const storage = memoryStorage();
  const saved = writeWorkingDraft(storage, { clientName: "Pat" }, "2026-10-21T08:00:00.000Z");
  assert.equal(shouldOfferRecovery(saved, null), true);
  assert.equal(shouldOfferRecovery(saved, "BB-2000"), false);
  assert.equal(shouldOfferRecovery({ ...saved, activeQuoteId: "BB-1044" }, "BB-1044"), true);
  clearWorkingDraft(storage);
  assert.equal(readWorkingDraft(storage), null);
  assert.equal(shouldOfferRecovery(null, null), false);
});

test("the recovery label uses the saved time", () => {
  const now = Date.parse("2026-10-21T10:00:00.000Z");
  assert.equal(recoveryWhenLabel("2026-10-21T09:59:30.000Z", now), "just now");
  assert.equal(recoveryWhenLabel("2026-10-21T09:40:00.000Z", now), "20 minutes ago");
});

test("offline keeps the draft local, and a sent quote is not overwritten online", () => {
  const snapshot = { notesInput: notes, clientName: "Pat" };
  assert.equal(cloudSyncPlan({ online: false, signedIn: true, snapshot }), "wait");
  assert.equal(cloudSyncPlan({ online: true, signedIn: true, snapshot }), "sync");
  assert.equal(cloudSyncPlan({ online: true, signedIn: false, snapshot }), "skip");
  assert.equal(
    cloudSyncPlan({ online: true, signedIn: true, snapshot, existingStatus: "Sent" }),
    "skip"
  );
  assert.equal(
    cloudSyncPlan({ online: true, signedIn: true, snapshot, existingStatus: "Draft" }),
    "sync"
  );
  assert.equal(
    cloudSyncPlan({
      online: true,
      signedIn: true,
      snapshot: { ...snapshot, activeQuoteId: "BB-1044" },
    }),
    "skip"
  );
});

test("a working copy does not reuse a saved quote number", () => {
  const minted = ensureCloudIdentity({ notesInput: "New boiler", clientName: "Pat" }, () => "q_testtoken123456");
  assert.equal(String(minted.cloudDraftId).startsWith("draft-"), true);
  assert.equal(String(minted.cloudDraftId).startsWith("BB-"), false);
  const same = ensureCloudIdentity(minted, () => "q_other");
  assert.equal(same.cloudDraftId, minted.cloudDraftId);

  const open = ensureCloudIdentity({
    notesInput: "New boiler",
    activeQuoteId: "BB-1044",
    activeToken: "q_existingtoken1234",
  });
  assert.equal(open.cloudDraftId, "BB-1044");
  assert.equal(autosaveRowToRetire("draft-abc123", ""), "draft-abc123");
  assert.equal(autosaveRowToRetire("BB-1044", "BB-1044"), "");
});

test("a signed-in draft syncs as a draft quote with the prices on screen", () => {
  const quote = toCloudDraftQuote(
    {
      cloudDraftId: "BB-1100",
      cloudDraftToken: "q_autosavedrafttoken",
      clientName: "Pat",
      notesInput: notes,
      items: [{ description: "Labour", quantity: 2, rate: 50, unit: "hrs", type: "labor" }],
      vatEnabled: false,
      depositPercent: 20,
    },
    "2026-10-21"
  );
  assert.equal(quote.status, "Draft");
  assert.equal(quote.id, "BB-1100");
  assert.equal(quote.total, 100);
  assert.equal(quote.deposit, 20);
});
