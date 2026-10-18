export interface PricingMemoryInput {
  laborHourlyRate?: number;
  laborDayRate?: number;
  preferredMarkupPercent?: number;
}

export interface TradeEstimatorItem {
  type: "labor" | "material" | "service";
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}

export interface TradeEstimatorResult {
  title: string;
  scopeOfWork: string;
  suggestedDepositPercent: number;
  items: TradeEstimatorItem[];
}

export function estimateTradeJob(
  notes?: string,
  trade?: string,
  pricingMemory?: PricingMemoryInput | null,
  photos?: string[]
): TradeEstimatorResult;
