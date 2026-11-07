/**
 * Xero sales invoice CSV, for Xero's "Import" on the Invoices page.
 * One row per invoice line. Prices in the app are excluding VAT, which is how Xero
 * expects UnitAmount when the invoice is set to "Tax Exclusive".
 * Dates are DD/MM/YYYY. The account code defaults to 200 (Sales in Xero's UK chart);
 * change it if your accountant uses a different code.
 */

import { roundMoney } from "./quote-rules.mjs";
import { chargesVat } from "./vat.mjs";

export const XERO_HEADERS = [
  "*ContactName",
  "EmailAddress",
  "POAddressLine1",
  "POAddressLine2",
  "POAddressLine3",
  "POAddressLine4",
  "POCity",
  "PORegion",
  "POPostalCode",
  "POCountry",
  "*InvoiceNumber",
  "Reference",
  "*InvoiceDate",
  "*DueDate",
  "InventoryItemCode",
  "*Description",
  "*Quantity",
  "*UnitAmount",
  "Discount",
  "*AccountCode",
  "*TaxType",
  "TaxAmount",
  "TrackingName1",
  "TrackingOption1",
  "TrackingName2",
  "TrackingOption2",
  "Currency",
  "BrandingTheme",
];

export const XERO_DEFAULT_ACCOUNT_CODE = "200";
export const XERO_VAT_TAX_TYPE = "20% (VAT on Income)";
export const XERO_NO_VAT_TAX_TYPE = "No VAT";

/**
 * Quote one CSV cell. Text that starts with = + - @ is prefixed with an apostrophe so a
 * spreadsheet cannot run it as a formula.
 * @param {unknown} value
 * @param {{ text?: boolean }} [options]
 */
export function csvCell(value, options = {}) {
  let text = String(value ?? "");
  if (options.text !== false && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/**
 * 2026-11-05 (or a full ISO time) becomes 05/11/2026. Anything else is blank.
 * @param {unknown} iso
 */
export function xeroDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

/**
 * @param {unknown} address
 * @returns {string[]} Up to four non-empty lines.
 */
function addressLines(address) {
  const parts = String(address || "")
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.slice(0, 4);
}

/**
 * @param {Array<Record<string, any>>} invoices
 * @param {{ accountCode?: string }} [options]
 * @returns {string} CSV text with Windows line endings, which Xero accepts.
 */
export function buildXeroInvoiceCsv(invoices, options = {}) {
  const accountCode = String(options.accountCode || XERO_DEFAULT_ACCOUNT_CODE);
  const rows = [XERO_HEADERS.map((header) => csvCell(header, { text: false })).join(",")];

  for (const invoice of Array.isArray(invoices) ? invoices : []) {
    if (!invoice) continue;
    const taxType = chargesVat(invoice.vatEnabled) ? XERO_VAT_TAX_TYPE : XERO_NO_VAT_TAX_TYPE;
    const contact = String(invoice.clientCompany || invoice.clientName || "Customer").trim();
    const [line1 = "", line2 = "", line3 = "", line4 = ""] = addressLines(invoice.clientAddress);
    const items =
      Array.isArray(invoice.items) && invoice.items.length > 0
        ? invoice.items
        : [{ description: invoice.title || "Work", quantity: 1, rate: invoice.subtotal || 0 }];

    for (const item of items) {
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);
      const cells = [
        csvCell(contact),
        csvCell(invoice.clientEmail || ""),
        csvCell(line1),
        csvCell(line2),
        csvCell(line3),
        csvCell(line4),
        "",
        "",
        "",
        "",
        csvCell(invoice.number || ""),
        csvCell(invoice.title || ""),
        xeroDate(invoice.issueDate),
        xeroDate(invoice.dueDate),
        "",
        csvCell(item.description || "Item"),
        String(Number.isFinite(quantity) ? quantity : 0),
        roundMoney(Number.isFinite(rate) ? rate : 0).toFixed(2),
        "",
        csvCell(accountCode, { text: false }),
        csvCell(taxType, { text: false }),
        "",
        "",
        "",
        "",
        "",
        "GBP",
        "",
      ];
      rows.push(cells.join(","));
    }
  }
  return rows.join("\r\n") + "\r\n";
}

/**
 * @param {string} [todayIso]
 */
export function xeroFileName(todayIso = "") {
  const day = /^\d{4}-\d{2}-\d{2}/.test(todayIso) ? todayIso.slice(0, 10) : "export";
  return `chuffed-quotes-xero-invoices-${day}.csv`;
}

