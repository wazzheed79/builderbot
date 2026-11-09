export const CALL_OUT_DESCRIPTION: string;

export function callOutFeeAmount(memory: unknown): number;

export function callOutLine(memory: unknown): {
  type: "labor";
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  rateSource: "settings";
} | null;

export function isSettingsCallOutLine(item: unknown): boolean;
