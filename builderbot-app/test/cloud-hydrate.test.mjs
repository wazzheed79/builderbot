import test from "node:test";
import assert from "node:assert/strict";
import { cloudListsToStore } from "../lib/cloud-hydrate.mjs";

test("a failed cloud read does not replace quotes stored on the phone", () => {
  const stored = cloudListsToStore({
    customers: [],
    quotes: null,
    jobs: [{ id: "job-1" }],
    invoices: undefined,
  });
  assert.deepEqual(stored.customers, []);
  assert.equal("quotes" in stored, false);
  assert.deepEqual(stored.jobs, [{ id: "job-1" }]);
  assert.equal("invoices" in stored, false);
});
