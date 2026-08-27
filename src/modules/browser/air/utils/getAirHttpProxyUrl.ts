/**
 * Вкл.: air идёт через `AIR_HTTP_PROXY_URL`, если задан.
 * Верни `false`, когда нужен чистый egress без HTTP-прокси.
 */
export const AIR_HTTP_PROXY_ENABLED = false;

/**
 * URL HTTP-прокси только для запросов к air (`AIR_HTTP_PROXY_URL`).
 * Пример: `http://user:pass@host:50100`
 * Пока `AIR_HTTP_PROXY_ENABLED === false` всегда `undefined`.
 */
export function getAirHttpProxyUrl(): string | undefined {
  if (!AIR_HTTP_PROXY_ENABLED) {
    return undefined;
  }
  const raw = process.env.AIR_HTTP_PROXY_URL?.trim();
  return raw || undefined;
}
