import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_DUE_DAYS,
  PAYMENT_DETAILS_TO_FOLLOW,
  addDaysIso,
  buildInvoiceFromQuote,
  canCreateInvoiceFromQuote,
  displayInvoiceStatus,
  invoiceTotals,
  nextInvoiceNumber,
  paymentDetails,
  todayIso,
} from "../lib/invoice-rules.mjs";
import { templateFromQuote } from "../lib/quote-template-rules.mjs";

const bathroom = {
  id: "BB-2001",
  status: "Accepted",
  title: "En-suite bathroom",
  notes: "Supply and fit the suite.",
  clientName: "Sarah Jenkins",
  clientAddress: "24 Orchard Way, Bristol",
  clientPhone: "07911 123456",
  customerId: "cust-1",
  vatEnabled: true,
  selectedOptionId: "opt-better",
  items: [{ id: "base", type: "material", description: "Standard suite", quantity: 1, unit: "job", rate: 100 }],
  options: [
    {
      id: "opt-standard",
      label: "Standard",
      items: [{ id: "base", type: "material", description: "Standard suite", quantity: 1, unit: "job", rate: 100 }],
    },
    {
      id: "opt-better",
      label: "Better",
      items: [
        { id: "base", type: "material", description: "Standard suite", quantity: 1, unit: "job", rate: 100 },
        { id: "upgrade", type: "service", description: "Upgraded tray and taps", quantity: 1, unit: "job", rate: 50 },
      ],
    },
  ],
};

test("invoice numbers start at INV-0001 and stay sequential for one user", () => {
  assert.equal(nextInvoiceNumber([]), "INV-0001");
  assert.equal(nextInvoiceNumber(["INV-0001", "INV-0002"]), "INV-0003");
  assert.equal(nextInvoiceNumber(["INV-0001", "INV-0009"]), "INV-0010");
  assert.equal(nextInvoiceNumber(["INV-1042", "not-a-number"]), "INV-1043");
  assert.equal(nextInvoiceNumber([]), "INV-0001");
});

test("invoice totals follow the lines and the quote VAT switch", () => {
  const withVat = invoiceTotals(
    [
      { quantity: 2, rate: 40 },
      { quantity: 1, rate: 20 },
    ],
    true,
    0
  );
  assert.equal(withVat.subtotal, 100);
  assert.equal(withVat.vat, 20);
  assert.equal(withVat.total, 120);
  assert.equal(withVat.balanceDue, 120);

  const noVat = invoiceTotals([{ quantity: 3, rate: 15 }], false, 0);
  assert.equal(noVat.subtotal, 45);
  assert.equal(noVat.vat, 0);
  assert.equal(noVat.total, 45);

  const partly = invoiceTotals([{ quantity: 1, rate: 100 }], true, 50);
  assert.equal(partly.total, 120);
  assert.equal(partly.balanceDue, 70);
});

test("a quote becomes an invoice for the chosen option, due in 14 days, with no invented bank", () => {
  assert.equal(DEFAULT_DUE_DAYS, 14);
  assert.equal(canCreateInvoiceFromQuote("Draft"), false);
  assert.equal(canCreateInvoiceFromQuote("Sent"), true);
  assert.equal(canCreateInvoiceFromQuote("Viewed"), true);
  assert.equal(canCreateInvoiceFromQuote("Accepted"), true);

  const blank = buildInvoiceFromQuote({
    quote: bathroom,
    profile: { companyName: "Jenkins Bathrooms", ownerName: "Alex", phone: "0121", bankName: "", bankSortCode: "", bankAccountNumber: "" },
    existingNumbers: [],
    today: "2026-10-21",
    id: "inv_test",
    token: "i_abcdefghijklmnopqrstuv",
  });
  assert.equal(blank.ok, true);
  if (!blank.ok) return;
  assert.equal(blank.invoice.number, "INV-0001");
  assert.equal(blank.invoice.optionLabel, "Better");
  assert.equal(blank.invoice.items.length, 2);
  assert.equal(blank.invoice.subtotal, 150);
  assert.equal(blank.invoice.vat, 30);
  assert.equal(blank.invoice.total, 180);
  assert.equal(blank.invoice.balanceDue, 180);
  assert.equal(blank.invoice.issueDate, "2026-10-21");
  assert.equal(blank.invoice.dueDate, "2026-11-04");
  assert.equal(addDaysIso("2026-10-21", 14), "2026-11-04");
  assert.equal(blank.invoice.status, "Draft");
  assert.equal(blank.invoice.bankName, "");
  assert.equal(blank.invoice.bankSortCode, "");
  assert.equal(blank.invoice.bankAccountNumber, "");
  assert.equal(paymentDetails(blank.invoice).text, PAYMENT_DETAILS_TO_FOLLOW);
  assert.equal(blank.invoice.companyName, "Jenkins Bathrooms");
  assert.equal(blank.invoice.clientName, "Sarah Jenkins");

  const named = paymentDetails({ bankName: "Starling", bankSortCode: "60-83-71", bankAccountNumber: "12345678" });
  assert.equal(named.ready, true);
  assert.equal(named.bankName, "Starling");
  assert.equal(named.sortCode, "60-83-71");
  assert.equal(named.accountNumber, "12345678");

  const accountOnly = paymentDetails({ bankAccountNumber: "12345678" });
  assert.equal(accountOnly.bankName, "");
  assert.equal(accountOnly.sortCode, "");
  assert.equal(accountOnly.accountNumber, "12345678");

  const noVat = buildInvoiceFromQuote({
    quote: { ...bathroom, vatEnabled: false },
    profile: {},
    existingNumbers: ["INV-0001"],
    today: "2026-10-21",
    id: "inv_test_2",
    token: "i_abcdefghijklmnopqrstuv",
  });
  assert.equal(noVat.ok, true);
  if (!noVat.ok) return;
  assert.equal(noVat.invoice.number, "INV-0002");
  assert.equal(noVat.invoice.vat, 0);
  assert.equal(noVat.invoice.total, 150);

  const draft = buildInvoiceFromQuote({
    quote: { ...bathroom, status: "Draft" },
    profile: {},
    existingNumbers: [],
    today: "2026-10-21",
    id: "inv_test_3",
    token: "i_abcdefghijklmnopqrstuv",
  });
  assert.equal(draft.ok, false);
});

test("overdue is worked out from the due date and is not stored on paid or draft invoices", () => {
  assert.equal(displayInvoiceStatus("Sent", "2026-10-20", "2026-10-21"), "Overdue");
  assert.equal(displayInvoiceStatus("Sent", "2026-10-21", "2026-10-21"), "Sent");
  assert.equal(displayInvoiceStatus("Sent", "2026-11-04", "2026-10-21"), "Sent");
  assert.equal(displayInvoiceStatus("Paid", "2026-10-01", "2026-10-21"), "Paid");
  assert.equal(displayInvoiceStatus("Draft", "2026-10-01", "2026-10-21"), "Draft");
  assert.equal(displayInvoiceStatus("Issued", "2026-11-01", "2026-10-21"), "Sent");
  assert.equal(displayInvoiceStatus("Overdue", "2026-11-01", "2026-10-21"), "Sent");
  assert.equal(todayIso(new Date("2026-10-21T12:00:00Z")), "2026-10-21");
  assert.equal(todayIso(new Date("2026-10-21T23:30:00Z")), "2026-10-22");
});

test("a template keeps the name, lines, and notes", () => {
  const saved = templateFromQuote(
    {
      title: "Boiler swap",
      notes: "Combi in the kitchen.",
      vatEnabled: false,
      items: [{ description: "Combi boiler", quantity: 1, unit: "unit", rate: 900, type: "material" }],
    },
    "  Boiler swap  "
  );
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(saved.template.name, "Boiler swap");
  assert.equal(saved.template.notes, "Combi in the kitchen.");
  assert.equal(saved.template.items.length, 1);
  assert.equal(saved.template.vatEnabled, false);
  assert.equal(templateFromQuote({ items: [] }, "Empty").ok, false);
  assert.equal(templateFromQuote({ items: [{ description: "Tap", quantity: 1, rate: 20 }] }, "  ").ok, false);
});
