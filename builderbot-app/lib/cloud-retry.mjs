/**
 * Retry for saving one record online.
 * The record is already saved on this device. This only decides how many
 * times to try the online copy, and reports a failure once at the end.
 */

/** Wait before the 2nd and 3rd attempt. */
export const CLOUD_RETRY_DELAYS_MS = [2000, 8000];

/** Window event the "not saved online" notice listens for. */
export const CLOUD_SAVE_FAILED_EVENT = "builderbot_cloud_save_failed";

/**
 * @typedef {{ status: "saved" } | { status: "skipped" } | { status: "failed", code: string }} CloudSyncResult
 */

/**
 * @param {() => Promise<CloudSyncResult>} attempt
 * @param {{
 *   delaysMs?: number[],
 *   wait?: (ms: number) => Promise<void>,
 *   onFailed?: (info: { code: string, attempts: number }) => void,
 * }} [options]
 * @returns {Promise<CloudSyncResult & { attempts: number }>}
 */
export async function saveOnlineWithRetry(attempt, options = {}) {
  const delays = options.delaysMs ?? CLOUD_RETRY_DELAYS_MS;
  const wait = options.wait ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  /** @type {CloudSyncResult} */
  let last = { status: "failed", code: "not_tried" };
  let attempts = 0;

  for (let i = 0; i <= delays.length; i += 1) {
    if (i > 0) await wait(delays[i - 1]);
    attempts += 1;
    try {
      last = await attempt();
    } catch (error) {
      const row = /** @type {{ code?: unknown, name?: unknown }} */ (
        error && typeof error === "object" ? error : {}
      );
      last = { status: "failed", code: String(row.code || row.name || "unknown").slice(0, 60) };
    }
    if (last.status !== "failed") return { ...last, attempts };
  }

  const code = last.status === "failed" ? last.code : "unknown";
  if (options.onFailed) {
    try {
      options.onFailed({ code, attempts });
    } catch {
      // Reporting must never break saving.
    }
  }
  return { status: "failed", code, attempts };
}
