import test from "node:test";
import assert from "node:assert/strict";

import {
  OTP_LINK_TYPES,
  authCallbackTarget,
  friendlyLinkError,
  plainAuthError,
  readAuthCallback,
  readConfirmRequest,
  safeNextPath,
} from "../lib/auth-callback.mjs";

test("Auth callback: PKCE code in the query is kept for exchange", () => {
  const parsed = readAuthCallback("?code=abc-123", "");
  assert.deepEqual(parsed, { kind: "code", code: "abc-123" });
});

test("Auth callback: token_hash magiclink and email links are accepted", () => {
  assert.deepEqual(readAuthCallback("?token_hash=hash-1&type=magiclink", ""), {
    kind: "otp",
    tokenHash: "hash-1",
    type: "magiclink",
  });
  assert.deepEqual(readAuthCallback("?token_hash=hash-2&type=email", ""), {
    kind: "otp",
    tokenHash: "hash-2",
    type: "email",
  });
  assert.equal(readAuthCallback("?token_hash=hash-3&type=EMAIL", "").type, "email");
});

test("Auth callback: signup, recovery, invite, and email change types are accepted", () => {
  for (const type of ["signup", "recovery", "invite", "email_change"]) {
    assert.equal(OTP_LINK_TYPES.includes(type), true);
    assert.equal(readAuthCallback(`?token_hash=h&type=${type}`, "").kind, "otp");
  }
});

test("Auth callback: the default magic-link hash carries the session", () => {
  const parsed = readAuthCallback("", "#access_token=aaa&refresh_token=bbb&type=magiclink");
  assert.deepEqual(parsed, { kind: "session", accessToken: "aaa", refreshToken: "bbb" });
});

test("Auth callback: a code wins over a hash, and a bare page is none", () => {
  assert.equal(readAuthCallback("?code=from-query", "#access_token=a&refresh_token=b").kind, "code");
  assert.deepEqual(readAuthCallback("", ""), { kind: "none" });
  assert.equal(readAuthCallback("?token_hash=h&type=nope", "").kind, "error");
});

test("Confirm page reads the link but does not treat it as used", () => {
  assert.deepEqual(readConfirmRequest("?token_hash=hash-1&type=email&next=/quotes"), {
    ok: true,
    tokenHash: "hash-1",
    type: "email",
    next: "/quotes",
  });
  assert.equal(readConfirmRequest("?token_hash=h&type=magiclink").ok, true);
  assert.equal(readConfirmRequest("?token_hash=h&type=signup").ok, true);
  assert.equal(readConfirmRequest("?token_hash=h").ok, false);
  assert.equal(safeNextPath("https://evil.example/phish"), "/dashboard");
  assert.equal(safeNextPath("//evil.example"), "/dashboard");
  assert.equal(safeNextPath("/dashboard?tab=quotes"), "/dashboard?tab=quotes");
  assert.equal(friendlyLinkError("Email link is invalid or has expired"), "This sign-in link has expired.");
  assert.equal(friendlyLinkError("Token has already been used"), "This sign-in link has already been used.");
});

test("Auth callback: Supabase error text is readable", () => {
  const parsed = readAuthCallback("?error=access_denied&error_description=Email+link+is+invalid", "");
  assert.equal(parsed.kind, "error");
  assert.equal(parsed.message, "Email link is invalid");
  assert.equal(plainAuthError(""), "The sign-in link could not be used.");
});

test("Auth callback: home and other pages forward the link, the callback page does not", () => {
  assert.equal(
    authCallbackTarget("/", "?code=abc", ""),
    "/auth/callback?code=abc"
  );
  assert.equal(
    authCallbackTarget("/quotes", "", "#access_token=a&refresh_token=b"),
    "/auth/callback#access_token=a&refresh_token=b"
  );
  assert.equal(authCallbackTarget("/auth/callback", "?code=abc", ""), null);
  assert.equal(
    authCallbackTarget("/auth/confirm", "?token_hash=h&type=email", ""),
    null
  );
  assert.equal(authCallbackTarget("/", "?error=unrelated", ""), null);
  assert.equal(
    authCallbackTarget("/", "?error_code=otp_expired&error_description=expired", ""),
    "/auth/callback?error_code=otp_expired&error_description=expired"
  );
});
