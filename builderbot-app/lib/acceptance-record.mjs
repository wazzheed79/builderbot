// A typed acceptance is the name a customer types to accept a quote.
// The database row is the record that cannot be edited. This helper builds
// the same fields so the route and the tests agree on the shape.

export const TYPED_ACCEPTANCE_REQUIRED =
  "A typed acceptance name is required to accept this quote.";
export const TYPED_ACCEPTANCE_TOO_LONG =
  "The name cannot be longer than 100 characters.";

/**
 * @param {unknown} value
 */
function text(value) {
  return String(value ?? "").replace(/\u0000/g, "").trim();
}

/**
 * @param {unknown} value
 */
function money(value) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000) return null;
  return Math.round(amount * 100) / 100;
}

/**
 * @param {unknown} value
 */
function stamp(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  const parsed = Date.parse(String(value || ""));
  if (!Number.isFinite(parsed)) return "";
  return new Date(parsed).toISOString();
}

/**
 * @param {unknown} value
 */
function ipAddress(value) {
  const address = text(value).slice(0, 64);
  if (!address) return null;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(address)) return address;
  if (/^[0-9a-f:]+$/i.test(address) && address.includes(":")) return address;
  return null;
}

/**
 * Build the acceptance record stored when a customer accepts.
 * @param {{
 *   typedName?: unknown,
 *   acceptedAt?: unknown,
 *   clientIp?: unknown,
 *   totalAccepted?: unknown,
 *   selectedOptionId?: unknown
 * }} input
 * @returns {{ ok: true, record: {
 *   typedName: string,
 *   acceptedAt: string,
 *   clientIp: string | null,
 *   totalAccepted: number,
 *   selectedOptionId: string | null
 * }} | { ok: false, error: string }}
 */
export function buildTypedAcceptance(input) {
  const typedName = text(input?.typedName);
  if (!typedName) return { ok: false, error: TYPED_ACCEPTANCE_REQUIRED };
  if (typedName.length > 100) return { ok: false, error: TYPED_ACCEPTANCE_TOO_LONG };
  const totalAccepted = money(input?.totalAccepted);
  if (totalAccepted == null) {
    return { ok: false, error: "The accepted total could not be recorded." };
  }
  const acceptedAt = stamp(input?.acceptedAt);
  if (!acceptedAt) return { ok: false, error: "The acceptance time could not be recorded." };
  const option = text(input?.selectedOptionId).slice(0, 80);
  return {
    ok: true,
    record: Object.freeze({
      typedName,
      acceptedAt,
      clientIp: ipAddress(input?.clientIp),
      totalAccepted,
      selectedOptionId: option || null,
    }),
  };
}
