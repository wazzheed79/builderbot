import test from "node:test";
import assert from "node:assert/strict";

import { recalculateQuoteTotals, roundMoney } from "../lib/quote-rules.mjs";
import { buildChoiceOptions } from "../lib/quote-options.mjs";
import { quoteDraftForSave } from "../lib/quote-draft.mjs";
import { invoiceTotals, normalizeStoredInvoice } from "../lib/invoice-rules.mjs";
import { normalizeStoredTemplate } from "../lib/quote-template-rules.mjs";
import {
  NOT_VAT_REGISTERED_LINE,
  chargesVat,
  parseUkVatNumber,
  quoteChargesVat,
  tierPriceCaption,
  vatOnNet,
  vatPresentation,
  vatRegLine,
} from "../lib/vat.mjs";

test("VAT is 20% of the net, rounded to pennies once", () => {
  const awkward = recalculateQuoteTotals([{ quantity: 1, rate: 33.33 }], true, 0);
  assert.equal(awkward.subtotal, 33.33);
  assert.equal(awkward.vat, 6.67);
  assert.equal(awkward.total, 40);

  const roundsDown = recalculateQuoteTotals([{ quantity: 1, rate: 10.01 }], true, 0);
  assert.equal(roundsDown.vat, 2);
  assert.equal(roundsDown.total, 12.01);

  const roundsUp = recalculateQuoteTotals([{ quantity: 1, rate: 10.03 }], true, 0);
  assert.equal(roundsUp.vat, 2.01);
  assert.equal(roundsUp.total, 12.04);

  const tiny = recalculateQuoteTotals([{ quantity: 1, rate: 0.01 }], true, 0);
  assert.equal(tiny.vat, 0);
  assert.equal(tiny.total, 0.01);

  const threePence = recalculateQuoteTotals([{ quantity: 1, rate: 0.03 }], true, 0);
  assert.equal(threePence.vat, 0.01);
  assert.equal(threePence.total, 0.04);

  const nearPound = recalculateQuoteTotals([{ quantity: 1, rate: 19.99 }], true, 20);
  assert.equal(nearPound.subtotal, 19.99);
  assert.equal(nearPound.vat, 4);
  assert.equal(nearPound.total, 23.99);
  assert.equal(nearPound.deposit, 4.8);

  const large = recalculateQuoteTotals([{ quantity: 1, rate: 9999.99 }], true, 0);
  assert.equal(large.vat, 2000);
  assert.equal(large.total, 11999.99);

  const hours = recalculateQuoteTotals([{ quantity: 3, rate: 19.99 }], true, 0);
  assert.equal(hours.subtotal, 59.97);
  assert.equal(hours.vat, 11.99);
  assert.equal(hours.total, 71.96);

  // Two lines of 2p. VAT on each line would be 0p. VAT on the net is 1p.
  const combined = recalculateQuoteTotals(
    [
      { quantity: 1, rate: 0.02 },
      { quantity: 1, rate: 0.02 },
    ],
    true,
    0
  );
  assert.equal(combined.subtotal, 0.04);
  assert.equal(combined.vat, 0.01);
  assert.equal(combined.total, 0.05);
  assert.equal(vatOnNet(0.04), 0.01);
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
});

test("a missing VAT flag means no VAT, and entered prices stay excluding VAT", () => {
  const items = [{ quantity: 2, rate: 50 }];
  const omitted = recalculateQuoteTotals(items);
  assert.equal(omitted.subtotal, 100);
  assert.equal(omitted.vat, 0);
  assert.equal(omitted.total, 100);

  const explicit = recalculateQuoteTotals(items, false, 10);
  assert.equal(explicit.vat, 0);
  assert.equal(explicit.total, 100);
  assert.equal(explicit.deposit, 10);

  const registered = recalculateQuoteTotals(items, true, 10);
  assert.equal(registered.subtotal, 100);
  assert.equal(registered.vat, 20);
  assert.equal(registered.total, 120);
  assert.equal(registered.deposit, 12);

  assert.equal(chargesVat(undefined), false);
  assert.equal(chargesVat(null), false);
  assert.equal(chargesVat(false), false);
  assert.equal(chargesVat("false"), false);
  assert.equal(chargesVat(true), true);
  assert.equal(quoteChargesVat({}), false);
  assert.equal(quoteChargesVat({ vat_enabled: true }), true);
  assert.equal(invoiceTotals(items, undefined).vat, 0);
});

test("Better and Premium stay 15% and 30% of the net, then VAT is added", () => {
  const items = [{ id: "1", description: "Labour", quantity: 1, unit: "job", rate: 400 }];
  const withVat = buildChoiceOptions(items, true, 0);
  assert.equal(withVat[0].subtotal, 400);
  assert.equal(withVat[0].vat, 80);
  assert.equal(withVat[0].total, 480);
  assert.equal(withVat[1].subtotal, 460);
  assert.equal(withVat[1].items[1].rate, 60);
  assert.equal(withVat[1].vat, 92);
  assert.equal(withVat[1].total, 552);
  assert.equal(withVat[2].subtotal, 520);
  assert.equal(withVat[2].items[1].rate, 120);
  assert.equal(withVat[2].vat, 104);
  assert.equal(withVat[2].total, 624);

  const small = buildChoiceOptions(
    [{ id: "1", description: "Call-out", quantity: 1, unit: "visit", rate: 80 }],
    true,
    0
  );
  assert.equal(small[1].items[1].rate, 25);
  assert.equal(small[1].subtotal, 105);
  assert.equal(small[1].vat, 21);
  assert.equal(small[1].total, 126);
  assert.equal(small[2].items[1].rate, 45);
  assert.equal(small[2].subtotal, 125);
  assert.equal(small[2].vat, 25);
  assert.equal(small[2].total, 150);

  const notRegistered = buildChoiceOptions(items, false, 0);
  assert.equal(notRegistered[1].vat, 0);
  assert.equal(notRegistered[1].total, 460);
  assert.equal(notRegistered[2].total, 520);

  const omittedFlag = buildChoiceOptions(items);
  assert.equal(omittedFlag[0].vat, 0);
  assert.equal(omittedFlag[0].total, 400);
});

test("saving a Better price still charges VAT on Standard and Premium", () => {
  const saved = quoteDraftForSave({
    items: [
      { id: "1", description: "Labour", quantity: 1, unit: "job", rate: 100 },
      { id: "extra", description: "Better finish", quantity: 1, unit: "job", rate: 15 },
    ],
    vatEnabled: true,
    depositPercent: 0,
    choiceIndex: 1,
    choiceOptions: [
      {
        id: "opt-standard",
        label: "Standard",
        items: [{ id: "1", description: "Labour", quantity: 1, unit: "job", rate: 100 }],
        subtotal: 100,
        vat: 0,
        total: 100,
        deposit: 0,
      },
      {
        id: "opt-better",
        label: "Better",
        items: [
          { id: "1", description: "Labour", quantity: 1, unit: "job", rate: 100 },
          { id: "extra", description: "Better finish", quantity: 1, unit: "job", rate: 15 },
        ],
        subtotal: 115,
        vat: 0,
        total: 115,
        deposit: 0,
      },
    ],
  });
  assert.equal(saved.subtotal, 115);
  assert.equal(saved.vat, 23);
  assert.equal(saved.total, 138);
  assert.equal(saved.options[0].vat, 20);
  assert.equal(saved.options[0].total, 120);
  assert.equal(saved.options[1].vat, 23);
  assert.equal(saved.options[1].total, 138);
});

test("the customer sees a VAT breakdown, or a clear not-registered line", () => {
  const registered = vatPresentation({ vatEnabled: true, vatNumber: "123 4567 89" });
  assert.equal(registered.charges, true);
  assert.equal(registered.subtotalLabel, "Subtotal (ex VAT)");
  assert.equal(registered.vatLabel, "VAT (20%)");
  assert.equal(registered.totalLabel, "Total inc VAT");
  assert.equal(registered.regLine, "VAT reg no: GB123456789");
  assert.match(registered.pricesNote, /excluding VAT/);

  const older = vatPresentation({});
  assert.equal(older.charges, false);
  assert.equal(older.notice, NOT_VAT_REGISTERED_LINE);
  assert.equal(older.regLine, "");
  assert.equal(older.totalLabel, "Total");

  const registeredButOff = vatPresentation({ vatEnabled: false, businessRegistered: true, vatNumber: "GB123456789" });
  assert.equal(registeredButOff.notice, "No VAT charged.");
  assert.equal(registeredButOff.regLine, "");
  assert.equal(tierPriceCaption(true), "inc VAT");
  assert.equal(tierPriceCaption(false), "");
  assert.equal(tierPriceCaption(undefined), "");
});

test("a UK VAT number is optional and loosely checked", () => {
  assert.deepEqual(parseUkVatNumber(""), { ok: true, vatNumber: "" });
  assert.deepEqual(parseUkVatNumber("   "), { ok: true, vatNumber: "" });
  assert.deepEqual(parseUkVatNumber("gb123456789"), { ok: true, vatNumber: "GB123456789" });
  assert.deepEqual(parseUkVatNumber("GB 123 4567 89"), { ok: true, vatNumber: "GB123456789" });
  assert.deepEqual(parseUkVatNumber("123456789"), { ok: true, vatNumber: "GB123456789" });
  assert.deepEqual(parseUkVatNumber("123-456-789"), { ok: true, vatNumber: "GB123456789" });
  assert.equal(parseUkVatNumber("GB12345678").ok, false);
  assert.equal(parseUkVatNumber("DE123456789").ok, false);
  assert.equal(parseUkVatNumber("GB1234567890").ok, false);
  assert.equal(parseUkVatNumber("not a number").ok, false);
  assert.equal(vatRegLine("123456789"), "VAT reg no: GB123456789");
  assert.equal(vatRegLine("nope"), "");
  assert.equal(vatRegLine(""), "");
});

test("an older invoice or template with no VAT flag is not registered", () => {
  const invoice = normalizeStoredInvoice({
    id: "inv_old",
    number: "INV-0008",
    items: [{ description: "Tap", quantity: 1, unit: "unit", rate: 80 }],
    subtotal: 80,
    total: 80,
    status: "Sent",
  });
  assert.equal(invoice.vatEnabled, false);
  assert.equal(invoice.vat, 0);
  assert.equal(invoice.total, 80);

  const stillCharging = normalizeStoredInvoice({
    id: "inv_vat",
    number: "INV-0009",
    vatEnabled: true,
    items: [{ description: "Tap", quantity: 1, unit: "unit", rate: 80 }],
    status: "Draft",
  });
  assert.equal(stillCharging.vatEnabled, true);
  assert.equal(stillCharging.vat, 16);
  assert.equal(stillCharging.total, 96);

  const template = normalizeStoredTemplate({
    name: "Boiler",
    title: "Boiler swap",
    items: [{ description: "Boiler", quantity: 1, unit: "unit", rate: 900 }],
  });
  assert.equal(template.vatEnabled, false);
});
