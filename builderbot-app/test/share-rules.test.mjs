import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizePhoneNumber,
  formatWhatsAppQuoteMessage,
  getWhatsAppShareUrl,
  formatWhatsAppInvoiceMessage,
  getWhatsAppInvoiceShareUrl,
  getEmailShareUrl,
  formatWhatsAppFollowUpMessage,
  getWhatsAppFollowUpUrl,
} from "../lib/share-rules.mjs";

test("Phone Normalization: Handles UK mobiles, landlines and international numbers", () => {
  // UK standard mobile
  assert.equal(normalizePhoneNumber("07911 123456"), "447911123456");
  assert.equal(normalizePhoneNumber("+44 7911 123456"), "447911123456");
  assert.equal(normalizePhoneNumber("07911-123-456"), "447911123456");

  // UK Landline
  assert.equal(normalizePhoneNumber("0117 912 3456"), "441179123456");

  // International format with +
  assert.equal(normalizePhoneNumber("+1 555 123 4567"), "15551234567");

  // Empty string
  assert.equal(normalizePhoneNumber(""), "");
});

test("WhatsApp Quote Message: Generates high-converting, professional trade copy", () => {
  const msg = formatWhatsAppQuoteMessage(
    {
      quoteId: "BB-1042",
      token: "q_demo_token_123",
      clientName: "Sarah Jenkins",
      clientPhone: "07911 123456",
      quoteTitle: "Ensuite Bathroom Renovation",
      companyName: "Premier Trade Services",
      contractorName: "Alex Morgan",
      total: 850.0,
      deposit: 170.0,
      depositPercent: 20,
    },
    "https://builderbot.co.uk"
  );

  assert.equal(
    msg,
    "Hi Sarah, here's your quote from Premier Trade Services for Ensuite Bathroom Renovation: https://builderbot.co.uk/q/q_demo_token_123"
  );
});

test("WhatsApp Quote URL: Generates valid wa.me deep links with phone and encoded text", () => {
  const url = getWhatsAppShareUrl(
    {
      quoteId: "BB-1042",
      token: "q_token_abc",
      clientName: "Sarah Jenkins",
      clientPhone: "07911 123456",
      quoteTitle: "Fence Replacement",
      total: 500,
      deposit: 100,
      depositPercent: 20,
    },
    "https://builderbot.co.uk"
  );

  assert.match(url, /^https:\/\/wa\.me\/447911123456\?text=/);
  assert.match(url, /Fence%20Replacement/);

  // Fallback to wa.me/?text= if phone is omitted
  const noPhoneUrl = getWhatsAppShareUrl(
    {
      quoteId: "BB-1042",
      token: "q_token_abc",
      clientName: "Client",
      quoteTitle: "Kitchen",
      total: 1000,
      deposit: 200,
      depositPercent: 20,
    },
    "https://builderbot.co.uk"
  );
  assert.match(noPhoneUrl, /^https:\/\/wa\.me\/\?text=/);
});

test("WhatsApp Invoice Message: Includes bank payment details, balance and reference", () => {
  const invoiceMsg = formatWhatsAppInvoiceMessage({
    invoiceId: "INV-1042",
    clientName: "David Miller",
    clientPhone: "07820 445566",
    title: "Electrical Consumer Unit Installation",
    companyName: "Premier Trade Services",
    total: 1161.6,
    balanceDue: 929.28,
    dueDate: "2026-10-22",
    bankName: "Barclays Commercial",
    bankSortCode: "20-00-00",
    bankAccountNumber: "55443322",
  });

  assert.match(invoiceMsg, /Hi David,/);
  assert.match(invoiceMsg, /INV-1042/);
  assert.match(invoiceMsg, /£1161\.60/);
  assert.match(invoiceMsg, /£929\.28/);
  assert.match(invoiceMsg, /Sort Code: 20-00-00/);
  assert.match(invoiceMsg, /Account: 55443322/);
  assert.match(invoiceMsg, /Payment Reference: INV-1042/);
});

test("WhatsApp Invoice URL: Encodes wa.me URL correctly", () => {
  const invoiceUrl = getWhatsAppInvoiceShareUrl({
    invoiceId: "INV-1042",
    clientName: "David Miller",
    clientPhone: "07820 445566",
    title: "Electrical Work",
    total: 1000,
    balanceDue: 500,
    bankSortCode: "20-00-00",
    bankAccountNumber: "12345678",
  });

  assert.match(invoiceUrl, /^https:\/\/wa\.me\/447820445566\?text=/);
});

test("Email Share: Pre-populates mailto link with encoded quote subject and body", () => {
  const emailUrl = getEmailShareUrl(
    {
      quoteId: "BB-1042",
      token: "q_token_123",
      clientName: "Sarah Jenkins",
      quoteTitle: "Bathroom Renovation",
      companyName: "Premier Trade Services",
      total: 850,
      deposit: 170,
      depositPercent: 20,
    },
    "sarah@example.com",
    "https://builderbot.co.uk"
  );

  assert.match(emailUrl, /^mailto:sarah@example\.com\?subject=/);
  assert.match(emailUrl, /BB-1042/);
});

test("WhatsApp Follow-Up Message: Generates warm, non-pushy trade copy", () => {
  const followUpMsg = formatWhatsAppFollowUpMessage(
    {
      quoteId: "BB-1042",
      token: "q_token_123",
      clientName: "David Miller",
      quoteTitle: "Timber Fencing Replacement",
      companyName: "Premier Trade Services",
      contractorName: "Michael Boylen",
    },
    "https://trademate.co.uk"
  );

  assert.match(followUpMsg, /Hi David, hope you're having a good week!/);
  assert.match(followUpMsg, /Timber Fencing Replacement/);
  assert.match(followUpMsg, /https:\/\/trademate\.co\.uk\/q\/q_token_123/);
  assert.match(followUpMsg, /Premier Trade Services/);
});

test("WhatsApp Follow-Up URL: Generates valid wa.me link with phone", () => {
  const url = getWhatsAppFollowUpUrl(
    {
      quoteId: "BB-1042",
      token: "q_token_123",
      clientName: "David Miller",
      clientPhone: "07820 445566",
      quoteTitle: "Boiler Installation",
    },
    "https://trademate.co.uk"
  );

  assert.match(url, /^https:\/\/wa\.me\/447820445566\?text=/);
});

