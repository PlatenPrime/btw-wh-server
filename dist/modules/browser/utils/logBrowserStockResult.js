import { createLogger } from "../../../logging/createLogger.js";
const browserLog = createLogger({ module: "browser" });
/** Максимум info-логов stock-result в скользящем окне 60 с. */
export const BROWSER_STOCK_RESULT_LOGS_PER_MINUTE = 20;
const WINDOW_MS = 60_000;
let timestamps = [];
let droppedSinceLastWarn = 0;
let lastDropWarnAt = 0;
/** Сброс состояния rate-limiter в тестах. */
export function resetBrowserStockResultLogForTests(now = 0) {
    timestamps = [];
    droppedSinceLastWarn = 0;
    lastDropWarnAt = now;
}
function prune(now) {
    const cutoff = now - WINDOW_MS;
    // `<=`: лог в T истекает ровно в T+WINDOW_MS (окно строго < 60s).
    while (timestamps.length > 0 && timestamps[0] <= cutoff) {
        timestamps.shift();
    }
}
function truncateLink(link) {
    const trimmed = link.trim();
    if (trimmed.length <= 160) {
        return trimmed;
    }
    return `${trimmed.slice(0, 160)}...`;
}
/**
 * Info-лог результата scrape stock/price с лимитом ≤20/мин на process.
 * При превышении — drop; не чаще раза в минуту — warn о числе dropped.
 */
export function logBrowserStockResult(input, now = Date.now()) {
    prune(now);
    if (timestamps.length >= BROWSER_STOCK_RESULT_LOGS_PER_MINUTE) {
        droppedSinceLastWarn += 1;
        if (now - lastDropWarnAt >= WINDOW_MS) {
            browserLog.warn({
                dropped: droppedSinceLastWarn,
                limit: BROWSER_STOCK_RESULT_LOGS_PER_MINUTE,
            }, "dropped stock result logs");
            droppedSinceLastWarn = 0;
            lastDropWarnAt = now;
        }
        return false;
    }
    timestamps.push(now);
    const ok = input.stock !== -1 || input.price !== -1;
    browserLog.info({
        konkName: input.konkName.trim().toLowerCase(),
        link: truncateLink(input.link),
        stock: input.stock,
        price: input.price,
        ok,
    }, "browser stock result");
    return true;
}
