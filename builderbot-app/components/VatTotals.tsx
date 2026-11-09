import { formatGbp } from "@/lib/quote-print.mjs";
import { splitCostTotals } from "@/lib/cost-split.mjs";
import { vatPresentation } from "@/lib/vat.mjs";

/**
 * Materials, labour, then subtotal, VAT, and total.
 * The same words on the quote, the customer page, the printout, and the invoice.
 * A £0 materials, labour, or services row is left off. VAT wording is unchanged.
 */
export default function VatTotals({
  items,
  subtotal,
  vat,
  total,
  vatEnabled,
  vatNumber,
  businessRegistered,
  totalClassName = "text-2xl tabular-nums text-clay-800",
}: {
  items?: Array<{ type?: string; quantity?: number; rate?: number }>;
  subtotal: number;
  vat: number;
  total: number;
  vatEnabled?: boolean;
  vatNumber?: string;
  businessRegistered?: boolean;
  totalClassName?: string;
}) {
  const view = vatPresentation({ vatEnabled, vatNumber, businessRegistered });
  const costRows = items ? splitCostTotals(items, subtotal).rows : [];

  return (
    <div className="space-y-2 text-sm">
      {costRows.length > 0 ? (
        <div className="space-y-2 border-b border-stone-200 pb-2">
          {costRows.map((row) => (
            <div key={row.key} className="flex justify-between gap-3 text-stone-700">
              <span>{row.label}</span>
              <span className="font-medium tabular-nums text-ink">{formatGbp(row.amount)}</span>
            </div>
          ))}
        </div>
      ) : null}
      {view.charges && (
        <div className="flex justify-between gap-3 text-stone-700">
          <span>{view.subtotalLabel}</span>
          <span className="font-medium tabular-nums text-ink">{formatGbp(subtotal)}</span>
        </div>
      )}
      {view.charges ? (
        <div className="flex justify-between gap-3 text-stone-700">
          <span>{view.vatLabel}</span>
          <span className="font-medium tabular-nums text-ink">{formatGbp(vat)}</span>
        </div>
      ) : (
        <p className="text-sm font-semibold text-stone-800">{view.notice}</p>
      )}
      {view.pricesNote ? <p className="text-xs text-stone-600">{view.pricesNote}</p> : null}
      {view.regLine ? <p className="text-xs font-semibold text-stone-700">{view.regLine}</p> : null}
      <div className="flex items-baseline justify-between gap-3 border-t-2 border-ink pt-2 font-black">
        <span className="text-base text-ink">{view.totalLabel}</span>
        <span className={totalClassName}>{formatGbp(total)}</span>
      </div>
    </div>
  );
}
