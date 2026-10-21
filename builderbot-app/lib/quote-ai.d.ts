export const MAX_LINE_ITEMS: number;
export const MAX_RATE: number;
export const MAX_QUANTITY: number;

export type SanitizedLineItem = {
  type: "labor" | "material" | "service";
  description: string;
  quantity: number;
  unit: string;
  rate: number;
};

export function sanitizeGeneratedQuote(
  parsed: unknown,
  fallback?: { notes?: string; title?: string }
):
  | {
      ok: true;
      title: string;
      scopeOfWork: string;
      suggestedDepositPercent: number;
      items: SanitizedLineItem[];
    }
  | { ok: false; reason: string };

export function sanitizeExpandedScope(
  parsed: unknown,
  fallback?: { notes?: string; title?: string }
):
  | { ok: true; title: string; scopeOfWork: string }
  | { ok: false; reason: string };
