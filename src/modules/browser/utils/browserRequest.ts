import axios, { type AxiosInstance } from "axios";

const BROWSER_HEADERS = {
  "X-Requested-With": "XMLHttpRequest",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

let browserAxiosInstance: AxiosInstance | null = null;

/**
 * Возвращает axios instance с заголовками «как из браузера» (AJAX).
 * Переиспользуется всеми утилитами модуля browser при запросах к внешним сайтам.
 */
export function getBrowserAxios(): AxiosInstance {
  if (!browserAxiosInstance) {
    browserAxiosInstance = axios.create({
      headers: BROWSER_HEADERS,
      timeout: 15000,
    });
  }
  return browserAxiosInstance;
}

/**
 * Выполняет GET-запрос к URL с браузерными заголовками.
 * @param url — полный URL
 * @returns data ответа (тип задаётся вызывающим)
 * @throws Error при сетевой ошибке или не-2xx статусе
 */
export async function browserGet<T = unknown>(url: string): Promise<T> {
  const client = getBrowserAxios();
  const response = await client.get<T>(url);
  return response.data;
}
