/**
 * URL HTTP-прокси только для запросов к air (`AIR_HTTP_PROXY_URL`).
 * Пример: `http://user:pass@host:50100`
 */
export function getAirHttpProxyUrl() {
    const raw = process.env.AIR_HTTP_PROXY_URL?.trim();
    return raw || undefined;
}
