import axios, { type AxiosInstance, isAxiosError } from "axios";

/** Лимит ожидания одного HTTP GET (один URL / одна «страница»). На весь обход N страниц — до N × этого значения в худшем случае. */
const BROWSER_REQUEST_TIMEOUT_MS = 30_000;

const BROWSER_HEADERS = {
  "X-Requested-With": "XMLHttpRequest",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

let browserAxiosInstance: AxiosInstance | null = null;
const MAX_BROWSER_ERROR_MESSAGE_LENGTH = 240;

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
 * Возвращает axios instance с заголовками «как из браузера» (AJAX).
 * Переиспользуется всеми утилитами модуля browser при запросах к внешним сайтам.
 */
export function getBrowserAxios(): AxiosInstance {
  if (!browserAxiosInstance) {
    browserAxiosInstance = axios.create({
      headers: BROWSER_HEADERS,
      timeout: BROWSER_REQUEST_TIMEOUT_MS,
      responseType: "text",
      transformResponse: [(data: unknown) => data],
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
 * @returns data ответа (тип задаётся вызывающим)
 * @throws Error с коротким message; исходная ошибка в `cause`, если поддерживается средой
 */
export async function browserGet<T = unknown>(url: string): Promise<T> {
  const client = getBrowserAxios();
  try {
    const response = await client.get<T>(url, {
      timeout: BROWSER_REQUEST_TIMEOUT_MS,
    });
    return response.data as T;
  } catch (err) {
    throw new Error(formatBrowserFetchError(url, err), { cause: err });
  }
}

export function summarizeBrowserError(err: unknown): string {
  if (isAxiosError(err)) {
    const requestUrl = err.config?.url?.trim();
    if (requestUrl) {
      return formatBrowserFetchError(requestUrl, err);
    }
  }
  return formatUnknownError(err);
}

export function logBrowserError(context: string, err: unknown): void {
  console.error(`${context} ${summarizeBrowserError(err)}`);
}
