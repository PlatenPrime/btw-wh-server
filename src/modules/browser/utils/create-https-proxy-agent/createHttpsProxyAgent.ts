import { HttpsProxyAgent } from "https-proxy-agent";

import { parseHttpProxyUrl } from "../parse-http-proxy-url/parseHttpProxyUrl.js";

/**
 * Собирает HttpsProxyAgent из `http://user:pass@host:port`.
 * SOCKS и прочие схемы — null (как у parseHttpProxyUrl).
 */
export function createHttpsProxyAgent(
  proxyUrl: string
): HttpsProxyAgent<string> | null {
  const trimmed = proxyUrl.trim();
  if (!trimmed) {
    return null;
  }
  if (!parseHttpProxyUrl(trimmed)) {
    return null;
  }
  return new HttpsProxyAgent(trimmed);
}
