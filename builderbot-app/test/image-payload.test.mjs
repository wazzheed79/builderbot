import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  MAX_AI_BODY_CHARS,
  MAX_AI_PHOTOS,
  MAX_PHOTO_CHARS,
  PHOTO_NOT_AN_IMAGE,
  PHOTO_TOO_LARGE,
  REQUEST_TOO_LARGE,
  TOO_MANY_PHOTOS,
  checkBodySize,
  imageTypeFromBytes,
  validateAiPhoto,
  validateAiPhotos,
} from "../lib/image-payload.mjs";

function dataUrl(mime, bytes) {
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const gif = Buffer.alloc(12);
gif.write("GIF89a", 0, "ascii");
const webp = Buffer.alloc(12);
webp.write("RIFF", 0, "ascii");
webp.writeUInt32LE(4, 4);
webp.write("WEBP", 8, "ascii");

test("real photo bytes are recognised and a declared type must match them", () => {
  assert.equal(imageTypeFromBytes(jpeg), "image/jpeg");
  assert.equal(imageTypeFromBytes(png), "image/png");
  assert.equal(imageTypeFromBytes(gif), "image/gif");
  assert.equal(imageTypeFromBytes(webp), "image/webp");
  assert.equal(validateAiPhoto(dataUrl("image/jpeg", jpeg)).ok, true);
  assert.equal(validateAiPhoto(dataUrl("image/png", png)).ok, true);
  assert.equal(validateAiPhoto(dataUrl("image/gif", gif)).ok, true);
  assert.equal(validateAiPhoto(dataUrl("image/webp", webp)).ok, true);

  const mismatched = validateAiPhoto(dataUrl("image/jpeg", png));
  assert.equal(mismatched.ok, false);
  assert.equal(mismatched.error, PHOTO_NOT_AN_IMAGE);

  const pdf = validateAiPhoto(dataUrl("image/jpeg", Buffer.from("%PDF-1.4")));
  assert.equal(pdf.ok, false);
  assert.equal(pdf.error, PHOTO_NOT_AN_IMAGE);

  const svg = validateAiPhoto("data:image/svg+xml;base64," + Buffer.from("<svg></svg>").toString("base64"));
  assert.equal(svg.ok, false);
  assert.equal(svg.error, PHOTO_NOT_AN_IMAGE);
});

test("each photo and the whole request have a size cap, with a plain message", () => {
  const huge = `data:image/jpeg;base64,${"A".repeat(MAX_PHOTO_CHARS)}`;
  const tooBig = validateAiPhoto(huge);
  assert.equal(tooBig.ok, false);
  assert.equal(tooBig.error, PHOTO_TOO_LARGE);

  const photos = Array.from({ length: MAX_AI_PHOTOS + 1 }, () => dataUrl("image/jpeg", jpeg));
  const tooMany = validateAiPhotos(photos);
  assert.equal(tooMany.ok, false);
  assert.equal(tooMany.error, TOO_MANY_PHOTOS);

  assert.equal(validateAiPhotos(undefined).ok, true);
  assert.deepEqual(validateAiPhotos([]).photos, []);

  const over = checkBodySize(MAX_AI_BODY_CHARS + 1, "", MAX_AI_BODY_CHARS);
  assert.equal(over.ok, false);
  assert.equal(over.status, 413);
  assert.equal(over.error, REQUEST_TOO_LARGE);
  assert.equal(checkBodySize(100, "x".repeat(MAX_AI_BODY_CHARS + 1), MAX_AI_BODY_CHARS).ok, false);
  assert.equal(checkBodySize(100, "ok", MAX_AI_BODY_CHARS).ok, true);
});

test("the AI quote route no longer accepts a 1.5 MB photo string on its own", () => {
  const route = fs.readFileSync(new URL("../app/api/quote/generate/route.ts", import.meta.url), "utf8");
  assert.equal(route.includes("1_500_000"), false);
  assert.match(route, /validateAiPhotos/);
  assert.match(route, /MAX_AI_BODY_CHARS/);
  const client = fs.readFileSync(new URL("../app/quotes/QuotesClient.tsx", import.meta.url), "utf8");
  assert.match(client, /validateAiPhotos/);
  assert.match(client, /photoCheck\.error/);
});
