/**
 * Text kept in a price or quantity box while it is being edited.
 * A lone 0 can be deleted, and the next digits replace that 0 instead of sticking to it.
 */

/**
 * @param {unknown} raw
 * @param {{ decimal?: boolean }} [options]
 */
export function sanitizeNumericDraft(raw, options = {}) {
  const decimal = options.decimal !== false;
  let text = String(raw ?? "")
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "");
  if (!decimal) text = text.replace(/\./g, "");
  const dot = text.indexOf(".");
  if (dot !== -1) {
    text = text.slice(0, dot + 1) + text.slice(dot + 1).replace(/\./g, "");
  }
  return text;
}

/**
 * @param {unknown} text
 */
export function isBareZero(text) {
  return String(text ?? "") === "0";
}

/**
 * @param {unknown} previous
 * @param {unknown} incoming
 * @param {{ decimal?: boolean }} [options]
 */
export function nextNumericDraft(previous, incoming, options = {}) {
  const decimal = options.decimal !== false;
  const prev = sanitizeNumericDraft(previous, { decimal });
  let next = sanitizeNumericDraft(incoming, { decimal });
  if (isBareZero(prev)) {
    if (next === "" || next === "0") return next;
    if (decimal && (next === "0." || next.startsWith("0."))) return next;
    // Typed in front of the leftover 0: "50" or "500" should lose that 0.
    if (!next.startsWith("0") && next.endsWith("0") && next.length > 1) {
      next = next.slice(0, -1);
    }
  }
  if (next === "" || next === "0" || (decimal && next.startsWith("0."))) return next;
  if (/^0+\d/.test(next)) next = next.replace(/^0+/, "");
  return next;
}

/**
 * @param {number} value
 * @param {number | undefined} min
 * @param {number | undefined} max
 */
function clamp(value, min, max) {
  let next = value;
  if (typeof min === "number" && next < min) next = min;
  if (typeof max === "number" && next > max) next = max;
  return next;
}

/**
 * Turn the text into a number when the field is left. Empty becomes emptyAs (usually 0).
 * @param {unknown} text
 * @param {{ decimal?: boolean, emptyAs?: number | null, min?: number, max?: number }} [options]
 * @returns {number | null}
 */
export function commitNumericDraft(text, options = {}) {
  const decimal = options.decimal !== false;
  const emptyAs = options.emptyAs === undefined ? 0 : options.emptyAs;
  const cleaned = sanitizeNumericDraft(text, { decimal });
  if (cleaned === "" || cleaned === ".") {
    if (emptyAs === null) return null;
    return clamp(emptyAs, options.min, options.max);
  }
  const value = Number(cleaned.endsWith(".") ? cleaned.slice(0, -1) : cleaned);
  if (!Number.isFinite(value)) return emptyAs === null ? null : clamp(emptyAs, options.min, options.max);
  const rounded = decimal ? Math.round(value * 100) / 100 : Math.round(value);
  return clamp(rounded, options.min, options.max);
}

/**
 * @param {unknown} value
 */
export function formatNumericValue(value) {
  if (value === null || value === undefined || value === "") return "";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return String(amount);
}
