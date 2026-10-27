import test from "node:test";
import assert from "node:assert/strict";
import { isGuestPublicPath, isSignInHandoffPath } from "../lib/public-pages.mjs";
import { readFileSync } from "node:fs";

test("signed-out visitors skip the tab bar on public pages only", () => {
  assert.equal(isGuestPublicPath("/"), true);
  assert.equal(isGuestPublicPath("/try"), true);
  assert.equal(isGuestPublicPath("/try/"), true);
  assert.equal(isGuestPublicPath("/login"), true);
  assert.equal(isGuestPublicPath("/privacy"), true);
  assert.equal(isGuestPublicPath("/terms"), true);
  assert.equal(isGuestPublicPath("/walkthrough"), true);
  assert.equal(isGuestPublicPath("/pricing"), true);
  assert.equal(isGuestPublicPath("/quotes"), false);
  assert.equal(isGuestPublicPath("/dashboard"), false);
  assert.equal(isGuestPublicPath("/settings/prices"), false);
  assert.equal(isGuestPublicPath("/q/abc"), false);
  assert.equal(isGuestPublicPath(""), false);
});

test("the email sign-in pages are not a place for the guest or cookie banner", () => {
  assert.equal(isSignInHandoffPath("/auth/confirm"), true);
  assert.equal(isSignInHandoffPath("/auth/confirm/"), true);
  assert.equal(isSignInHandoffPath("/auth/callback"), true);
  assert.equal(isSignInHandoffPath("/login"), false);
  assert.equal(isSignInHandoffPath("/"), false);
  const demo = readFileSync(new URL("../components/DemoBanner.tsx", import.meta.url), "utf8");
  const consent = readFileSync(new URL("../components/AnalyticsConsent.tsx", import.meta.url), "utf8");
  assert.match(demo, /isSignInHandoffPath/);
  assert.match(consent, /isSignInHandoffPath/);
});
