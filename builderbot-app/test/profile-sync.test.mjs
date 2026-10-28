import test from "node:test";
import assert from "node:assert/strict";

import { profileUpsertOptions } from "../lib/profile-sync.mjs";

test("a later profile save updates the existing account row", () => {
  assert.deepEqual(profileUpsertOptions(), { onConflict: "owner_id" });
});
