/**
 * Live speech text. Interim words stay out of the field until the
 * recogniser marks them final, so they are not written twice.
 */

/**
 * @param {unknown} value
 */
function tidy(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} existing
 * @param {string} spoken
 * @param {number} [maxLength]
 */
export function appendSpokenText(existing, spoken, maxLength) {
  const extra = tidy(spoken);
  const base = String(existing || "").replace(/\s+$/g, "");
  if (!extra) return clip(base, maxLength);
  const joined = base ? `${base} ${extra}` : extra;
  return clip(joined, maxLength);
}

/**
 * @param {string} value
 * @param {number} [maxLength]
 */
function clip(value, maxLength) {
  if (!maxLength || maxLength < 1) return value;
  return value.slice(0, maxLength);
}

/**
 * One recognition event. `appliedFinals` is every final transcript already
 * merged for this session. Reset it when listening starts.
 * @param {string} appliedFinals
 * @param {Array<{ isFinal?: boolean, transcript?: string }>} results
 */
export function applyRecognitionResults(appliedFinals, results) {
  let finalRaw = "";
  let interimRaw = "";
  const list = Array.isArray(results) ? results : [];
  for (const result of list) {
    const transcript = String(result?.transcript || "");
    if (result?.isFinal) finalRaw += transcript;
    else interimRaw += transcript;
  }
  const finals = tidy(finalRaw);
  const interim = tidy(interimRaw);
  const prev = tidy(appliedFinals);
  if (!finals || finals === prev || (prev && (prev.startsWith(finals) || prev.endsWith(finals)))) {
    return { delta: "", interim, appliedFinals: finals || prev };
  }
  if (prev && finals.startsWith(prev)) {
    return { delta: tidy(finals.slice(prev.length)), interim, appliedFinals: finals };
  }
  return { delta: finals, interim, appliedFinals: finals };
}
