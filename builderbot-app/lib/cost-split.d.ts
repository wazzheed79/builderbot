export type CostKind = "material" | "labor" | "other";

export type CostRow = {
  key: CostKind;
  label: string;
  amount: number;
};

export function lineCostKind(type: unknown): CostKind;

export function splitCostTotals(
  items: unknown,
  expectedSubtotal?: unknown
): {
  material: number;
  labor: number;
  other: number;
  subtotal: number;
  rows: CostRow[];
};

export function linesForQuoteTotal(quote: unknown): unknown[];
