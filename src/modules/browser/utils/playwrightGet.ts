import { BROWSER_REQUEST_TIMEOUT_MS } from "./browserRequest.js";
import {
  acquirePlaywrightContext,
  withPlaywrightSlot,
} from "./playwrightBrowser.js";

export type PlaywrightGetOptions = {
  proxyUrl?: string;
  waitUntil?: "domcontentloaded" | "networkidle" | "load" | "commit";
};

function formatPlaywrightFetchError(url: string, err: unknown): string {
  const msg =
    err instanceof Error ? err.message.trim() : String(err).trim();
  const short =
    msg.length > 200 ? `${msg.slice(0, 200)}... [truncated]` : msg || "unknown";
  return `Playwright GET ${url} failed: ${short}`;
}

/**
 * Загружает URL в headless Chromium и возвращает HTML (`page.content()`).
 */
export async function playwrightGet(
  url: string,
  options?: PlaywrightGetOptions
): Promise<string> {
  return withPlaywrightSlot(async () => {
    const { context, ephemeral } = await acquirePlaywrightContext({
      proxyUrl: options?.proxyUrl,
    });
    const page = await context.newPage();
    try {
      await page.goto(url, {
        timeout: BROWSER_REQUEST_TIMEOUT_MS,
        waitUntil: options?.waitUntil ?? "domcontentloaded",
      });
      return await page.content();
    } catch (err) {
      throw new Error(formatPlaywrightFetchError(url, err), { cause: err });
    } finally {
      await page.close().catch(() => undefined);
      if (ephemeral) {
        await context.close().catch(() => undefined);
      }
    }
  });
}
