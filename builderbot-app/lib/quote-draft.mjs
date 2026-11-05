import { buildChoiceOptions } from "./quote-options.mjs";
import { recalculateQuoteTotals } from "./quote-rules.mjs";
import { tierChangesFromOptions } from "./tier-differences.mjs";

/**
 * The quote that gets saved. The lines on screen are the quote.
 * Good, Better, and Best are rebuilt from those lines, so a late rough
 * estimate cannot be what the customer receives.
 */
export function quoteDraftForSave(draft) {
  const items = Array.isArray(draft?.items) ? draft.items : [];
  const vatEnabled = Boolean(draft?.vatEnabled);
  const depositPercent = Number(draft?.depositPercent) || 0;
  const totals = recalculateQuoteTotals(items, vatEnabled, depositPercent);
  const choices = Array.isArray(draft?.choiceOptions) ? draft.choiceOptions : [];
  const index = Number(draft?.choiceIndex) || 0;
  let options;
  if (choices.length > 1) {
    options = index === 0
      ? buildChoiceOptions(items, vatEnabled, depositPercent, {
          notes: draft.notesInput || draft.notes || "",
          trade: draft.trade || "",
          title: draft.quoteTitle || draft.title || "",
          items,
          tierChanges: tierChangesFromOptions(choices) || draft.tierChanges || null,
        })
      : choices.map((option, optionIndex) => {
          const optionItems = optionIndex === index ? items : option.items || [];
          return {
            ...option,
            items: optionItems,
            ...recalculateQuoteTotals(optionItems, vatEnabled, depositPercent),
          };
        });
  }
  return { items, ...totals, options };
}
