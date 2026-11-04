export const TIER_CHANGES_PROMPT: string;

export const tierChangesSchema: {
  type: "object";
  description: string;
  properties: {
    standard: { type: "array"; items: { type: "string" }; description: string };
    better: { type: "array"; items: { type: "string" }; description: string };
    premium: { type: "array"; items: { type: "string" }; description: string };
  };
  required: ["standard", "better", "premium"];
};

export type TierChangeSet = {
  standard: string[];
  better: string[];
  premium: string[];
};

export function sanitizeTierChanges(raw: unknown): TierChangeSet | null;

/** A Better or Premium point that describes the basic job, not a difference. */
export function ordinaryChangePoint(text: string): boolean;

export function visibleTierChanges(
  option: { label?: string; changes?: unknown } | null | undefined
): string[];

export function tierChangeHeading(label: string): string;

export function tierChangesFromOptions(options: unknown): TierChangeSet | null;

export function tierUpgradeSummary(lines: string[]): string;

export function fallbackTierChanges(context?: {
  notes?: unknown;
  trade?: unknown;
  title?: unknown;
  items?: unknown;
}): TierChangeSet;

export function resolveTierChanges(context?: {
  notes?: unknown;
  trade?: unknown;
  title?: unknown;
  items?: unknown;
  tierChanges?: unknown;
} | null): TierChangeSet | null;

export function selectTierPack(context?: {
  notes?: unknown;
  trade?: unknown;
  title?: unknown;
  items?: unknown;
}): string;

export function choiceHelp(options: Array<{ changes?: unknown }> | null | undefined): string;
