import { formatGbp } from "@/lib/quote-print.mjs";
import { vatPresentation } from "@/lib/vat.mjs";

/**
 * Subtotal, VAT, and total. The same words on the quote, the customer page, and the invoice.
 */
export default function VatTotals({
  subtotal,
  vat,
  total,
  vatEnabled,
  vatNumber,
  businessRegistered,
  totalClassName = "text-2xl tabular-nums text-clay-800",
}: {
  subtotal: number;
  vat: number;
  total: number;
  vatEnabled?: boolean;
  vatNumber?: string;
  businessRegistered?: boolean;
  totalClassName?: string;
}) {
  const view = vatPresentation({ vatEnabled, vatNumber, businessRegistered });

  return (
    <div className="space-y-2 text-sm">
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
