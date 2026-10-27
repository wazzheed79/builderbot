import { recalculateQuoteTotals, roundMoney } from "./quote-rules.mjs";

/**
 * Up to three optional prices from one set of lines.
 * Standard keeps the lines as they are. Better and Premium add one extra line
 * so the customer can see what the extra money is for.
 * A quote with no options, or only one, stays a single price.
 * @param {Array<{ type?: string, description: string, quantity: number, unit: string, rate: number, id?: string }>} items
 * @param {boolean} vatEnabled
 * @param {number} depositPercent
 */
export function buildChoiceOptions(items = [], vatEnabled = true, depositPercent = 20) {
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

  const packs = [
    { id: "opt-standard", label: "Standard", items: base },
    {
      id: "opt-better",
      label: "Better",
      items: [
        ...base,
        {
          id: "opt-better-extra",
          type: "service",
          description: "Upgraded materials and a neater finish",
          quantity: 1,
          unit: "job",
          rate: betterExtra,
        },
      ],
    },
    {
      id: "opt-premium",
      label: "Premium",
      items: [
        ...base,
        {
          id: "opt-premium-extra",
          type: "service",
          description: "Premium materials, more time on site, and a longer guarantee",
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
