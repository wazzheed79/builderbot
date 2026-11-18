import test from "node:test";
import assert from "node:assert/strict";
import {
  BANK_HOLIDAYS,
  DEFAULT_INPUTS,
  VAT_THRESHOLD,
  calculateDayRate,
  checkJob,
  class4NI,
  deductions,
  incomeTax,
  inputsFromQuery,
  inputsToQuery,
  normaliseInputs,
  personalAllowance,
  priceJob,
  priceRiseMessage,
  pricingMemoryPatch,
  profitForTakeHome,
  rateCardFromParams,
  rateCardQuery,
  studentLoanRepayment,
  takeHomeFromProfit,
  vatCheck,
  yearDays,
  yearPicture,
} from "../lib/day-rate.mjs";

test("Personal Allowance tapers £1 for every £2 over £100,000 and is gone at £125,140", () => {
  assert.equal(personalAllowance(0), 12570);
  assert.equal(personalAllowance(100000), 12570);
  assert.equal(personalAllowance(100002), 12569);
  assert.equal(personalAllowance(110000), 7570);
  assert.equal(personalAllowance(125140), 0);
  assert.equal(personalAllowance(200000), 0);
});

test("England, Wales and NI Income Tax at the band edges for 2026/27", () => {
  assert.equal(incomeTax(0), 0);
  assert.equal(incomeTax(12570), 0);
  assert.equal(incomeTax(12571), 0.2);
  assert.equal(incomeTax(50270), 7540);
  assert.equal(incomeTax(50271), 7540.4);
  // £100,000: 37,700 at 20% + 49,730 at 40%.
  assert.equal(incomeTax(100000), 27432);
  // Inside the taper the allowance shrinks, so tax climbs faster.
  assert.equal(incomeTax(110000), 7540 + (110000 - 7570 - 37700) * 0.4);
  assert.equal(incomeTax(125140), 42516);
  assert.equal(incomeTax(150000), 42516 + (150000 - 125140) * 0.45);
  assert.equal(incomeTax(-500), 0);
});

test("Scottish Income Tax uses the six Scottish bands", () => {
  assert.equal(incomeTax(12570, "scotland"), 0);
  assert.equal(incomeTax(16537, "scotland"), 753.73);
  assert.equal(incomeTax(29526, "scotland"), 753.73 + 2597.8);
  assert.equal(incomeTax(43662, "scotland"), 6320.09);
  assert.equal(incomeTax(75000, "scotland"), 6320.09 + 31338 * 0.42);
  // Over £125,140 there is no allowance: the advanced band runs to £125,140 of taxable income.
  const at125 = incomeTax(125140, "scotland");
  assert.equal(
    at125,
    Math.round((3967 * 0.19 + 12989 * 0.2 + 14136 * 0.21 + 31338 * 0.42 + (125140 - 62430) * 0.45) * 100) / 100
  );
  assert.equal(incomeTax(130000, "scotland"), Math.round((at125 + 4860 * 0.48) * 100) / 100);
  assert.ok(incomeTax(40000, "scotland") > incomeTax(40000, "england-wales"));
});

test("Class 4 National Insurance is 6% then 2%, with no Class 2", () => {
  assert.equal(class4NI(12570), 0);
  assert.equal(class4NI(20000), 445.8);
  assert.equal(class4NI(50270), 2262);
  assert.equal(class4NI(60000), 2456.6);
  assert.equal(class4NI(5000), 0);
});

test("student loan repayments use each plan's yearly threshold", () => {
  assert.equal(studentLoanRepayment(40000, "none"), 0);
  assert.equal(studentLoanRepayment(26900, "plan1"), 0);
  assert.equal(studentLoanRepayment(36900, "plan1"), 900);
  assert.equal(studentLoanRepayment(39385, "plan2"), 900);
  assert.equal(studentLoanRepayment(43795, "plan4"), 900);
  assert.equal(studentLoanRepayment(35000, "plan5"), 900);
  assert.equal(studentLoanRepayment(31000, "none", true), 600);
  assert.equal(studentLoanRepayment(39385, "plan2", true), 900 + 18385 * 0.06);
  assert.equal(studentLoanRepayment(40000, "made-up"), 0);
});

test("working back from take-home lands on the penny", () => {
  for (const want of [0, 5000, 12570, 30000, 41000, 75000, 95000, 160000]) {
    for (const nation of ["england-wales", "scotland"]) {
      const opts = { nation, studentLoan: "plan2", postgradLoan: false };
      const profit = profitForTakeHome(want, opts);
      const kept = takeHomeFromProfit(profit, opts);
      assert.ok(kept >= want - 0.01, `${nation} ${want}: kept ${kept}`);
      assert.ok(takeHomeFromProfit(profit - 1, opts) < want || want === 0, `${nation} ${want} minimal`);
    }
  }
  assert.equal(profitForTakeHome(10000), 10000);
});

test("deductions add up", () => {
  const d = deductions(45000, { nation: "england-wales", studentLoan: "plan1" });
  assert.equal(d.tax, 6486);
  assert.equal(d.ni, 1945.8);
  assert.equal(d.loan, 1629);
  assert.equal(d.total, 6486 + 1945.8 + 1629);
});

test("billable days come from the user's own days, never below one", () => {
  const y = yearDays(DEFAULT_INPUTS);
  assert.equal(y.workingDays, 260);
  assert.equal(y.lostTotal, 63);
  assert.equal(y.billable, 197);
  assert.equal(yearDays({ ...DEFAULT_INPUTS, holidayDays: 200, sickDays: 200 }).billable, 1);
  assert.deepEqual(BANK_HOLIDAYS, { "england-wales": 8, scotland: 9, "northern-ireland": 10 });
});

test("the day rate covers take-home, tax and costs over billable days", () => {
  const r = calculateDayRate({ ...DEFAULT_INPUTS, bufferPercent: 0 });
  assert.equal(r.costs, 10500);
  assert.ok(Math.abs(takeHomeFromProfit(r.profitNeeded) - 35000) < 0.02);
  assert.equal(r.turnoverFloor, Math.round((r.profitNeeded + 10500) * 100) / 100);
  assert.equal(r.dayRate, Math.ceil(r.turnoverFloor / 197));
  assert.equal(r.halfDayRate, Math.ceil(r.dayRate / 2));
  assert.equal(r.hourlyRate, Math.ceil(r.dayRate / 8));
  assert.equal(r.callOut, r.hourlyRate);
  const withBuffer = calculateDayRate({ ...DEFAULT_INPUTS, bufferPercent: 10 });
  assert.ok(withBuffer.dayRate > r.dayRate);
  assert.equal(withBuffer.floorDayRate, r.floorDayRate);
});

test("pension and a student loan push the rate up", () => {
  const base = calculateDayRate(DEFAULT_INPUTS).dayRate;
  assert.ok(calculateDayRate({ ...DEFAULT_INPUTS, pension: 3000 }).dayRate > base);
  assert.ok(calculateDayRate({ ...DEFAULT_INPUTS, studentLoan: "plan2" }).dayRate > base);
  assert.ok(calculateDayRate({ ...DEFAULT_INPUTS, nation: "scotland" }).dayRate >= base);
});

test("VAT warning says under, close or over the £90,000 threshold", () => {
  assert.equal(VAT_THRESHOLD, 90000);
  assert.equal(vatCheck(50000).status, "under");
  assert.equal(vatCheck(80000).status, "close");
  assert.equal(vatCheck(90000).status, "close");
  assert.equal(vatCheck(90001).status, "over");
  assert.equal(calculateDayRate({ ...DEFAULT_INPUTS, takeHome: 90000 }).vat.status, "over");
});

test("the year picture always fills 365 days", () => {
  for (const takeHome of [10000, 35000, 80000]) {
    const r = calculateDayRate({ ...DEFAULT_INPUTS, takeHome });
    const p = yearPicture(r);
    const total = Object.values(p.counts).reduce((a, b) => a + b, 0);
    assert.equal(total, 365);
    assert.ok(p.costsCoveredOn >= "2026-04-06" && p.costsCoveredOn <= p.taxCoveredOn);
    assert.ok(p.taxCoveredOn <= "2027-04-06");
  }
});

test("did that job pay compares a past price with the day rate", () => {
  const r = calculateDayRate(DEFAULT_INPUTS);
  const good = checkJob({ price: r.dayRate * 3 + 500, materials: 500, days: 3 }, r);
  assert.equal(good.verdict, "paid");
  assert.equal(good.difference, 0);
  const bad = checkJob({ price: 600, materials: 200, extras: 50, days: 3 }, r);
  assert.equal(bad.verdict, "short");
  assert.equal(bad.labour, 350);
  assert.ok(bad.keptPerHour < bad.targetKeptPerHour);
  assert.equal(checkJob({ price: 0, days: 2 }, r), null);
  assert.equal(checkJob({ price: 500, days: 0 }, r), null);
});

test("job price uses the day rate and the materials markup", () => {
  const r = calculateDayRate({ ...DEFAULT_INPUTS, markupPercent: 10 });
  const p = priceJob({ days: 2, materials: 400 }, r);
  assert.equal(p.labour, r.dayRate * 2);
  assert.equal(p.materialsCharged, 440);
  assert.equal(p.total, r.dayRate * 2 + 440);
});

test("inputs survive a shareable link and bad values are bounded", () => {
  const custom = { ...DEFAULT_INPUTS, takeHome: 42000, nation: "scotland", studentLoan: "plan4", postgradLoan: true, weatherDays: 15 };
  const query = inputsToQuery(custom);
  assert.match(query, /th=42000/);
  assert.deepEqual(inputsFromQuery(query), normaliseInputs(custom));
  assert.equal(inputsToQuery(DEFAULT_INPUTS), "");
  const odd = inputsFromQuery("?th=-5&dw=99&n=mars&sl=plan9&t=<script>");
  assert.equal(odd.takeHome, 0);
  assert.equal(odd.daysPerWeek, 7);
  assert.equal(odd.nation, "england-wales");
  assert.equal(odd.studentLoan, "none");
  assert.equal(odd.trade, "general");
});

test("rate card figures are cleaned and bounded", () => {
  const r = calculateDayRate(DEFAULT_INPUTS);
  const card = rateCardFromParams(new URLSearchParams(rateCardQuery(r, { name: "Ace Repairs", trade: "Plumber" })));
  assert.equal(card.day, r.dayRate);
  assert.equal(card.hour, r.hourlyRate);
  assert.equal(card.name, "Ace Repairs");
  const nasty = rateCardFromParams(new URLSearchParams("name=<b>x</b>&day=1e12&hour=abc"));
  assert.equal(nasty.name, "bx/b");
  assert.equal(nasty.day, 99999);
  assert.equal(nasty.hour, 0);
});

test("price-rise note is a plain fixed template", () => {
  const text = priceRiseMessage({ oldRate: 250, newRate: 290, startDate: "2027-01-04", businessName: "Ace Repairs", customerName: "Sam" });
  assert.match(text, /^Hi Sam,/);
  assert.match(text, /from 4 January 2027 my day rate will go from £250 to £290/);
  assert.match(text, /already quoted stays at the price agreed/);
  assert.match(text, /Ace Repairs$/);
  assert.match(priceRiseMessage({ oldRate: 1, newRate: 2 }), /\[Your name\]$/);
});

test("Use this rate saves the same keys as the app's pricing memory", () => {
  const r = calculateDayRate(DEFAULT_INPUTS);
  const patch = pricingMemoryPatch(r, "2026-11-18T00:00:00Z");
  assert.deepEqual(Object.keys(patch).sort(), ["callOutFee", "laborDayRate", "laborHourlyRate", "preferredMarkupPercent", "updatedAt"]);
  assert.equal(patch.laborDayRate, r.dayRate);
  const storage = new URL("../lib/storage.ts", import.meta.url);
  return import("node:fs").then(({ readFileSync }) => {
    const src = readFileSync(storage, "utf8");
    for (const key of ["laborDayRate", "laborHourlyRate", "preferredMarkupPercent", "callOutFee"]) {
      assert.match(src, new RegExp(`${key}\\??:`));
    }
  });
});

test("the try-out only takes sensible saved rates", async () => {
  const { guestRatesFromBody, applyGuestRates } = await import("../lib/guest-demo.mjs");
  assert.equal(guestRatesFromBody(null), null);
  assert.equal(guestRatesFromBody([]), null);
  assert.equal(guestRatesFromBody({ laborDayRate: "lots" }), null);
  assert.equal(guestRatesFromBody({ laborDayRate: 1e9, laborHourlyRate: -4 }), null);
  assert.deepEqual(guestRatesFromBody({ laborDayRate: 299, laborHourlyRate: 38 }), { laborDayRate: 299, laborHourlyRate: 38 });
  const items = [
    { type: "labor", description: "Fit tap", quantity: 2, unit: "hrs", rate: 50 },
    { type: "labor", description: "Tiling", quantity: 1, unit: "Day", rate: 250 },
    { type: "labor", description: "Job", quantity: 1, unit: "job", rate: 90 },
    { type: "material", description: "Tap", quantity: 1, unit: "each", rate: 60 },
  ];
  const priced = applyGuestRates(items, { laborDayRate: 299, laborHourlyRate: 38 });
  assert.deepEqual(priced.map((i) => i.rate), [38, 299, 90, 60]);
  assert.equal(applyGuestRates(items, null), items);
});

test("the calculator is a public page in the sitemap, and its print page is public too", async () => {
  const { isGuestPublicPath } = await import("../lib/public-pages.mjs");
  const { PUBLIC_SITEMAP_PATHS } = await import("../lib/site-urls.mjs");
  assert.equal(isGuestPublicPath("/day-rate-calculator"), true);
  assert.equal(isGuestPublicPath("/day-rate-calculator/rate-card"), true);
  assert.ok(PUBLIC_SITEMAP_PATHS.includes("/day-rate-calculator"));
  assert.ok(!PUBLIC_SITEMAP_PATHS.includes("/day-rate-calculator/rate-card"));
});

test("the page carries WebApplication and FAQPage data and a guidance note", async () => {
  const { readFileSync } = await import("node:fs");
  const page = readFileSync(new URL("../app/day-rate-calculator/page.tsx", import.meta.url), "utf8");
  assert.match(page, /"@type": "WebApplication"/);
  assert.match(page, /"@type": "FAQPage"/);
  assert.match(page, /guidance, not tax advice/i);
  assert.doesNotMatch(page, /average day rate/i);
});

test("the calculator is linked from the menu, the home page, its footer and Settings", async () => {
  const { readFileSync } = await import("node:fs");
  for (const file of ["../components/AppNav.tsx", "../app/page.tsx", "../app/settings/page.tsx"]) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.match(src, /href="\/day-rate-calculator"/, file);
  }
  const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.equal(home.match(/href="\/day-rate-calculator"/g).length, 2);
});
