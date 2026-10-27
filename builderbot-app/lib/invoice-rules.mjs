import { recalculateQuoteTotals, roundMoney, generateToken } from "./quote-rules.mjs";

export const DEFAULT_DUE_DAYS = 14;
export const PAYMENT_DETAILS_TO_FOLLOW = "Payment details to follow";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const INVOICE_NUMBER = /^INV-(\d+)$/i;
const PUBLIC_INVOICE_TOKEN = /^i_[A-Za-z0-9]{14,}$/;

/**
 * @param {unknown} value
 */
function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * @param {unknown} token
 */
export function isPublicInvoiceToken(token) {
  return PUBLIC_INVOICE_TOKEN.test(String(token || ""));
}

/** Unguessable id for the invoice row. Not the number the customer sees. */
export function newInvoiceId() {
  return `inv_${generateToken().slice(2)}`;
}

/** Public link token. Prefix `i_` so it cannot be confused with a quote link. */
export function newInvoiceToken() {
  const token = generateToken().replace(/^q_/, "i_");
  return isPublicInvoiceToken(token) ? token : `i_${generateToken().slice(2)}`;
}

/**
 * Next INV-0001 style number for this user only.
 * Pass that user's existing numbers and ids. Another user's list starts again at INV-0001.
 * @param {unknown[]} existing
 */
export function nextInvoiceNumber(existing = []) {
  let max = 0;
  const values = Array.isArray(existing) ? existing : [];
  for (const value of values) {
    const match = String(value || "").trim().match(INVOICE_NUMBER);
    if (!match) continue;
    const parsed = parseInt(match[1], 10);
    if (Number.isFinite(parsed) && parsed > max) max = parsed;
  }
  return `INV-${String(max + 1).padStart(4, "0")}`;
}

/**
 * @param {unknown} status
 * @returns {"Draft" | "Sent" | "Paid"}
 */
export function normalizeStoredStatus(status) {
  const value = String(status || "").trim();
  if (value === "Paid") return "Paid";
  if (value === "Draft") return "Draft";
  if (value === "Sent" || value === "Issued" || value === "Partially Paid" || value === "Overdue") {
    return "Sent";
  }
  return "Draft";
}

/**
 * Overdue is not stored. A sent invoice becomes overdue the day after its due date.
 * Paid and draft invoices keep their status.
 * @param {unknown} status
 * @param {unknown} dueDate
 * @param {unknown} today
 * @returns {"Draft" | "Sent" | "Paid" | "Overdue"}
 */
export function displayInvoiceStatus(status, dueDate, today) {
  const stored = normalizeStoredStatus(status);
  if (stored !== "Sent") return stored;
  const due = String(dueDate || "").slice(0, 10);
  const now = String(today || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(due) && /^\d{4}-\d{2}-\d{2}$/.test(now) && due < now) {
    return "Overdue";
  }
  return "Sent";
}

/**
 * London calendar date. A late evening in the UK must not jump to tomorrow's UTC date.
 * @param {Date} [now]
 */
export function todayIso(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value || "1970";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";
  return `${year}-${month}-${day}`;
}

/**
 * @param {unknown} isoDate
 * @param {number} days
 */
export function addDaysIso(isoDate, days) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate || ""));
  if (!match) return "";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

/**
 * @param {unknown} iso
 */
export function formatUkDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!match) return "";
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return "";
  return `${Number(match[3])} ${month} ${match[1]}`;
}

/**
 * Totals from the lines, using the quote's VAT switch. Deposit is not assumed paid.
 * @param {Array<{ quantity?: number, rate?: number }> | unknown} items
 * @param {boolean} vatEnabled
 * @param {number} [depositPaid]
 */
export function invoiceTotals(items, vatEnabled, depositPaid = 0) {
  const source = Array.isArray(items) ? items : [];
  const figures = recalculateQuoteTotals(
    source.map((item) => ({
      quantity: Number(item?.quantity) || 0,
      rate: Number(item?.rate) || 0,
    })),
    Boolean(vatEnabled),
    0
  );
  const paid = roundMoney(Math.max(0, Number(depositPaid) || 0));
  return {
    subtotal: figures.subtotal,
    vat: figures.vat,
    total: figures.total,
    depositPaid: paid,
    balanceDue: roundMoney(Math.max(0, figures.total - paid)),
  };
}

/**
 * Bank details the tradesperson actually saved. Missing details are never filled in.
 * @param {{ bankName?: unknown, bankSortCode?: unknown, bankAccountNumber?: unknown } | null | undefined} source
 */
export function paymentDetails(source) {
  const accountNumber = clean(source?.bankAccountNumber);
  const sortCode = clean(source?.bankSortCode);
  const bankName = clean(source?.bankName);
  if (!accountNumber) {
    return {
      ready: false,
      text: PAYMENT_DETAILS_TO_FOLLOW,
      bankName: "",
      sortCode: "",
      accountNumber: "",
    };
  }
  return {
    ready: true,
    text: "",
    bankName,
    sortCode,
    accountNumber,
  };
}

/**
 * A sent, viewed, or accepted quote can become an invoice. A draft cannot.
 * @param {unknown} status
 */
export function canCreateInvoiceFromQuote(status) {
  return status === "Sent" || status === "Viewed" || status === "Accepted";
}

/**
 * Lines the customer agreed, or the quote lines when there is one price.
 * @param {{ items?: unknown[], options?: unknown[], selectedOptionId?: unknown }} quote
 */
export function quoteLinesForInvoice(quote) {
  const options = Array.isArray(quote?.options) ? quote.options : [];
  const selectedId = clean(quote?.selectedOptionId);
  const selected = options.find((option) => option && clean(option.id) === selectedId);
  const selectedItems = selected && Array.isArray(selected.items) ? selected.items : null;
  if (selectedItems && selectedItems.length > 0) {
    return {
      items: selectedItems.map(copyLine),
      optionId: clean(selected.id),
      optionLabel: clean(selected.label),
    };
  }
  const items = Array.isArray(quote?.items) ? quote.items : [];
  return { items: items.map(copyLine), optionId: "", optionLabel: "" };
}

/**
 * @param {unknown} item
 * @param {number} index
 */
function copyLine(item, index) {
  const row = item && typeof item === "object" ? /** @type {Record<string, unknown>} */ (item) : {};
  const type = row.type === "labor" || row.type === "service" ? row.type : "material";
  return {
    id: clean(row.id) || `line-${index + 1}`,
    type,
    description: clean(row.description) || "Item",
    quantity: Math.max(0, Number(row.quantity) || 0),
    unit: clean(row.unit) || "unit",
    rate: Math.max(0, Number(row.rate) || 0),
    ...(row.usualPrice ? { usualPrice: true } : {}),
    ...(row.rateSource === "list" || row.rateSource === "settings" ? { rateSource: row.rateSource } : {}),
  };
}

/**
 * @param {unknown} value
 */
function textList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => clean(item)).filter(Boolean);
}

/**
 * Build the invoice copied from a quote. Does not save it.
 * @param {{
 *   quote: object,
 *   profile?: object | null,
 *   existingNumbers?: unknown[],
 *   today: string,
 *   id: string,
 *   token: string,
 *   depositOnly?: boolean
 * }} input
 */
export function buildInvoiceFromQuote(input) {
  const quote = input?.quote || {};
  if (!canCreateInvoiceFromQuote(quote.status)) {
    return { ok: false, error: "Send the quote before you turn it into an invoice." };
  }
  const profile = input.profile || {};
  const pack = quoteLinesForInvoice(quote);
  let items = pack.items;
  const vatEnabled = Boolean(quote.vatEnabled);
  if (input.depositOnly) {
    const deposit = roundMoney(Math.max(0, Number(quote.deposit) || 0));
    const rate = vatEnabled ? roundMoney(deposit / 1.2) : deposit;
    items = [
      {
        id: "dep-1",
        type: "service",
        description: `Deposit for ${clean(quote.title) || "the quoted work"}`,
        quantity: 1,
        unit: "stage",
        rate,
      },
    ];
  }
  const totals = invoiceTotals(items, vatEnabled, 0);
  const payment = paymentDetails(profile);
  const issueDate = String(input.today || "").slice(0, 10);
  const customerId = clean(quote.customerId);
  return {
    ok: true,
    invoice: {
      id: input.id,
      number: nextInvoiceNumber(input.existingNumbers || []),
      token: input.token,
      quoteId: clean(quote.id) || undefined,
      customerId: customerId || undefined,
      optionId: pack.optionId || undefined,
      optionLabel: pack.optionLabel || undefined,
      title: clean(quote.title) || "Invoice",
      notes: clean(quote.notes),
      clientName: clean(quote.clientName) || "Customer",
      clientCompany: clean(quote.clientCompany) || undefined,
      clientAddress: clean(quote.clientAddress) || "Address to be confirmed",
      clientEmail: clean(quote.clientEmail) || undefined,
      clientPhone: clean(quote.clientPhone) || undefined,
      items,
      vatEnabled,
      ...totals,
      status: "Draft",
      issueDate,
      dueDate: addDaysIso(issueDate, DEFAULT_DUE_DAYS),
      companyName: clean(profile.companyName),
      tradingName: clean(profile.tradingName) || undefined,
      ownerName: clean(profile.ownerName),
      businessPhone: clean(profile.phone),
      businessEmail: clean(profile.email),
      businessAddress: clean(profile.address),
      vatNumber: profile.vatRegistered ? clean(profile.vatNumber) : "",
      bankName: payment.bankName,
      bankSortCode: payment.sortCode,
      bankAccountNumber: payment.accountNumber,
      logoUrl: clean(profile.logoUrl) || undefined,
      accreditations: textList(profile.accreditations),
      termsAndConditions: clean(profile.termsAndConditions),
    },
  };
}

/**
 * Fill gaps on an invoice saved before numbering, tokens, and snapshots existed.
 * Does not invent bank details.
 * @param {object} raw
 */
export function normalizeStoredInvoice(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const id = clean(source.id) || newInvoiceId();
  const explicitNumber = clean(source.number);
  const number = INVOICE_NUMBER.test(explicitNumber)
    ? explicitNumber.toUpperCase().replace(/^INV-(\d+)$/i, (_, digits) => `INV-${digits.padStart(4, "0")}`)
    : INVOICE_NUMBER.test(id)
      ? id.toUpperCase().replace(/^INV-(\d+)$/i, (_, digits) => `INV-${digits.padStart(4, "0")}`)
      : explicitNumber || id;
  const items = Array.isArray(source.items) ? source.items.map(copyLine) : [];
  const vatEnabled = source.vatEnabled !== false && source.vat_enabled !== false;
  const status = normalizeStoredStatus(source.status);
  const totals = invoiceTotals(
    items,
    vatEnabled,
    status === "Paid" ? Number(source.total ?? source.depositPaid ?? source.deposit_paid) : Number(source.depositPaid ?? source.deposit_paid) || 0
  );
  const paid = status === "Paid";
  const issue = clean(source.issueDate || source.issue_date || source.createdAt || source.created_at).slice(0, 10);
  const due = clean(source.dueDate || source.due_date).slice(0, 10);
  return {
    id,
    number,
    token: clean(source.token),
    quoteId: clean(source.quoteId || source.quote_id) || undefined,
    jobId: clean(source.jobId || source.job_id) || undefined,
    customerId: clean(source.customerId || source.customer_id) || undefined,
    optionId: clean(source.optionId || source.option_id) || undefined,
    optionLabel: clean(source.optionLabel || source.option_label) || undefined,
    title: clean(source.title) || "Invoice",
    notes: clean(source.notes),
    clientName: clean(source.clientName || source.client_name) || "Customer",
    clientCompany: clean(source.clientCompany || source.client_company) || undefined,
    clientAddress: clean(source.clientAddress || source.client_address) || "",
    clientEmail: clean(source.clientEmail || source.client_email) || undefined,
    clientPhone: clean(source.clientPhone || source.client_phone) || undefined,
    items,
    vatEnabled,
    subtotal: totals.subtotal,
    vat: totals.vat,
    total: totals.total,
    depositPaid: paid ? totals.total : totals.depositPaid,
    balanceDue: paid ? 0 : totals.balanceDue,
    status,
    issueDate: issue,
    dueDate: due,
    paidAt: clean(source.paidAt || source.paid_at) || undefined,
    createdAt: clean(source.createdAt || source.created_at).slice(0, 10) || issue,
    companyName: clean(source.companyName || source.company_name),
    tradingName: clean(source.tradingName || source.trading_name) || undefined,
    ownerName: clean(source.ownerName || source.owner_name),
    businessPhone: clean(source.businessPhone || source.business_phone),
    businessEmail: clean(source.businessEmail || source.business_email),
    businessAddress: clean(source.businessAddress || source.business_address),
    vatNumber: clean(source.vatNumber || source.vat_number),
    bankName: clean(source.bankName || source.bank_name),
    bankSortCode: clean(source.bankSortCode || source.bank_sort_code),
    bankAccountNumber: clean(source.bankAccountNumber || source.bank_account_number),
    logoUrl: clean(source.logoUrl || source.logo_url) || undefined,
    accreditations: textList(source.accreditations),
    termsAndConditions: clean(source.termsAndConditions || source.terms_and_conditions),
  };
}
