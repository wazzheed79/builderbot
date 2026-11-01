export function appendSpokenText(existing: string, spoken: string, maxLength?: number): string;

export function applyRecognitionResults(
  appliedFinals: string,
  results: Array<{ isFinal?: boolean; transcript?: string }>
): { delta: string; interim: string; appliedFinals: string };
