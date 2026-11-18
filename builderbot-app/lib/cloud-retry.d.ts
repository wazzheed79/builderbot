export const CLOUD_RETRY_DELAYS_MS: number[];
export const CLOUD_SAVE_FAILED_EVENT: string;
export type CloudSyncResult =
  | { status: "saved" }
  | { status: "skipped" }
  | { status: "failed"; code: string };
export function saveOnlineWithRetry(
  attempt: () => Promise<CloudSyncResult>,
  options?: {
    delaysMs?: number[];
    wait?: (ms: number) => Promise<void>;
    onFailed?: (info: { code: string; attempts: number }) => void;
  }
): Promise<CloudSyncResult & { attempts: number }>;
