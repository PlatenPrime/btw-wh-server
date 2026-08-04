/**
 * Geo-block sharik.ua снят — прокси выключен.
 * Верни `true`, если снова понадобится `SHARIK_HTTP_PROXY_URL`.
 */
export const SHARIK_HTTP_PROXY_ENABLED = false;

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
