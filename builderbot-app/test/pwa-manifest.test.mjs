import test from "node:test";
import assert from "node:assert/strict";

import { appManifest, authManifest, manifestRewrites } from "../lib/pwa-manifest.mjs";

test("the home-screen app does not take over https links", () => {
  const manifest = appManifest();
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.handle_links, "not-preferred");
  assert.equal(manifest.start_url, "/dashboard");
  assert.ok(Array.isArray(manifest.shortcuts));
  assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/quotes"));
  assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/customers"));
});

test("site.webmanifest is the same home-screen manifest", () => {
  const sources = manifestRewrites().map((rule) => rule.source);
  assert.ok(sources.includes("/manifest.json"));
  assert.ok(sources.includes("/site.webmanifest"));
});

test("the sign-in pages stay in the browser tab", () => {
  const manifest = authManifest();
  assert.equal(manifest.display, "browser");
  assert.equal(manifest.handle_links, "not-preferred");
  assert.equal(manifest.scope, "/auth/");
  assert.equal(manifest.start_url, "/auth/confirm");
  assert.notEqual(manifest.id, appManifest().id);
});
