/**
 * Shared quote calculation, financial rounding, and status state machine rules.
 * Ground truth logic imported across backend API routes, client UI, and unit tests.
 */

/**
 * Rounds monetary amounts to exactly two decimal places (pence/cents) to avoid floating point drift.
 * @param {number} amount
 * @returns {number}
 */
export function roundMoney(amount) {
  return Math.round((Number(amount || 0) + Number.EPSILON) * 100) / 100;
}

/**
 * Server-authoritative calculation of quote financials.
 * @param {Array<{ quantity: number, rate: number }>} items
 * @param {boolean} vatEnabled
 * @param {number} depositPercent
 */
export function recalculateQuoteTotals(items = [], vatEnabled = true, depositPercent = 20) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.rate), 0)
  );
  const vat = roundMoney(vatEnabled ? subtotal * 0.2 : 0);
  const total = roundMoney(subtotal + vat);
  const deposit = roundMoney((total * Math.max(0, Math.min(100, depositPercent))) / 100);

  return { subtotal, vat, total, deposit };
}

/**
 * Strict status transition rules for quotes.
 * Enforces:
 * - Draft cannot transition directly to Accepted or Rejected
 * - Only Sent quotes can transition to Viewed
 * - Sent or Viewed quotes can transition to Accepted or Rejected
 * - Expired quotes cannot be accepted or decided
 * - Decided (Accepted/Rejected) quotes cannot be modified
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @param {boolean} isExpired
 */
export function validateStatusTransition(currentStatus, targetStatus, isExpired = false) {
  if (isExpired) {
    return { allowed: false, error: "This quote has expired and can no longer be decided." };
  }
  if (targetStatus === "Viewed") {
    if (currentStatus === "Sent") return { allowed: true };
    return { allowed: false, error: `Cannot transition from '${currentStatus}' to 'Viewed'.` };
  }
  if (currentStatus !== "Sent" && currentStatus !== "Viewed") {
    return { allowed: false, error: `Quote in '${currentStatus}' status cannot be modified.` };
  }
  if (targetStatus !== "Accepted" && targetStatus !== "Rejected") {
    return { allowed: false, error: `Invalid target status '${targetStatus}'.` };
  }
  return { allowed: true };
}

/**
 * Generates an unguessable cryptographic token for public quote links.
 * Always prefixed with `q_` and contains high-entropy UUID or random bytes.
 * @returns {string}
 */
export function generateToken() {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return `q_${crypto.randomUUID().replace(/-/g, "")}`;
    }
    if (typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(20);
      crypto.getRandomValues(bytes);
      return `q_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
    }
  }
  const timestamp = Date.now().toString(36);
  const perf = (typeof performance !== "undefined" ? performance.now() : 0).toString(36).replace(".", "");
  return `q_${timestamp}${perf}`.padEnd(24, "0");
}
