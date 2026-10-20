export const BUSINESS_NAME_PROMPT: string;
export const GENERIC_TRADESPERSON: string;

export function cleanBusinessText(value: unknown): string;
export function hasBusinessName(companyName: unknown): boolean;
export function displayBusinessName(companyName: unknown, ownerName?: unknown): string;
