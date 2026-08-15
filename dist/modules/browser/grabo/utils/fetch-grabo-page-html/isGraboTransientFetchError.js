const TRANSIENT_CODES = new Set([
    "ETIMEDOUT",
    "ECONNRESET",
    "ECONNREFUSED",
    "EPIPE",
    "EAI_AGAIN",
]);
const TRANSIENT_MESSAGE_RE = /etimedout|econnreset|econnrefused|epipe|eai_again|socket hang up|timeout/i;
function readCode(value) {
    if (value &&
        typeof value === "object" &&
        "code" in value &&
        typeof value.code === "string") {
        return value.code;
    }
    return undefined;
}
/**
 * TCP/сеть отвалилась — имеет смысл повторить тот же URL.
 * HTTP 404 и прочие прикладные ошибки сюда не попадают.
 */
export function isGraboTransientFetchError(error) {
    let current = error;
    for (let depth = 0; depth < 4 && current != null; depth++) {
        const code = readCode(current);
        if (code && TRANSIENT_CODES.has(code)) {
            return true;
        }
        const message = current instanceof Error ? current.message : String(current);
        if (TRANSIENT_MESSAGE_RE.test(message)) {
            return true;
        }
        current = current instanceof Error ? current.cause : undefined;
    }
    return false;
}
