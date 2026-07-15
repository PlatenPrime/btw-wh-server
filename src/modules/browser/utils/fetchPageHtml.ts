import { browserGet } from "./browserRequest.js";
import { playwrightGet } from "./playwrightGet.js";
import {
  resolveBrowserTransport,
  type BrowserTransport,
} from "./resolveBrowserTransport.js";

export type FetchPageHtmlOptions = {
  /** Имя конкурента для lookup в `BROWSER_TRANSPORT_BY_KONK`. */
  konkName?: string;
  /** Явный транспорт сильнее env. */
  transport?: BrowserTransport;
  proxyUrl?: string;
  waitUntil?: "domcontentloaded" | "networkidle" | "load" | "commit";
};

/**
 * Единая точка получения HTML страницы: http (axios) или playwright.
 * Приоритет: options.transport → env по konkName → http.
 */
export async function fetchPageHtml(
  url: string,
  options?: FetchPageHtmlOptions
): Promise<string> {
  const transport =
    options?.transport ?? resolveBrowserTransport(options?.konkName);

  if (transport === "playwright") {
    return playwrightGet(url, {
      proxyUrl: options?.proxyUrl,
      waitUntil: options?.waitUntil,
    });
  }

  return browserGet<string>(url, { proxyUrl: options?.proxyUrl });
}
