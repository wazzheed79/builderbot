// Caps and checks for photos sent with an AI quote. The declared type is not
// trusted: the file bytes have to match a real JPEG, PNG, GIF, or WebP.

/** Six photos, matching the quote editor. */
export const MAX_AI_PHOTOS = 6;

/**
 * One photo, as a data-URL string. A phone photo compressed in the browser
 * is usually under 200,000 characters. 350,000 leaves room for a larger one.
 */
export const MAX_PHOTO_CHARS = 350_000;

/**
 * The whole AI quote request, including notes and every photo.
 * Six full-size photos cannot all fit, which is the point of the cap.
 */
export const MAX_AI_BODY_CHARS = 1_800_000;

/** Notes-only AI routes, including the guest try-it page. */
export const MAX_TEXT_BODY_CHARS = 20_000;

export const PHOTO_TOO_LARGE =
  "Each photo must be smaller. Remove one and try again.";
export const TOO_MANY_PHOTOS = `You can attach up to ${MAX_AI_PHOTOS} photos.`;
export const REQUEST_TOO_LARGE =
  "That request is too large. Remove a photo and try again.";
export const PHOTO_NOT_AN_IMAGE =
  "That file is not a photo we can use. Use a JPEG, PNG, GIF, or WebP.";
export const NOTES_TOO_LONG = "Those notes are too long.";

const DATA_URL = /^data:image\/([a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i;

/**
 * @param {string} declared
 */
function normaliseMime(declared) {
  const type = String(declared || "").toLowerCase();
  if (type === "jpg" || type === "jpeg" || type === "pjpeg") return "image/jpeg";
  if (type === "png") return "image/png";
  if (type === "gif") return "image/gif";
  if (type === "webp") return "image/webp";
  return "";
}

/**
 * @param {Buffer} bytes
 */
export function imageTypeFromBytes(bytes) {
  if (!bytes || bytes.length < 12) return "";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  const gif = bytes.subarray(0, 6).toString("ascii");
  if (gif === "GIF87a" || gif === "GIF89a") return "image/gif";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return "";
}

/**
 * @param {unknown} contentLength
 * @param {unknown} rawText
 * @param {number} maxChars
 * @param {string} [message]
 * @returns {{ ok: true } | { ok: false, status: number, error: string }}
 */
export function checkBodySize(contentLength, rawText, maxChars, message = REQUEST_TOO_LARGE) {
  const declared = Number(contentLength || 0);
  if (Number.isFinite(declared) && declared > maxChars) {
    return { ok: false, status: 413, error: message };
  }
  if (typeof rawText === "string" && rawText.length > maxChars) {
    return { ok: false, status: 413, error: message };
  }
  return { ok: true };
}

/**
 * @param {unknown} photo
 * @returns {{ ok: true, photo: string } | { ok: false, error: string }}
 */
export function validateAiPhoto(photo) {
  if (typeof photo !== "string" || photo.length === 0) {
    return { ok: false, error: PHOTO_NOT_AN_IMAGE };
  }
  if (photo.length > MAX_PHOTO_CHARS) {
    return { ok: false, error: PHOTO_TOO_LARGE };
  }
  const match = photo.match(DATA_URL);
  if (!match) return { ok: false, error: PHOTO_NOT_AN_IMAGE };
  const declared = normaliseMime(match[1]);
  if (!declared) return { ok: false, error: PHOTO_NOT_AN_IMAGE };
  const encoded = match[2].replace(/\s/g, "");
  if (encoded.length < 16 || encoded.length % 4 === 1) {
    return { ok: false, error: PHOTO_NOT_AN_IMAGE };
  }
  const bytes = Buffer.from(encoded, "base64");
  const actual = imageTypeFromBytes(bytes);
  if (!actual || actual !== declared) {
    return { ok: false, error: PHOTO_NOT_AN_IMAGE };
  }
  return { ok: true, photo };
}

/**
 * @param {unknown} photos
 * @returns {{ ok: true, photos: string[] } | { ok: false, error: string }}
 */
export function validateAiPhotos(photos) {
  if (photos == null) return { ok: true, photos: [] };
  if (!Array.isArray(photos)) return { ok: false, error: PHOTO_NOT_AN_IMAGE };
  if (photos.length > MAX_AI_PHOTOS) return { ok: false, error: TOO_MANY_PHOTOS };
  const cleaned = [];
  for (const photo of photos) {
    const checked = validateAiPhoto(photo);
    if (!checked.ok) return checked;
    cleaned.push(checked.photo);
  }
  return { ok: true, photos: cleaned };
}
