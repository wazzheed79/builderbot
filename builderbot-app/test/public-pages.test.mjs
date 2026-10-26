import test from "node:test";
import assert from "node:assert/strict";
import { isGuestPublicPath } from "../lib/public-pages.mjs";

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
