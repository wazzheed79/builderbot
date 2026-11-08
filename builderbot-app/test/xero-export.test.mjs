import test from "node:test";
import assert from "node:assert/strict";

import { calculateQuoteExpiry, pricedOnLine } from "../lib/quote-rules.mjs";
import {
  XERO_HEADERS,
  buildXeroInvoiceCsv,
  csvCell,
  xeroDate,
  xeroFileName,
} from "../lib/xero-export.mjs";

const invoice = {
  number: "INV-0001",
  title: "Bathroom refit",
  clientName: "Sam Jones",
  clientCompany: "",
  clientEmail: "sam@example.com",
  clientAddress: "1 High Street, Leeds, LS1 1AA",
  vatEnabled: true,
  subtotal: 150,
  issueDate: "2026-11-05",
  dueDate: "2026-11-19",
  items: [
    { description: "Labour, 2 days", quantity: 2, rate: 100 },
    { description: 'Tap "chrome"', quantity: 1, rate: 50 },
  ],
};

test("priced-on line uses the quote date and the validity setting", () => {
  assert.equal(
    pricedOnLine("2026-11-05T10:00:00.000Z", 30),
    "Materials priced on 5 Nov 2026. Prices valid for 30 days."
  );
  assert.equal(pricedOnLine("2026-11-05T10:00:00.000Z", 1), "Materials priced on 5 Nov 2026. Prices valid for 1 day.");
  assert.equal(pricedOnLine("not a date", 30), "");
  assert.match(pricedOnLine("2026-11-05T10:00:00.000Z", 0), /valid for 30 days/);
  assert.ok(calculateQuoteExpiry("2026-11-05T10:00:00.000Z", 30).expiryFormatted.includes("2026"));
});

test("Xero CSV has the header row and one row per line", () => {
  const csv = buildXeroInvoiceCsv([invoice]);
  const lines = csv.trim().split("\r\n");
  assert.equal(lines.length, 3);
  assert.equal(lines[0].split(",").length, XERO_HEADERS.length);
  assert.ok(lines[0].startsWith("*ContactName,EmailAddress"));
});

test("Xero CSV carries dates, amounts, VAT type and account code", () => {
  const [, first, second] = buildXeroInvoiceCsv([invoice]).trim().split("\r\n");
  assert.ok(first.startsWith("Sam Jones,sam@example.com,1 High Street,Leeds,LS1 1AA,"));
  assert.ok(first.includes(",INV-0001,Bathroom refit,05/11/2026,19/11/2026,"));
  assert.ok(first.includes('"Labour, 2 days",2,100.00,,200,20% (VAT on Income),'));
  assert.ok(second.includes('"Tap ""chrome""",1,50.00,,200,20% (VAT on Income),'));
  assert.ok(first.endsWith(",GBP,"));
});

test("an invoice without VAT uses the No VAT tax type", () => {
  const csv = buildXeroInvoiceCsv([{ ...invoice, vatEnabled: false }]);
  assert.ok(csv.includes(",No VAT,"));
  assert.ok(!csv.includes("20% (VAT on Income)"));
});

test("an invoice with no lines becomes one line for the job", () => {
  const csv = buildXeroInvoiceCsv([{ ...invoice, items: [], subtotal: 80 }]);
  assert.equal(csv.trim().split("\r\n").length, 2);
  assert.ok(csv.includes("Bathroom refit,1,80.00"));
});

test("cells that look like formulas are neutralised and commas are quoted", () => {
  assert.equal(csvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  assert.equal(csvCell("+44 7700"), "'+44 7700");
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell("plain"), "plain");
});

test("dates and file names", () => {
  assert.equal(xeroDate("2026-11-05"), "05/11/2026");
  assert.equal(xeroDate("2026-11-05T09:00:00Z"), "05/11/2026");
  assert.equal(xeroDate(""), "");
  assert.equal(xeroFileName("2026-11-05"), "chuffed-quotes-xero-invoices-2026-11-05.csv");
  assert.equal(buildXeroInvoiceCsv([]).trim().split("\r\n").length, 1);
});
