import test from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_ORIGIN, legacyDomainLocation, legacyRedirects } from "../lib/domain-redirect.mjs";

test("the old domain permanently redirects to the same path on Chuffed Quotes", () => {
  const quote = legacyDomainLocation(
    "tradematequotes.co.uk",
    "/q/q_abc1234567890def",
    "?ref=whatsapp"
  );
  assert.equal(quote, `${CANONICAL_ORIGIN}/q/q_abc1234567890def?ref=whatsapp`);

  const wwwQuote = legacyDomainLocation("www.tradematequotes.co.uk", "/q/q_abc1234567890def", "");
  assert.equal(wwwQuote, `${CANONICAL_ORIGIN}/q/q_abc1234567890def`);

  const callback = legacyDomainLocation(
    "www.tradematequotes.co.uk:443",
    "/auth/callback",
    "?code=pkce-code"
  );
  assert.equal(callback, `${CANONICAL_ORIGIN}/auth/callback?code=pkce-code`);

  const confirm = legacyDomainLocation(
    "tradematequotes.co.uk",
    "/auth/confirm",
    "token_hash=abc&type=magiclink"
  );
  assert.equal(confirm, `${CANONICAL_ORIGIN}/auth/confirm?token_hash=abc&type=magiclink`);

  assert.equal(legacyDomainLocation("www.chuffedquotes.co.uk", "/q/q_abc1234567890def", ""), null);
  assert.equal(legacyDomainLocation("chuffedquotes.co.uk", "/quotes", ""), null);
  assert.equal(legacyDomainLocation("builderbot.vercel.app", "/auth/callback", "?code=1"), null);

  const rules = legacyRedirects();
  assert.equal(rules.length, 4);
  assert.ok(rules.every((rule) => rule.permanent === true));
  assert.ok(
    rules.some(
      (rule) =>
        rule.source === "/:path*" &&
        rule.destination === `${CANONICAL_ORIGIN}/:path*` &&
        rule.has[0].value === "tradematequotes.co.uk"
    )
  );
  assert.ok(
    rules.some(
      (rule) => rule.source === "/" && rule.has[0].value === "www.tradematequotes.co.uk"
    )
  );
});
