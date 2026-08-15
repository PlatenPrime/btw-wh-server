import { createLogger } from "../../../../../logging/createLogger.js";
import { fetchPageHtml } from "../../../utils/fetchPageHtml.js";
import { sleep } from "../../../utils/sleep.js";
import { isGraboTransientFetchError } from "./isGraboTransientFetchError.js";
const log = createLogger({ module: "browser", konk: "grabo" });
/** Паузы после 1-й и 2-й неудачи; 3-я неудача пробрасывается. */
export const GRABO_FETCH_RETRY_WAIT_MS = [8_000, 20_000, 45_000];
export const GRABO_FETCH_MAX_ATTEMPTS = GRABO_FETCH_RETRY_WAIT_MS.length;
/**
 * GET HTML Grabo с повтором того же URL при ETIMEDOUT и родственных сбоях.
 */
export async function fetchGraboPageHtml(url) {
    let lastError;
    for (let attempt = 1; attempt <= GRABO_FETCH_MAX_ATTEMPTS; attempt++) {
        try {
            return await fetchPageHtml(url, { konkName: "grabo" });
        }
        catch (error) {
            lastError = error;
            if (!isGraboTransientFetchError(error)) {
                throw error;
            }
            const details = error instanceof Error ? error.message : String(error);
            const waitMs = GRABO_FETCH_RETRY_WAIT_MS[attempt - 1];
            if (attempt === GRABO_FETCH_MAX_ATTEMPTS || waitMs == null) {
                log.warn({ url, attempt, maxAttempts: GRABO_FETCH_MAX_ATTEMPTS, details }, "grabo fetch retry exhausted");
                throw error;
            }
            log.warn({
                url,
                attempt,
                maxAttempts: GRABO_FETCH_MAX_ATTEMPTS,
                waitMs,
                details,
            }, "grabo fetch retry");
            await sleep(waitMs);
        }
    }
    throw lastError ?? new Error("grabo fetch failed");
}
