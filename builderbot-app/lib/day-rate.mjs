/**
 * Day rate calculator rules for UK sole traders, tax year 2026/27
 * (6 April 2026 to 5 April 2027).
 *
 * Pure functions only, so they run the same in the browser, the server and
 * the tests. Guidance, not tax advice: it treats the trade as the person's
 * only income and does not cover limited companies, CIS refunds or IR35.
 *
 * Sources, checked 18 November 2026:
 * - Income Tax bands and Personal Allowance taper:
 *   https://www.gov.uk/income-tax-rates
 * - Scottish Income Tax bands: https://www.gov.uk/scottish-income-tax
 * - Class 4 National Insurance, and Class 2 no longer payable over £7,105:
 *   https://www.gov.uk/self-employed-national-insurance-rates
 * - Student loan thresholds and rates:
 *   https://www.gov.uk/repaying-your-student-loan/what-you-pay
 * - VAT registration threshold: https://www.gov.uk/register-for-vat
 * - Bank holidays: https://www.gov.uk/bank-holidays (8 in England and Wales,
 *   9 in Scotland and 10 in Northern Ireland in 2027).
 */

export const TAX_YEAR_LABEL = "2026/27";
/** First day of the tax year, used for the year picture. */
export const TAX_YEAR_START = "2026-04-06";

// https://www.gov.uk/income-tax-rates
export const PERSONAL_ALLOWANCE = 12570;
export const ALLOWANCE_TAPER_START = 100000;
// The allowance falls by £1 for every £2 over £100,000, so it is gone at £125,140.

/**
 * Bands on taxable income (after the Personal Allowance).
 * England, Wales and Northern Ireland: basic £12,571 to £50,270 gross is
 * £37,700 of taxable income; additional rate over £125,140.
 */
export const RUK_BANDS = [
  { upTo: 37700, rate: 0.2 },
  { upTo: 125140, rate: 0.4 },
  { upTo: Infinity, rate: 0.45 },
];

/**
 * Scotland, from https://www.gov.uk/scottish-income-tax, given there as gross
 * income with the standard £12,570 allowance. Converted to taxable income by
 * taking £12,570 off each limit:
 * starter £12,571–£16,537 (19%), basic £16,538–£29,526 (20%),
 * intermediate £29,527–£43,662 (21%), higher £43,663–£75,000 (42%),
 * advanced £75,001–£125,140 (45%), top over £125,140 (48%).
 */
export const SCOTLAND_BANDS = [
  { upTo: 16537 - PERSONAL_ALLOWANCE, rate: 0.19 },
  { upTo: 29526 - PERSONAL_ALLOWANCE, rate: 0.2 },
  { upTo: 43662 - PERSONAL_ALLOWANCE, rate: 0.21 },
  { upTo: 75000 - PERSONAL_ALLOWANCE, rate: 0.42 },
  { upTo: 125140, rate: 0.45 },
  { upTo: Infinity, rate: 0.48 },
];

// https://www.gov.uk/self-employed-national-insurance-rates
export const CLASS4_LOWER = 12570;
export const CLASS4_UPPER = 50270;
export const CLASS4_MAIN_RATE = 0.06;
export const CLASS4_UPPER_RATE = 0.02;

// https://www.gov.uk/repaying-your-student-loan/what-you-pay
export const STUDENT_LOAN_PLANS = {
  none: null,
  plan1: { label: "Plan 1", threshold: 26900, rate: 0.09 },
  plan2: { label: "Plan 2", threshold: 29385, rate: 0.09 },
  plan4: { label: "Plan 4 (Scotland)", threshold: 33795, rate: 0.09 },
  plan5: { label: "Plan 5", threshold: 25000, rate: 0.09 },
};
export const POSTGRAD_LOAN = { threshold: 21000, rate: 0.06 };

// https://www.gov.uk/register-for-vat
export const VAT_THRESHOLD = 90000;
/** How close counts as "getting close" in the warning. A display choice, not an HMRC rule. */
export const VAT_NEAR_MARGIN = 10000;

// https://www.gov.uk/bank-holidays (2027 counts)
export const BANK_HOLIDAYS = {
  "england-wales": 8,
  scotland: 9,
  "northern-ireland": 10,
};

export const NATIONS = [
  { id: "england-wales", label: "England or Wales" },
  { id: "scotland", label: "Scotland" },
  { id: "northern-ireland", label: "Northern Ireland" },
];

/** Cost lines. The numbers in DEFAULT_INPUTS are example starting points, not averages. */
export const COST_FIELDS = [
  { key: "van", label: "Van (finance, lease or wear)" },
  { key: "fuel", label: "Fuel" },
  { key: "tools", label: "Tools and kit" },
  { key: "insurance", label: "Insurance (liability, van, tools)" },
  { key: "phone", label: "Phone and software" },
  { key: "accountant", label: "Accountant" },
  { key: "training", label: "Training, cards and certificates" },
  { key: "other", label: "Everything else" },
];

/**
 * Example starting figures so the page shows a working answer straight away.
 * They are made-up round numbers for someone to replace, and the page says so.
 */
export const DEFAULT_INPUTS = Object.freeze({
  trade: "general",
  nation: "england-wales",
  takeHome: 35000,
  pension: 0,
  studentLoan: "none",
  postgradLoan: false,
  van: 4000,
  fuel: 3000,
  tools: 1000,
  insurance: 600,
  phone: 500,
  accountant: 600,
  training: 300,
  other: 500,
  daysPerWeek: 5,
  holidayDays: 20,
  bankHolidays: 8,
  sickDays: 5,
  adminDays: 20,
  weatherDays: 10,
  hoursPerDay: 8,
  bufferPercent: 10,
  markupPercent: 20,
  callOutHours: 1,
  weekendUplift: 50,
  emergencyUplift: 100,
});

/**
 * Trade starting points. They only change which example figures load first
 * (for example more lost weather days for outdoor work). They are not rates.
 */
export const TRADE_PRESETS = [
  { id: "general", label: "General builder", patch: {} },
  { id: "electrician", label: "Electrician", patch: { weatherDays: 3, training: 800 } },
  { id: "plumber", label: "Plumber or heating", patch: { weatherDays: 3, training: 800 } },
  { id: "carpenter", label: "Carpenter or joiner", patch: { weatherDays: 5, tools: 1500 } },
  { id: "decorator", label: "Painter and decorator", patch: { weatherDays: 8, tools: 600 } },
  { id: "plasterer", label: "Plasterer", patch: { weatherDays: 5 } },
  { id: "tiler", label: "Tiler", patch: { weatherDays: 3 } },
  { id: "roofer", label: "Roofer", patch: { weatherDays: 20, insurance: 900 } },
  { id: "bricklayer", label: "Bricklayer", patch: { weatherDays: 20 } },
  { id: "landscaper", label: "Landscaper or gardener", patch: { weatherDays: 20, tools: 1500 } },
  { id: "handyman", label: "Handyman", patch: { weatherDays: 3, van: 3000 } },
  { id: "other", label: "Another trade", patch: {} },
];

const LIMITS = {
  takeHome: [0, 500000],
  pension: [0, 100000],
  van: [0, 100000],
  fuel: [0, 100000],
  tools: [0, 100000],
  insurance: [0, 100000],
  phone: [0, 100000],
  accountant: [0, 100000],
  training: [0, 100000],
  other: [0, 200000],
  daysPerWeek: [1, 7],
  holidayDays: [0, 200],
  bankHolidays: [0, 20],
  sickDays: [0, 200],
  adminDays: [0, 200],
  weatherDays: [0, 200],
  hoursPerDay: [1, 16],
  bufferPercent: [0, 100],
  markupPercent: [0, 200],
  callOutHours: [0, 8],
  weekendUplift: [0, 300],
  emergencyUplift: [0, 500],
};

function num(value, fallback) {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[£,\s]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, [lo, hi]) {
  return Math.min(hi, Math.max(lo, n));
}

/** Pennies, half up. */
export function roundPence(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Clean, bounded inputs. Unknown keys are dropped and bad numbers fall back
 * to the example defaults.
 * @param {Record<string, unknown>} [raw]
 */
export function normaliseInputs(raw = {}) {
  const src = raw && typeof raw === "object" ? raw : {};
  /** @type {Record<string, any>} */
  const out = { ...DEFAULT_INPUTS };
  for (const [key, range] of Object.entries(LIMITS)) {
    if (key in src) out[key] = clamp(num(src[key], DEFAULT_INPUTS[key]), range);
  }
  out.nation = NATIONS.some((n) => n.id === src.nation) ? src.nation : DEFAULT_INPUTS.nation;
  out.trade = TRADE_PRESETS.some((t) => t.id === src.trade) ? src.trade : DEFAULT_INPUTS.trade;
  out.studentLoan =
    typeof src.studentLoan === "string" && src.studentLoan in STUDENT_LOAN_PLANS
      ? src.studentLoan
      : "none";
  out.postgradLoan = src.postgradLoan === true || src.postgradLoan === "1" || src.postgradLoan === 1;
  out.holidayDays = Math.round(out.holidayDays);
  out.bankHolidays = Math.round(out.bankHolidays);
  out.sickDays = Math.round(out.sickDays);
  out.adminDays = Math.round(out.adminDays);
  out.weatherDays = Math.round(out.weatherDays);
  out.daysPerWeek = Math.round(out.daysPerWeek);
  return out;
}

/** Personal Allowance after the £100,000 taper. */
export function personalAllowance(income) {
  const over = Math.max(0, num(income, 0) - ALLOWANCE_TAPER_START);
  return Math.max(0, PERSONAL_ALLOWANCE - Math.floor(over / 2));
}

/**
 * Income Tax on self-employed profit, as the only income.
 * @param {number} profit
 * @param {string} [nation]
 */
export function incomeTax(profit, nation = "england-wales") {
  const income = Math.max(0, num(profit, 0));
  const taxable = Math.max(0, income - personalAllowance(income));
  const bands = nation === "scotland" ? SCOTLAND_BANDS : RUK_BANDS;
  let tax = 0;
  let lower = 0;
  for (const band of bands) {
    if (taxable <= lower) break;
    const slice = Math.min(taxable, band.upTo) - lower;
    if (slice > 0) tax += slice * band.rate;
    lower = band.upTo;
  }
  return roundPence(tax);
}

/** Class 4 National Insurance. Class 2 is not payable on profits over £7,105. */
export function class4NI(profit) {
  const p = Math.max(0, num(profit, 0));
  const main = Math.max(0, Math.min(p, CLASS4_UPPER) - CLASS4_LOWER) * CLASS4_MAIN_RATE;
  const upper = Math.max(0, p - CLASS4_UPPER) * CLASS4_UPPER_RATE;
  return roundPence(main + upper);
}

/**
 * Yearly student loan repayment worked out through Self Assessment.
 * @param {number} profit
 * @param {string} [plan]
 * @param {boolean} [postgrad]
 */
export function studentLoanRepayment(profit, plan = "none", postgrad = false) {
  const p = Math.max(0, num(profit, 0));
  /** @type {any} */
  const chosen = STUDENT_LOAN_PLANS[plan] || null;
  let total = 0;
  if (chosen) total += Math.max(0, p - chosen.threshold) * chosen.rate;
  if (postgrad) total += Math.max(0, p - POSTGRAD_LOAN.threshold) * POSTGRAD_LOAN.rate;
  return roundPence(total);
}

/**
 * Everything taken off profit by HMRC and the Student Loans Company.
 * @param {number} profit
 * @param {{ nation?: string, studentLoan?: string, postgradLoan?: boolean }} [opts]
 */
export function deductions(profit, opts = {}) {
  const tax = incomeTax(profit, opts.nation);
  const ni = class4NI(profit);
  const loan = studentLoanRepayment(profit, opts.studentLoan, opts.postgradLoan);
  return { tax, ni, loan, total: roundPence(tax + ni + loan) };
}

/** What is left of a profit after tax, NI and student loan. */
export function takeHomeFromProfit(profit, opts = {}) {
  const p = Math.max(0, num(profit, 0));
  return roundPence(p - deductions(p, opts).total);
}

/**
 * The smallest profit that leaves the wanted take-home. Take-home always
 * rises with profit (the highest combined marginal rate is well under 100%),
 * so a search is safe.
 * @param {number} target
 */
export function profitForTakeHome(target, opts = {}) {
  const want = Math.max(0, num(target, 0));
  if (want === 0) return 0;
  let lo = want;
  let hi = want * 3 + 10000;
  while (takeHomeFromProfit(hi, opts) < want) hi *= 2;
  for (let i = 0; i < 80 && hi - lo > 0.005; i++) {
    const mid = (lo + hi) / 2;
    if (takeHomeFromProfit(mid, opts) >= want) hi = mid;
    else lo = mid;
  }
  let pence = Math.floor(lo * 100);
  while (takeHomeFromProfit(pence / 100, opts) < want) pence += 1;
  return pence / 100;
}

/** Days in the working year and where they go. */
export function yearDays(inputs) {
  const i = normaliseInputs(inputs);
  const workingDays = i.daysPerWeek * 52;
  const daysOffWeek = 365 - workingDays;
  const lost = {
    holiday: i.holidayDays,
    bank: i.bankHolidays,
    sick: i.sickDays,
    admin: i.adminDays,
    weather: i.weatherDays,
  };
  const lostTotal = Object.values(lost).reduce((a, b) => a + b, 0);
  const billable = Math.max(1, workingDays - lostTotal);
  return { workingDays, daysOffWeek, lost, lostTotal, billable };
}

export function annualCosts(inputs) {
  const i = normaliseInputs(inputs);
  return roundPence(COST_FIELDS.reduce((sum, f) => sum + i[f.key], 0));
}

/**
 * The main sum.
 * Profit needed = the take-home (plus pension set aside) grossed up for tax,
 * NI and student loan. Turnover = profit + running costs. Day rate =
 * turnover ÷ billable days. A buffer on top is the user's own choice.
 * @param {Record<string, unknown>} raw
 */
export function calculateDayRate(raw) {
  const i = normaliseInputs(raw);
  const opts = { nation: i.nation, studentLoan: i.studentLoan, postgradLoan: i.postgradLoan };
  const wanted = i.takeHome + i.pension;
  const profitNeeded = profitForTakeHome(wanted, opts);
  const d = deductions(profitNeeded, opts);
  const costs = annualCosts(i);
  const turnoverFloor = roundPence(profitNeeded + costs);
  const days = yearDays(i);
  const floorDayRate = turnoverFloor / days.billable;
  const dayRate = Math.ceil(floorDayRate * (1 + i.bufferPercent / 100));
  const hourlyRate = Math.ceil(dayRate / i.hoursPerDay);
  const halfDayRate = Math.ceil(dayRate / 2);
  const turnover = roundPence(dayRate * days.billable);
  const callOut = i.callOutHours > 0 ? Math.ceil(hourlyRate * i.callOutHours) : 0;
  return {
    inputs: i,
    taxYear: TAX_YEAR_LABEL,
    wanted,
    profitNeeded,
    tax: d.tax,
    ni: d.ni,
    studentLoan: d.loan,
    taxTotal: d.total,
    costs,
    turnoverFloor,
    turnover,
    days,
    floorDayRate: Math.ceil(floorDayRate),
    dayRate,
    halfDayRate,
    hourlyRate,
    callOut,
    weekendDayRate: Math.ceil(dayRate * (1 + i.weekendUplift / 100)),
    emergencyHourlyRate: Math.ceil(hourlyRate * (1 + i.emergencyUplift / 100)),
    markupPercent: i.markupPercent,
    vat: vatCheck(turnover),
  };
}

/**
 * Where the turnover sits against the £90,000 VAT threshold.
 * @param {number} turnover
 */
export function vatCheck(turnover) {
  const t = Math.max(0, num(turnover, 0));
  const gap = roundPence(VAT_THRESHOLD - t);
  const status = t > VAT_THRESHOLD ? "over" : gap <= VAT_NEAR_MARGIN ? "close" : "under";
  return { threshold: VAT_THRESHOLD, turnover: roundPence(t), gap, status };
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

/**
 * The year as a picture: 365 day cells split into days off, lost days and
 * paid days, with paid days split into what each one pays for. Also the
 * dates in the tax year when the costs, then the tax, are covered, if the
 * paid days are spread evenly through the year.
 * @param {ReturnType<typeof calculateDayRate>} result
 */
export function yearPicture(result) {
  const { days, costs, taxTotal, turnover } = result;
  const share = (amount) => (turnover > 0 ? (amount / turnover) * days.billable : 0);
  const costDays = Math.min(days.billable, share(costs));
  const taxDays = Math.min(days.billable - costDays, share(taxTotal));
  const yourDays = Math.max(0, days.billable - costDays - taxDays);
  const counts = {
    weekend: days.daysOffWeek,
    holiday: days.lost.holiday + days.lost.bank,
    sick: days.lost.sick,
    admin: days.lost.admin,
    weather: days.lost.weather,
    costs: Math.round(costDays),
    tax: Math.round(taxDays),
    you: 0,
  };
  const used = Object.values(counts).reduce((a, b) => a + b, 0);
  counts.you = Math.max(0, 365 - used);
  const fraction = (n) => (days.billable > 0 ? n / days.billable : 0);
  return {
    counts,
    costDays: roundPence(costDays),
    taxDays: roundPence(taxDays),
    yourDays: roundPence(yourDays),
    costsCoveredOn: addDays(TAX_YEAR_START, fraction(costDays) * 365),
    taxCoveredOn: addDays(TAX_YEAR_START, fraction(costDays + taxDays) * 365),
  };
}

/**
 * "Did that job pay?" Takes a job already priced and finds what it paid per
 * day and per hour once materials and extras are out, then what is roughly
 * left after this person's own running costs and their average tax rate.
 * @param {{ price: number, materials?: number, extras?: number, days: number }} job
 * @param {ReturnType<typeof calculateDayRate>} result
 */
export function checkJob(job, result) {
  const price = Math.max(0, num(job?.price, 0));
  const materials = Math.max(0, num(job?.materials, 0));
  const extras = Math.max(0, num(job?.extras, 0));
  const daysOnJob = Math.max(0, num(job?.days, 0));
  if (price <= 0 || daysOnJob <= 0) return null;
  const labour = price - materials - extras;
  const perDay = labour / daysOnJob;
  const hours = result.inputs.hoursPerDay;
  const dailyCosts = result.costs / result.days.billable;
  const avgTaxRate = result.profitNeeded > 0 ? result.taxTotal / result.profitNeeded : 0;
  const profitPerDay = perDay - dailyCosts;
  const keptPerDay = profitPerDay > 0 ? profitPerDay * (1 - avgTaxRate) : profitPerDay;
  const neededForJob = result.dayRate * daysOnJob + materials + extras;
  const difference = roundPence(price - neededForJob);
  return {
    labour: roundPence(labour),
    perDay: roundPence(perDay),
    perHour: roundPence(perDay / hours),
    keptPerDay: roundPence(keptPerDay),
    keptPerHour: roundPence(keptPerDay / hours),
    targetKeptPerHour: roundPence(result.wanted / result.days.billable / hours),
    neededForJob: roundPence(neededForJob),
    difference,
    verdict: difference >= 0 ? "paid" : "short",
  };
}

/**
 * A quick job price from the day rate.
 * @param {{ days: number, materials?: number }} job
 * @param {ReturnType<typeof calculateDayRate>} result
 */
export function priceJob(job, result) {
  const days = Math.max(0, num(job?.days, 0));
  const materials = Math.max(0, num(job?.materials, 0));
  const labour = roundPence(days * result.dayRate);
  const materialsCharged = roundPence(materials * (1 + result.markupPercent / 100));
  return { labour, materialsCharged, total: roundPence(labour + materialsCharged) };
}

function money(n) {
  const value = Math.round(Number(n) || 0);
  return `£${value.toLocaleString("en-GB")}`;
}

/** Long UK date from yyyy-mm-dd, e.g. 1 January 2027. */
export function ukDate(iso) {
  const d = new Date(`${String(iso)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * Plain price-rise note to regular customers. A fixed template, no AI.
 * @param {{ oldRate: number, newRate: number, startDate?: string, businessName?: string, customerName?: string }} p
 */
export function priceRiseMessage(p) {
  const oldRate = Math.max(0, num(p?.oldRate, 0));
  const newRate = Math.max(0, num(p?.newRate, 0));
  const who = String(p?.customerName || "").trim().slice(0, 60);
  const from = String(p?.businessName || "").trim().slice(0, 80);
  const when = ukDate(p?.startDate || "") || "the start of next month";
  const lines = [
    who ? `Hi ${who},` : "Hi,",
    "",
    `Thanks for your work over the past year. I wanted to let you know in good time that from ${when} my day rate will go from ${money(oldRate)} to ${money(newRate)}.`,
    "",
    "Running costs like fuel, insurance and materials have gone up, and this keeps me able to do the job properly. Any work already quoted stays at the price agreed.",
    "",
    "If you have any questions, just give me a ring.",
    "",
    "Thanks,",
    from || "[Your name]",
  ];
  return lines.join("\n");
}

/** Short keys for a shareable link. */
const URL_KEYS = {
  trade: "t",
  nation: "n",
  takeHome: "th",
  pension: "pn",
  studentLoan: "sl",
  postgradLoan: "pg",
  van: "v",
  fuel: "f",
  tools: "tl",
  insurance: "in",
  phone: "ph",
  accountant: "ac",
  training: "tr",
  other: "o",
  daysPerWeek: "dw",
  holidayDays: "hd",
  bankHolidays: "bh",
  sickDays: "sd",
  adminDays: "ad",
  weatherDays: "wd",
  hoursPerDay: "hp",
  bufferPercent: "bf",
  markupPercent: "mu",
  callOutHours: "co",
  weekendUplift: "wu",
  emergencyUplift: "eu",
};

/** Inputs to a query string. Only values that differ from the defaults. */
export function inputsToQuery(raw) {
  const i = normaliseInputs(raw);
  const params = new URLSearchParams();
  for (const [key, short] of Object.entries(URL_KEYS)) {
    if (i[key] === DEFAULT_INPUTS[key]) continue;
    params.set(short, key === "postgradLoan" ? (i[key] ? "1" : "0") : String(i[key]));
  }
  return params.toString();
}

/** A query string back to clean inputs. */
export function inputsFromQuery(query) {
  const params = new URLSearchParams(String(query || "").replace(/^\?/, ""));
  /** @type {Record<string, unknown>} */
  const raw = {};
  for (const [key, short] of Object.entries(URL_KEYS)) {
    const value = params.get(short);
    if (value !== null) raw[key] = value;
  }
  return normaliseInputs(raw);
}

/**
 * Figures for the rate card image, read from its URL. Everything is bounded
 * so a link cannot draw nonsense or a huge image.
 * @param {URLSearchParams} params
 */
export function rateCardFromParams(params) {
  const whole = (key, max) => {
    const n = Math.round(num(params.get(key), 0));
    return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0;
  };
  const clean = (key, max) =>
    String(params.get(key) || "")
      .replace(/[\u0000-\u001f<>]/g, "")
      .trim()
      .slice(0, max);
  return {
    name: clean("name", 50),
    trade: clean("trade", 40),
    day: whole("day", 99999),
    half: whole("half", 99999),
    hour: whole("hour", 9999),
    callOut: whole("callout", 9999),
    weekend: whole("weekend", 99999),
    emergency: whole("emergency", 9999),
  };
}

/** Query string for the rate card image and print page. */
export function rateCardQuery(result, extra = {}) {
  const params = new URLSearchParams();
  const name = String(extra.name || "").trim().slice(0, 50);
  const trade = String(extra.trade || "").trim().slice(0, 40);
  if (name) params.set("name", name);
  if (trade) params.set("trade", trade);
  params.set("day", String(result.dayRate));
  params.set("half", String(result.halfDayRate));
  params.set("hour", String(result.hourlyRate));
  if (result.callOut > 0) params.set("callout", String(result.callOut));
  params.set("weekend", String(result.weekendDayRate));
  params.set("emergency", String(result.emergencyHourlyRate));
  return params.toString();
}

/**
 * The fields saved into Chuffed Quotes' own pricing memory when someone taps
 * "Use this rate". Same keys as PricingMemory in lib/storage.ts.
 * @param {ReturnType<typeof calculateDayRate>} result
 */
export function pricingMemoryPatch(result, nowIso = new Date().toISOString()) {
  return {
    laborDayRate: result.dayRate,
    laborHourlyRate: result.hourlyRate,
    preferredMarkupPercent: result.markupPercent,
    callOutFee: result.callOut,
    updatedAt: nowIso,
  };
}
