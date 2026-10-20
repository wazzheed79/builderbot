import test from "node:test";
import assert from "node:assert/strict";

import { isPublicQuoteToken, quoteCardImagePath } from "../lib/public-quote.mjs";

test("Public quote tokens are the unguessable q_ links, not sample ids", () => {
  assert.equal(isPublicQuoteToken("q_demo_token_123"), true);
  assert.equal(isPublicQuoteToken("BB-1042"), false);
  assert.equal(isPublicQuoteToken("q_short"), false);
  assert.equal(isPublicQuoteToken(""), false);
});

test("Quote share cards point at the per-quote picture, not the site card", () => {
  assert.equal(quoteCardImagePath("q_demo_token_123"), "/q/q_demo_token_123/opengraph-image");
});
