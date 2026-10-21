export const QUOTE_VIEW_WINDOW_SECONDS: number;
export const VISITOR_COOKIE: string;
export const VISITOR_COOKIE_MAX_AGE: number;

export function isVisitorId(value: unknown): value is string;
export function newVisitorId(): string;
export function hashVisitorId(visitorId: unknown): string;
export function shouldCountQuoteView(
  lastCountedAt: string | number | Date | null | undefined,
  nowMs: number,
  windowSeconds?: number
): boolean;
