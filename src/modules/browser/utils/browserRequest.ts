import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosProxyConfig,
  isAxiosError,
} from "axios";

import { createLogger } from "../../../logging/createLogger.js";
import { parseHttpProxyUrl } from "./parse-http-proxy-url/parseHttpProxyUrl.js";

const browserLog = createLogger({ module: "browser" });

/** Лимит ожидания одного HTTP GET (один URL / одна «страница»). На весь обход N страниц — до N × этого значения в худшем случае. */
const BROWSER_REQUEST_TIMEOUT_MS = 30_000;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "uk-UA,uk;q=0.9,ru;q=0.8,en-US;q=0.7,en;q=0.6",
  "Accept-Encoding": "gzip, deflate, br",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  Connection: "keep-alive",
  "Cache-Control": "max-age=0",
};

let browserAxiosInstance: AxiosInstance | null = null;
const MAX_BROWSER_ERROR_MESSAGE_LENGTH = 240;

export type BrowserGetOptions = {
  /** HTTP(S) proxy URL (`http://user:pass@host:port`). Без него — прямой egress, env HTTP_PROXY игнорируется. */
  proxyUrl?: string;
};

function truncateMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= MAX_BROWSER_ERROR_MESSAGE_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_BROWSER_ERROR_MESSAGE_LENGTH)}... [truncated]`;
}

function formatUnknownError(err: unknown): string {
  if (err instanceof Error) {
    return truncateMessage(err.message);
  }
  return truncateMessage(String(err));
}

/**
 * Возвращает axios instance с навигационными заголовками Chrome (имитация прямого перехода по URL).
 * Переиспользуется всеми утилитами модуля browser при запросах к внешним сайтам.
 */
export function getBrowserAxios(): AxiosInstance {
  if (!browserAxiosInstance) {
    browserAxiosInstance = axios.create({
      headers: BROWSER_HEADERS,
      timeout: BROWSER_REQUEST_TIMEOUT_MS,
      responseType: "text",
      transformResponse: [(data: unknown) => data],
      // Не подхватывать системные HTTP(S)_PROXY — proxy только через browserGet options.
      proxy: false,
    });
  }
  return browserAxiosInstance;
}

/**
 * Краткое описание ошибки внешнего GET без вложенных объектов Axios (удобно для логов и JSON).
 */
export function formatBrowserFetchError(url: string, err: unknown): string {
  if (isAxiosError(err)) {
    const msgLower = err.message.toLowerCase();
    if (
      err.code === "ECONNABORTED" ||
      msgLower.includes("timeout") ||
      msgLower.includes("exceeded")
    ) {
      return `Browser GET timeout (${BROWSER_REQUEST_TIMEOUT_MS}ms): ${url}`;
    }
    if (err.response) {
      const status = err.response.status;
      const statusText = err.response.statusText?.trim();
      const tail = statusText ? ` ${statusText}` : "";
      return `Browser GET HTTP ${status}${tail}: ${url}`;
    }
    const code = err.code ? ` (${err.code})` : "";
    return `Browser GET failed${code}: ${url} — ${truncateMessage(err.message)}`;
  }
  return formatUnknownError(err);
}

/**
 * Выполняет GET-запрос к URL с браузерными заголовками.
 * @param url — полный URL
 * @param options.proxyUrl — опциональный HTTP(S) proxy (например air)
 * @returns data ответа (тип задаётся вызывающим)
 * @throws Error с коротким message; исходная ошибка в `cause`, если поддерживается средой
 */
export async function browserGet<T = unknown>(
  url: string,
  options?: BrowserGetOptions
): Promise<T> {
  const client = getBrowserAxios();
  const proxyUrl = options?.proxyUrl?.trim();

  let proxy: false | AxiosProxyConfig = false;
  if (proxyUrl) {
    const parsed = parseHttpProxyUrl(proxyUrl);
    if (!parsed) {
      throw new Error(`Invalid browser HTTP proxy URL: ${proxyUrl}`);
    }
    proxy = parsed;
  }

  try {
    const response = await client.get<T>(url, {
      timeout: BROWSER_REQUEST_TIMEOUT_MS,
      proxy,
    });
    return response.data as unknown as T;
  } catch (err) {
    throw new Error(formatBrowserFetchError(url, err), { cause: err });
  }
}

export function resolveAxiosError(err: unknown): AxiosError | undefined {
  if (isAxiosError(err)) {
    return err;
  }
  if (err instanceof Error && isAxiosError(err.cause)) {
    return err.cause;
  }
  return undefined;
}

export function getBrowserFetchLogLevel(err: unknown): "warn" | "error" {
  const axiosErr = resolveAxiosError(err);
  const status = axiosErr?.response?.status;
  if (status !== undefined && status >= 400 && status < 500) {
    return "warn";
  }
  return "error";
}

export function summarizeBrowserError(err: unknown): string {
  const axiosErr = resolveAxiosError(err);
  if (axiosErr) {
    const requestUrl = axiosErr.config?.url?.trim();
    if (requestUrl) {
      return formatBrowserFetchError(requestUrl, axiosErr);
    }
  }
  return formatUnknownError(err);
}

export function logBrowserError(context: string, err: unknown): void {
  const axiosErr = resolveAxiosError(err);
  const httpStatus = axiosErr?.response?.status;
  const level = getBrowserFetchLogLevel(err);
  const payload = {
    context,
    details: summarizeBrowserError(err),
    ...(httpStatus !== undefined && { httpStatus }),
  };
  browserLog[level](payload, "browser fetch failed");
}
