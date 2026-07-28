/**
 * Вкл.: sharik идёт через `SHARIK_HTTP_PROXY_URL`, если задан.
 * Верни `false`, когда нужен чистый egress без HTTP-прокси.
 */
export const SHARIK_HTTP_PROXY_ENABLED = true;

/**
 * URL HTTP-прокси только для запросов к sharik (`SHARIK_HTTP_PROXY_URL`).
 * Пример: `http://user:pass@host:50100`
 * Пока `SHARIK_HTTP_PROXY_ENABLED === false` всегда `undefined`.
 */
export function getSharikHttpProxyUrl(): string | undefined {
  if (!SHARIK_HTTP_PROXY_ENABLED) {
    return undefined;
  }
  const raw = process.env.SHARIK_HTTP_PROXY_URL?.trim();
  return raw || undefined;
}
