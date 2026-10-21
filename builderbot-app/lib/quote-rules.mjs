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

/**
 * Computes quotation expiry status and formatted dates.
 * @param {string} createdAtIso
 * @param {number} validityDays
 * @param {number} [currentTimestampMs]
 */
export function calculateQuoteExpiry(createdAtIso, validityDays = 30, currentTimestampMs = Date.now()) {
  const createdMs = new Date(createdAtIso).getTime();
  if (isNaN(createdMs)) {
    return {
      isExpired: false,
      daysLeft: validityDays,
      expiryDateIso: "",
      expiryFormatted: "30 days from issue",
    };
  }

  const expiryMs = createdMs + Math.max(1, validityDays) * 24 * 60 * 60 * 1000;
  const isExpired = currentTimestampMs > expiryMs;
  const msRemaining = Math.max(0, expiryMs - currentTimestampMs);
  const daysLeft = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
  const expiryDate = new Date(expiryMs);
  const expiryDateIso = expiryDate.toISOString().split("T")[0];
  const expiryFormatted = expiryDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    isExpired,
    daysLeft,
    expiryDateIso,
    expiryFormatted,
  };
}

/** Letters and digits that are not easy to mix up. Eight of these is the quote ref. */
const QUOTE_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * @returns {Uint8Array}
 */
function randomQuoteBytes() {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
    return bytes;
  }
  return bytes;
}

/**
 * A quote id that is not shared across accounts. Existing BB-1041 style ids stay as they are.
 * @param {Uint8Array | number[]} [bytes]
 */
export function newQuoteId(bytes = randomQuoteBytes()) {
  const list = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || []);
  let id = "BB-";
  for (let i = 0; i < 8; i += 1) {
    id += QUOTE_ID_ALPHABET[(list[i] || 0) % QUOTE_ID_ALPHABET.length];
  }
  return id;
}

/**
 * The old shared sequence. BB-1041 on one account is the same id as BB-1041 on another.
 * @param {unknown} id
 */
export function isSharedSequentialQuoteId(id) {
  return /^BB-\d+$/i.test(String(id || "").trim());
}

/**
 * True when another account already owns this quote id.
 * A duplicate customer-link token is a different problem and is left alone.
 * @param {unknown} error
 */
export function isQuoteIdConflict(error) {
  const message = typeof error === "string" ? error : String(error && typeof error === "object" && "message" in error ? error.message : "");
  if (/quotes_pkey/i.test(message)) return true;
  return /row-level security/i.test(message) && /quote/i.test(message);
}

/**
 * Point local quotes, jobs, and invoices at a new quote id. Tokens and invoice numbers stay.
 * @param {{
 *   quotes?: Array<{ id?: string }>,
 *   jobs?: Array<{ quoteId?: string }>,
 *   invoices?: Array<{ quoteId?: string, number?: string }>
 * }} records
 * @param {unknown} fromId
 * @param {unknown} toId
 */
export function reassignQuoteReferences(records, fromId, toId) {
  const from = String(fromId || "");
  const to = String(toId || "");
  const quotes = Array.isArray(records?.quotes) ? records.quotes : [];
  const jobs = Array.isArray(records?.jobs) ? records.jobs : [];
  const invoices = Array.isArray(records?.invoices) ? records.invoices : [];
  return {
    quotes: quotes.map((quote) => (quote && quote.id === from ? { ...quote, id: to } : quote)),
    jobs: jobs.map((job) => (job && job.quoteId === from ? { ...job, quoteId: to } : job)),
    invoices: invoices.map((invoice) =>
      invoice && invoice.quoteId === from ? { ...invoice, quoteId: to } : invoice
    ),
  };
}
