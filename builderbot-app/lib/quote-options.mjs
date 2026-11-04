import { recalculateQuoteTotals, roundMoney } from "./quote-rules.mjs";
import { resolveTierChanges, tierUpgradeSummary } from "./tier-differences.mjs";

/**
 * Up to three optional prices from one set of lines.
 * Standard keeps the lines as they are. Better and Premium add one extra line.
 * The extra is still 15% and 30% of the net (with the same £25 and £45 floors).
 * When the job is known, that line names the difference and `changes` lists it
 * in short points. With no job to go on, the older general line is kept.
 * A quote with no options, or only one, stays a single price.
 * @param {Array<{ type?: string, description: string, quantity: number, unit: string, rate: number, id?: string, usualPrice?: boolean, rateSource?: string }>} items
 * @param {boolean} vatEnabled
 * @param {number} depositPercent
 * @param {{ notes?: string, trade?: string, title?: string, items?: unknown[], tierChanges?: unknown } | null} [context]
 */
export function buildChoiceOptions(items = [], vatEnabled = true, depositPercent = 20, context = null) {
  const base = items.map((item, index) => ({
    id: item.id || `line-${index + 1}`,
    type: item.type || "material",
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    rate: item.rate,
    ...(item.usualPrice ? { usualPrice: true } : {}),
    ...(item.rateSource === "list" || item.rateSource === "settings" ? { rateSource: item.rateSource } : {}),
  }));
  const subtotal = base.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const betterExtra = roundMoney(Math.max(25, subtotal * 0.15));
  const premiumExtra = roundMoney(Math.max(45, subtotal * 0.3));
  const changes = resolveTierChanges(
    context
      ? {
          ...context,
          items: context.items && context.items.length ? context.items : base,
        }
      : null
  );

  const packs = [
    { id: "opt-standard", label: "Standard", items: base, changes: changes?.standard },
    {
      id: "opt-better",
      label: "Better",
      changes: changes?.better,
      items: [
        ...base,
        {
          id: "opt-better-extra",
          type: "service",
          description: changes
            ? tierUpgradeSummary(changes.better)
            : "Upgraded materials and a neater finish",
          quantity: 1,
          unit: "job",
          rate: betterExtra,
        },
      ],
    },
    {
      id: "opt-premium",
      label: "Premium",
      changes: changes?.premium,
      items: [
        ...base,
        {
          id: "opt-premium-extra",
          type: "service",
          description: changes
            ? tierUpgradeSummary(changes.premium)
            : "Premium materials, more time on site, and a longer guarantee",
          quantity: 1,
          unit: "job",
          rate: premiumExtra,
        },
      ],
    },
  ];

  return packs.map((pack) => ({
    id: pack.id,
    label: pack.label,
    items: pack.items,
    ...(pack.changes && pack.changes.length > 0 ? { changes: pack.changes } : {}),
    ...recalculateQuoteTotals(pack.items, vatEnabled, depositPercent),
  }));
}

/**
 * Copy the chosen option onto the quote. Single-price quotes are unchanged.
 * @param {{ options?: Array<{ id: string, items: unknown[], subtotal: number, vat: number, total: number, deposit: number }> }} quote
 * @param {string} optionId
 */
export function chosenOptionFigures(quote, optionId) {
  const options = Array.isArray(quote?.options) ? quote.options : [];
  if (options.length < 2) return null;
  return options.find((option) => option.id === optionId) || null;
}
