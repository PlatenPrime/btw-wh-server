import type { AxiosProxyConfig } from "axios";

/**
 * Парсит HTTP(S) proxy URL вида `http://user:pass@host:port` в конфиг axios.
 * SOCKS и прочие схемы не поддерживаются — вернёт null.
 */
export function parseHttpProxyUrl(raw: string): AxiosProxyConfig | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  if (!url.hostname) {
    return null;
  }

  const port = url.port
    ? Number(url.port)
    : url.protocol === "https:"
      ? 443
      : 80;

  if (!Number.isFinite(port) || port <= 0) {
    return null;
  }

  const config: AxiosProxyConfig = {
    protocol: url.protocol.replace(/:$/, ""),
    host: url.hostname,
    port,
  };

  if (url.username || url.password) {
    config.auth = {
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  }

  return config;
}
