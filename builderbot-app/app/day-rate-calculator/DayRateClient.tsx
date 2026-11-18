"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  BadgePoundSterling,
  CalendarDays,
  Check,
  Copy,
  Download,
  FileText,
  Link2,
  MessageSquareText,
  Printer,
  Receipt,
  Share2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import NumberField from "@/components/NumberField";
import { useAuth } from "@/components/AuthProvider";
import { captureEvent } from "@/lib/analytics";
import { getPricingMemory, savePricingMemory } from "@/lib/storage";
import {
  BANK_HOLIDAYS,
  COST_FIELDS,
  DEFAULT_INPUTS,
  NATIONS,
  STUDENT_LOAN_PLANS,
  TAX_YEAR_START,
  TRADE_PRESETS,
  VAT_NEAR_MARGIN,
  calculateDayRate,
  checkJob,
  inputsFromQuery,
  inputsToQuery,
  normaliseInputs,
  priceJob,
  priceRiseMessage,
  pricingMemoryPatch,
  rateCardQuery,
  ukDate,
  yearPicture,
} from "@/lib/day-rate.mjs";

type Inputs = ReturnType<typeof normaliseInputs>;
type Result = ReturnType<typeof calculateDayRate>;

const fieldClass =
  "mt-1 w-full min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-3 text-base text-ink focus:border-clay-600 focus:outline-none focus:ring-1 focus:ring-clay-600";
const cardClass = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6";

function gbp(n: number, pence = false) {
  // Whole pounds stay whole, so £598 and £360 line up rather than £360.00.
  pence = pence && Math.round(n * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pence ? 2 : 0,
    maximumFractionDigits: pence ? 2 : 0,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Keys that a trade preset may change. They go back to the example value first. */
const PRESET_KEYS = ["weatherDays", "training", "tools", "insurance", "van"] as const;

const YEAR_COLOURS: Record<string, { cell: string; label: string }> = {
  you: { cell: "bg-emerald-600", label: "Paid days that are yours" },
  costs: { cell: "bg-amber-500", label: "Paid days covering the van, tools and costs" },
  tax: { cell: "bg-rose-500", label: "Paid days covering tax, NI and loan" },
  admin: { cell: "bg-stone-400", label: "Quoting and admin" },
  weather: { cell: "bg-slate-500", label: "Weather and gaps between jobs" },
  sick: { cell: "bg-violet-300", label: "Sick days" },
  holiday: { cell: "bg-sky-400", label: "Holidays and bank holidays" },
  weekend: { cell: "bg-stone-200", label: "Days you do not work" },
};
const YEAR_ORDER = ["you", "costs", "tax", "admin", "weather", "sick", "holiday", "weekend"];

function Money({
  id,
  label,
  value,
  onValue,
  hint,
  max,
}: {
  id: string;
  label: string;
  value: number;
  onValue: (n: number) => void;
  hint?: string;
  max?: number;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-bold text-ink">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-stone-500">£</span>
        <NumberField
          id={id}
          value={value}
          onValue={(n) => onValue(n ?? 0)}
          min={0}
          max={max}
          className={`${fieldClass} pl-7`}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

function Count({
  id,
  label,
  value,
  onValue,
  hint,
  suffix = "days",
  max,
  min = 0,
  decimal = false,
}: {
  id: string;
  label: string;
  value: number;
  onValue: (n: number) => void;
  hint?: string;
  suffix?: string;
  max?: number;
  min?: number;
  decimal?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-bold text-ink">
        {label}
      </label>
      <div className="relative">
        <NumberField
          id={id}
          value={value}
          decimal={decimal}
          onValue={(n) => onValue(n ?? 0)}
          min={min}
          max={max}
          className={`${fieldClass} pr-16`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-sm text-stone-500">
          {suffix}
        </span>
      </div>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className={cardClass} aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="flex items-center gap-3 text-lg font-black text-ink">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay-700 text-sm font-black text-white">
          {n}
        </span>
        {title}
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function YearPicture({ result }: { result: Result }) {
  const picture = yearPicture(result);
  const cells: string[] = [];
  for (const key of YEAR_ORDER) {
    const count = picture.counts[key as keyof typeof picture.counts] || 0;
    for (let i = 0; i < count; i++) cells.push(key);
  }
  return (
    <section className={cardClass} aria-labelledby="year-heading">
      <h2 id="year-heading" className="flex items-center gap-2 text-lg font-black text-ink">
        <CalendarDays className="h-5 w-5 text-clay-700" aria-hidden="true" />
        Your year in 365 squares
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">
        You are paid for <strong>{result.days.billable}</strong> days. The first{" "}
        <strong>{Math.round(picture.costDays)}</strong> go on running the business and the next{" "}
        <strong>{Math.round(picture.taxDays)}</strong> on tax and NI. If your paid days are spread evenly from{" "}
        {ukDate(TAX_YEAR_START)}, the costs are paid off by <strong>{ukDate(picture.costsCoveredOn)}</strong> and
        the tax by <strong>{ukDate(picture.taxCoveredOn)}</strong>. Every paid day after that is yours.
      </p>
      <div
        className="mt-4 grid gap-[3px] [grid-template-columns:repeat(23,minmax(0,1fr))] sm:[grid-template-columns:repeat(37,minmax(0,1fr))] lg:[grid-template-columns:repeat(53,minmax(0,1fr))]"
        role="img"
        aria-label={`365 days: ${YEAR_ORDER.map((k) => `${picture.counts[k as keyof typeof picture.counts]} ${YEAR_COLOURS[k].label.toLowerCase()}`).join(", ")}`}
      >
        {cells.map((key, i) => (
          <span key={i} className={`aspect-square rounded-[2px] ${YEAR_COLOURS[key].cell}`} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm text-stone-700 sm:grid-cols-2">
        {YEAR_ORDER.map((key) => (
          <li key={key} className="flex items-center gap-2">
            <span className={`h-3 w-3 shrink-0 rounded-sm ${YEAR_COLOURS[key].cell}`} aria-hidden="true" />
            <span className="font-bold tabular-nums">{picture.counts[key as keyof typeof picture.counts]}</span>
            <span>{YEAR_COLOURS[key].label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VatNotice({ result }: { result: Result }) {
  const { vat } = result;
  const tone =
    vat.status === "over"
      ? "border-red-300 bg-red-50 text-red-950"
      : vat.status === "close"
        ? "border-amber-300 bg-amber-50 text-amber-950"
        : "border-stone-200 bg-white text-stone-700";
  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${tone}`} aria-labelledby="vat-heading">
      <h2 id="vat-heading" className="flex items-center gap-2 text-base font-black">
        {vat.status === "under" ? (
          <Receipt className="h-5 w-5" aria-hidden="true" />
        ) : (
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
        )}
        VAT check
      </h2>
      <p className="mt-2 text-sm leading-relaxed">
        At this rate your turnover would be about <strong>{gbp(vat.turnover)}</strong> a year.{" "}
        {vat.status === "under" &&
          `That is ${gbp(vat.gap)} under the ${gbp(vat.threshold)} VAT registration threshold.`}
        {vat.status === "close" &&
          `That is within ${gbp(VAT_NEAR_MARGIN)} of the ${gbp(vat.threshold)} VAT threshold. Keep an eye on your turnover for the last 12 months: once it goes over, you must register within 30 days of the end of that month.`}
        {vat.status === "over" &&
          `That is over the ${gbp(vat.threshold)} VAT threshold, so you would need to register for VAT and add VAT on top of this rate for most customers. Plan for that before you get there.`}
      </p>
      <a
        href="https://www.gov.uk/register-for-vat"
        rel="noopener"
        className="mt-2 inline-block text-sm font-bold underline"
      >
        When to register for VAT on GOV.UK
      </a>
    </section>
  );
}

function JobCheck({ result }: { result: Result }) {
  const [price, setPrice] = useState(0);
  const [materials, setMaterials] = useState(0);
  const [extras, setExtras] = useState(0);
  const [days, setDays] = useState(0);
  const check = checkJob({ price, materials, extras, days }, result);
  return (
    <section className={cardClass} aria-labelledby="job-check-heading">
      <h2 id="job-check-heading" className="flex items-center gap-2 text-lg font-black text-ink">
        <BadgePoundSterling className="h-5 w-5 text-clay-700" aria-hidden="true" />
        Did that job pay?
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Put in a job you have already priced. See what it really paid you against the rate above.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Money id="job-price" label="Price you charged" value={price} onValue={setPrice} hint="Before VAT" />
        <Count id="job-days" label="Days it took" value={days} onValue={setDays} decimal max={365} />
        <Money id="job-materials" label="Materials cost" value={materials} onValue={setMaterials} />
        <Money id="job-extras" label="Skip, parking, hire" value={extras} onValue={setExtras} />
      </div>
      {check && (
        <div
          className={`mt-4 rounded-xl p-4 ${check.verdict === "paid" ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"}`}
          role="status"
        >
          <p className="text-base font-black">
            {check.verdict === "paid"
              ? `It paid. ${gbp(check.difference)} more than your rate needed.`
              : `It came up ${gbp(-check.difference)} short of your rate.`}
          </p>
          <p className="mt-1 text-sm leading-relaxed">
            Your labour came to {gbp(check.perDay)} a day, or {gbp(check.perHour, true)} an hour. After your
            running costs and the tax on your figures above, that is roughly{" "}
            <strong>{gbp(check.keptPerHour, true)} an hour in your pocket</strong>, against the{" "}
            {gbp(check.targetKeptPerHour, true)} an hour you are aiming for. To hit your rate it needed to be{" "}
            {gbp(check.neededForJob)}.
          </p>
        </div>
      )}
    </section>
  );
}

function JobPricer({ result, onQuote }: { result: Result; onQuote: () => void }) {
  const [days, setDays] = useState(2);
  const [materials, setMaterials] = useState(300);
  const price = priceJob({ days, materials }, result);
  return (
    <section className={cardClass} aria-labelledby="pricer-heading">
      <h2 id="pricer-heading" className="flex items-center gap-2 text-lg font-black text-ink">
        <FileText className="h-5 w-5 text-clay-700" aria-hidden="true" />
        Price a job with it
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Count id="price-days" label="Days on site" value={days} onValue={setDays} decimal max={365} />
        <Money id="price-materials" label="Materials cost" value={materials} onValue={setMaterials} />
      </div>
      <dl className="mt-4 space-y-1 text-sm text-stone-700">
        <div className="flex justify-between">
          <dt>Labour at {gbp(result.dayRate)} a day</dt>
          <dd className="tabular-nums">{gbp(price.labour)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Materials plus {result.markupPercent}% markup</dt>
          <dd className="tabular-nums">{gbp(price.materialsCharged, true)}</dd>
        </div>
        <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-black text-ink">
          <dt>Price before VAT</dt>
          <dd className="tabular-nums">{gbp(price.total, true)}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onQuote}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 font-bold text-ink hover:bg-paper"
      >
        <Sparkles className="h-5 w-5 text-clay-700" aria-hidden="true" />
        Turn it into a proper quote
      </button>
    </section>
  );
}

function PriceRise({ result }: { result: Result }) {
  const [oldRate, setOldRate] = useState(0);
  const [newRate, setNewRate] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [from, setFrom] = useState("");
  const [copied, setCopied] = useState(false);
  const target = newRate ?? result.dayRate;
  const message = priceRiseMessage({ oldRate, newRate: target, startDate, customerName: customer, businessName: from });
  const gap = result.dayRate - oldRate;
  return (
    <section className={cardClass} aria-labelledby="rise-heading">
      <h2 id="rise-heading" className="flex items-center gap-2 text-lg font-black text-ink">
        <MessageSquareText className="h-5 w-5 text-clay-700" aria-hidden="true" />
        Need to put your prices up?
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Fill in what you charge now. You get a short, polite note for your regular customers to copy and send yourself.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Money id="rise-old" label="Day rate now" value={oldRate} onValue={setOldRate} />
        <Money id="rise-new" label="New day rate" value={target} onValue={setNewRate} />
        <div className="min-w-0">
          <label htmlFor="rise-date" className="block text-sm font-bold text-ink">From</label>
          <input id="rise-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} />
        </div>
        <div className="min-w-0">
          <label htmlFor="rise-customer" className="block text-sm font-bold text-ink">Customer name</label>
          <input id="rise-customer" value={customer} maxLength={60} onChange={(e) => setCustomer(e.target.value)} className={fieldClass} placeholder="Optional" />
        </div>
        <div className="col-span-2 min-w-0">
          <label htmlFor="rise-from" className="block text-sm font-bold text-ink">Signed off as</label>
          <input id="rise-from" value={from} maxLength={80} onChange={(e) => setFrom(e.target.value)} className={fieldClass} placeholder="Your name or business" />
        </div>
      </div>
      {oldRate > 0 && gap > 0 && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">
          You charge {gbp(gap)} a day less than your figures need. Over {result.days.billable} paid days that is{" "}
          {gbp(gap * result.days.billable)} a year.
        </p>
      )}
      {oldRate > 0 && (
        <>
          <label htmlFor="rise-message" className="mt-4 block text-sm font-bold text-ink">Your message</label>
          <textarea id="rise-message" readOnly value={message} rows={10} className={`${fieldClass} text-sm leading-relaxed`} />
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(message).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 font-bold text-white"
            >
              {copied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}
              {copied ? "Copied" : "Copy the message"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 font-bold text-ink hover:bg-paper"
            >
              Open in WhatsApp
            </a>
          </div>
          <p className="mt-2 text-xs text-stone-500">Nothing is sent from here. You choose who gets it.</p>
        </>
      )}
    </section>
  );
}

export default function DayRateClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const signedIn = !loading && Boolean(user);
  const [inputs, setInputs] = useState<Inputs>(() => normaliseInputs(DEFAULT_INPUTS));
  const [loaded, setLoaded] = useState(false);
  const [cardName, setCardName] = useState("");
  const [saved, setSaved] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (mounted && !loaded) {
    setLoaded(true);
    if (window.location.search) setInputs(inputsFromQuery(window.location.search));
  }

  const result = useMemo(() => calculateDayRate(inputs), [inputs]);

  useEffect(() => {
    if (!loaded) return;
    const query = inputsToQuery(inputs);
    const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState(window.history.state, "", next);
  }, [inputs, loaded]);

  const set = (key: keyof Inputs) => (value: number | string | boolean) =>
    setInputs((prev) => normaliseInputs({ ...prev, [key]: value }));

  const tradeLabel = TRADE_PRESETS.find((t) => t.id === inputs.trade)?.label || "";
  const cardQuery = rateCardQuery(result, {
    name: cardName,
    trade: inputs.trade === "general" || inputs.trade === "other" ? "" : tradeLabel,
  });
  const cardImageUrl = `/day-rate-calculator/card?${cardQuery}`;

  const applyRate = () => {
    savePricingMemory({ ...getPricingMemory(), ...pricingMemoryPatch(result) });
    setSaved(true);
    captureEvent("day_rate_used", { signed_in: signedIn });
    router.push(signedIn ? "/quotes" : "/try");
  };

  const shareCard = async () => {
    captureEvent("day_rate_card_made");
    setSharing(true);
    try {
      const response = await fetch(cardImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "rate-card.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My rates" });
      } else {
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = "rate-card.png";
        a.click();
        URL.revokeObjectURL(href);
      }
    } catch {
      // Cancelled share sheets land here too. Nothing to tell the user.
    } finally {
      setSharing(false);
    }
  };

  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
      <div className="min-w-0 space-y-5">
        <Step n={1} title="What you want to keep">
          <div className="min-w-0">
            <label htmlFor="trade" className="block text-sm font-bold text-ink">Your trade</label>
            <select
              id="trade"
              value={inputs.trade}
              onChange={(e) => {
                const preset = TRADE_PRESETS.find((t) => t.id === e.target.value);
                setInputs((prev) => {
                  const reset: Record<string, unknown> = {};
                  for (const key of PRESET_KEYS) reset[key] = DEFAULT_INPUTS[key];
                  return normaliseInputs({ ...prev, ...reset, ...(preset?.patch || {}), trade: e.target.value });
                });
              }}
              className={fieldClass}
            >
              {TRADE_PRESETS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-stone-500">Loads example starting figures. It does not set a rate.</p>
          </div>
          <div className="min-w-0">
            <label htmlFor="nation" className="block text-sm font-bold text-ink">Where you live</label>
            <select
              id="nation"
              value={inputs.nation}
              onChange={(e) => {
                const nation = e.target.value as keyof typeof BANK_HOLIDAYS;
                setInputs((prev) => normaliseInputs({ ...prev, nation, bankHolidays: BANK_HOLIDAYS[nation] }));
              }}
              className={fieldClass}
            >
              {NATIONS.map((n) => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-stone-500">Scotland has its own Income Tax bands.</p>
          </div>
          <Money id="take-home" label="Take-home you want a year" value={inputs.takeHome} onValue={set("takeHome")} hint="In your pocket, after tax and NI" max={500000} />
          <Money id="pension" label="Pension you want to put away" value={inputs.pension} onValue={set("pension")} hint="A year. Leave at £0 if none" />
          <div className="min-w-0">
            <label htmlFor="student-loan" className="block text-sm font-bold text-ink">Student loan</label>
            <select id="student-loan" value={inputs.studentLoan} onChange={(e) => set("studentLoan")(e.target.value)} className={fieldClass}>
              {Object.entries(STUDENT_LOAN_PLANS).map(([id, plan]) => (
                <option key={id} value={id}>{plan ? plan.label : "None"}</option>
              ))}
            </select>
          </div>
          <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold text-ink">
            <input
              type="checkbox"
              checked={inputs.postgradLoan}
              onChange={(e) => set("postgradLoan")(e.target.checked)}
              className="h-5 w-5 accent-clay-700"
            />
            I have a Postgraduate Loan
          </label>
        </Step>

        <Step n={2} title="What the business costs a year">
          {COST_FIELDS.map((f) => (
            <Money key={f.key} id={`cost-${f.key}`} label={f.label} value={inputs[f.key]} onValue={set(f.key as keyof Inputs)} />
          ))}
          <p className="text-xs text-stone-500 sm:col-span-2">
            The starting numbers are examples, not averages. Swap in your own. Materials you buy for a job go on
            the quote, not here.
          </p>
        </Step>

        <Step n={3} title="Days you cannot charge for">
          <Count id="days-week" label="Days you work a week" value={inputs.daysPerWeek} onValue={set("daysPerWeek")} min={1} max={7} />
          <Count id="hours-day" label="Hours in a working day" value={inputs.hoursPerDay} onValue={set("hoursPerDay")} suffix="hours" min={1} max={16} decimal />
          <Count id="holiday" label="Holiday" value={inputs.holidayDays} onValue={set("holidayDays")} max={200} />
          <Count id="bank" label="Bank holidays" value={inputs.bankHolidays} onValue={set("bankHolidays")} max={20} hint="Set from where you live (2027)" />
          <Count id="sick" label="Sick days" value={inputs.sickDays} onValue={set("sickDays")} max={200} />
          <Count id="admin" label="Quoting, admin, merchant runs" value={inputs.adminDays} onValue={set("adminDays")} max={200} />
          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="weather" className="flex justify-between text-sm font-bold text-ink">
              <span>Weather and gaps between jobs</span>
              <span className="tabular-nums">{inputs.weatherDays} days</span>
            </label>
            <input
              id="weather"
              type="range"
              min={0}
              max={60}
              value={Math.min(60, inputs.weatherDays)}
              onChange={(e) => set("weatherDays")(Number(e.target.value))}
              className="mt-3 w-full accent-clay-700"
            />
          </div>
        </Step>

        <Step n={4} title="Extras on top">
          <Count id="buffer" label="Buffer for quiet months" value={inputs.bufferPercent} onValue={set("bufferPercent")} suffix="%" max={100} hint="Profit on top of break-even" />
          <Count id="markup" label="Materials markup" value={inputs.markupPercent} onValue={set("markupPercent")} suffix="%" max={200} />
          <Count id="call-out" label="Minimum call-out" value={inputs.callOutHours} onValue={set("callOutHours")} suffix="hours" max={8} decimal hint="0 for no call-out charge" />
          <Count id="weekend" label="Weekend extra" value={inputs.weekendUplift} onValue={set("weekendUplift")} suffix="%" max={300} />
          <Count id="emergency" label="Emergency extra" value={inputs.emergencyUplift} onValue={set("emergencyUplift")} suffix="%" max={500} />
        </Step>

        <YearPicture result={result} />
        <VatNotice result={result} />
        <JobCheck result={result} />
        <JobPricer result={result} onQuote={applyRate} />
        <PriceRise result={result} />
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
        <section className="overflow-hidden rounded-2xl bg-ink text-white shadow-lg" aria-labelledby="result-heading" aria-live="polite">
          <div className="h-2 bg-clay-600" />
          <div className="p-5 sm:p-6">
            <h2 id="result-heading" className="text-xs font-bold uppercase tracking-widest text-clay-200">
              Your day rate
            </h2>
            <p className="mt-1 text-5xl font-black tabular-nums tracking-tight sm:text-6xl">{gbp(result.dayRate)}</p>
            <p className="mt-1 text-sm text-white/70">before VAT · break-even is {gbp(result.floorDayRate)}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Half day", gbp(result.halfDayRate)],
                ["Hourly", gbp(result.hourlyRate)],
                ["Call-out", result.callOut > 0 ? gbp(result.callOut) : "None"],
                ["Weekend day", gbp(result.weekendDayRate)],
                ["Emergency hour", gbp(result.emergencyHourlyRate)],
                ["Materials", `+${result.markupPercent}%`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/10 px-3 py-2">
                  <dt className="text-xs text-white/70">{k}</dt>
                  <dd className="text-lg font-black tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-white/80">
              {gbp(result.wanted)} you keep + {gbp(result.taxTotal)} tax, NI{result.studentLoan > 0 ? " and loan" : ""} +{" "}
              {gbp(result.costs)} costs = {gbp(result.turnoverFloor)} ÷ {result.days.billable} paid days, plus a{" "}
              {result.inputs.bufferPercent}% buffer.
            </div>
            <button
              type="button"
              onClick={applyRate}
              className="mt-5 hidden min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-clay-600 px-4 text-base font-extrabold text-white hover:bg-clay-700 lg:inline-flex"
            >
              {saved ? <Check className="h-5 w-5" aria-hidden="true" /> : <Sparkles className="h-5 w-5" aria-hidden="true" />}
              Use this rate in a quote
            </button>
            <p className="mt-2 hidden text-xs text-white/60 lg:block">
              Saves these rates in this browser for your quotes. Nothing is sent.
            </p>
          </div>
        </section>

        <section className={cardClass} aria-labelledby="card-heading">
          <h2 id="card-heading" className="text-base font-black text-ink">Your rate card</h2>
          <p className="mt-1 text-sm text-stone-600">A picture of your rates for WhatsApp, Facebook or the van.</p>
          <label htmlFor="card-name" className="mt-3 block text-sm font-bold text-ink">Name on the card</label>
          <input
            id="card-name"
            value={cardName}
            maxLength={50}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Optional, e.g. your business"
            className={fieldClass}
          />
          {loaded && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cardImageUrl} alt="Preview of your rate card" width={1200} height={630} className="mt-3 w-full rounded-xl border border-stone-200" loading="lazy" />
          )}
          <div className="mt-3 grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled={sharing}
              onClick={() => void shareCard()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 font-bold text-white disabled:opacity-60"
            >
              <Share2 className="h-5 w-5" aria-hidden="true" />
              Share or save the picture
            </button>
            <a
              href={`/day-rate-calculator/rate-card?${cardQuery}`}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 font-bold text-ink hover:bg-paper"
            >
              <Printer className="h-5 w-5" aria-hidden="true" />
              Print or save as PDF
            </a>
            <a
              href={cardImageUrl}
              download="rate-card.png"
              className="inline-flex min-h-10 items-center justify-center gap-2 text-sm font-bold text-clay-700"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download the image
            </a>
          </div>
        </section>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 font-bold text-ink hover:bg-paper"
        >
          {linkCopied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Link2 className="h-5 w-5" aria-hidden="true" />}
          {linkCopied ? "Link copied" : "Copy a link to these figures"}
        </button>
        <p className="text-xs leading-relaxed text-stone-500">
          Guidance, not tax advice. Uses {result.taxYear} rates and treats your trade as your only income.
        </p>
      </aside>

      <div
        className={`fixed inset-x-0 z-40 border-t border-white/10 bg-ink px-4 py-3 shadow-lg lg:hidden ${
          signedIn ? "bottom-20" : "bottom-0"
        }`}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 shrink-0 text-white">
            <p className="text-[11px] font-bold uppercase tracking-wider text-clay-200">Day rate</p>
            <p className="text-2xl font-black tabular-nums leading-none">{gbp(result.dayRate)}</p>
          </div>
          <button
            type="button"
            onClick={applyRate}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-clay-600 px-3 text-base font-extrabold text-white"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Use this rate
          </button>
        </div>
      </div>
    </div>
  );
}
