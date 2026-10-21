import test from "node:test";
import assert from "node:assert/strict";
import { bankInstruction, descriptionLines, formatGbp, preparePrintableQuote } from "../lib/quote-print.mjs";

test("GBP formatting covers a free line and a large quote", () => {
  assert.equal(formatGbp(0), "£0.00");
  assert.equal(formatGbp(100000), "£100,000.00");
  assert.equal(formatGbp(0.1), "£0.10");
  assert.equal(formatGbp(Number.NaN), "£0.00");
});

test("a one-line quote and a hundred-line quote both keep every line", () => {
  const one = preparePrintableQuote({
    items: [{ description: "Call-out", quantity: 1, unit: "visit", rate: 0, type: "labor" }],
    vatEnabled: false,
    depositPercent: 0,
  });
  assert.equal(one.lines.length, 1);
  assert.equal(one.pageCount, 1);
  assert.equal(one.total, "£0.00");
  assert.equal(one.lines[0].lineTotal, "£0.00");

  const items = Array.from({ length: 100 }, (_, index) => ({
    id: `line-${index + 1}`,
    description: `Course ${index + 1}`,
    quantity: 1,
    unit: "m",
    rate: 1000,
    type: "material",
  }));
  const many = preparePrintableQuote({ items, vatEnabled: false, depositPercent: 0 });
  assert.equal(many.lines.length, 100);
  assert.ok(many.pageCount > 1);
  assert.equal(many.pages.reduce((sum, page) => sum + page.length, 0), 100);
  assert.equal(many.total, "£100,000.00");
  assert.equal(many.lines[0].meta.includes("£1,000.00"), true);
});

test("a very long description wraps and can cross a page break", () => {
  const word = "waterproofing";
  const description = Array.from({ length: 80 }, () => word).join(" ");
  const wrapped = descriptionLines(description);
  assert.ok(wrapped.length > 6);
  assert.equal(wrapped.join(" "), description);
  assert.ok(wrapped.every((line) => line.length <= 72));

  const printed = preparePrintableQuote({
    items: [{ description, quantity: 1, unit: "lot", rate: 100000, type: "service" }],
    vatEnabled: false,
    depositPercent: 20,
    logoUrl: "",
  });
  assert.equal(printed.hasLogo, false);
  assert.equal(printed.lines[0].long, true);
  assert.equal(printed.lines[0].wrapped.join(" "), description);
  assert.equal(printed.total, "£100,000.00");
  assert.equal(printed.deposit, "£20,000.00");
});

test("a missing logo still prints the line, and bank details are never invented", () => {
  const printed = preparePrintableQuote({
    items: [{ description: "Skip hire", quantity: 1, unit: "skip", rate: 250, type: "service" }],
    vatEnabled: true,
    depositPercent: 20,
  });
  assert.equal(printed.hasLogo, false);
  assert.equal(printed.lines.length, 1);
  assert.equal(printed.subtotal, "£250.00");

  const withLogo = preparePrintableQuote({
    items: [{ description: "Skip hire", quantity: 1, unit: "skip", rate: 250 }],
    logoUrl: "https://example.com/logo.png",
    vatEnabled: false,
  });
  assert.equal(withLogo.hasLogo, true);

  const bank = bankInstruction({ bankAccountNumber: "12345678" });
  assert.equal(bank.accountNumber, "12345678");
  assert.equal(bank.sortCode, null);
  assert.equal(bank.bankName, null);
  assert.equal(JSON.stringify(bank).includes("20-00-00"), false);
  assert.equal(JSON.stringify(bank).includes("Commercial Bank"), false);
  assert.equal(bankInstruction({ bankName: "Barclays", bankSortCode: "20-00-00" }), null);
});
