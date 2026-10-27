import test from "node:test";
import assert from "node:assert/strict";

import { commitNumericDraft, nextNumericDraft } from "../lib/number-draft.mjs";

test("a lone 0 can be cleared, and the next digits replace it", () => {
  assert.equal(nextNumericDraft("0", ""), "");
  assert.equal(nextNumericDraft("0", "05"), "5");
  assert.equal(nextNumericDraft("0", "050"), "50");
  assert.equal(nextNumericDraft("0", "50"), "5");
  assert.equal(nextNumericDraft("0", "500"), "50");
  assert.equal(nextNumericDraft("0", "0."), "0.");
  assert.equal(nextNumericDraft("0", "0.5"), "0.5");
  assert.equal(nextNumericDraft("0", "5"), "5");
  assert.equal(nextNumericDraft("12", "120"), "120");
  assert.equal(nextNumericDraft("", "50"), "50");
  assert.equal(nextNumericDraft("4", "4."), "4.");
});

test("an empty price becomes 0 when the box is left, and a typed price is kept", () => {
  assert.equal(commitNumericDraft("", { emptyAs: 0 }), 0);
  assert.equal(commitNumericDraft("", { emptyAs: null }), null);
  assert.equal(commitNumericDraft("4.5"), 4.5);
  assert.equal(commitNumericDraft("4."), 4);
  assert.equal(commitNumericDraft("£1,200"), 1200);
  assert.equal(commitNumericDraft("3", { decimal: false, min: 1 }), 3);
  assert.equal(commitNumericDraft("", { decimal: false, emptyAs: 0, min: 1 }), 1);
  assert.equal(commitNumericDraft("150", { max: 100 }), 100);
});
