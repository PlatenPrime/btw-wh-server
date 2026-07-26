import { createLogger } from "../../../logging/createLogger.js";
import { BROWSER_REQUEST_TIMEOUT_MS } from "./browserRequest.js";
import {
  acquirePlaywrightContext,
  type PlaywrightPageLike,
  type PlaywrightResponseLike,
  withPlaywrightSlot,
} from "./playwrightBrowser.js";

const browserLog = createLogger({ module: "browser" });

export type PlaywrightGetOptions = {
  proxyUrl?: string;
  waitUntil?: "domcontentloaded" | "networkidle" | "load" | "commit";
  /**
   * Сначала открыть этот URL в той же вкладке (cookies/session), потом целевой.
   * Ошибка warm-up (4xx) — warn и продолжаем к целевому URL.
   */
  warmUpUrl?: string;
};

/** Сколько символов body кладём в лог/ошибку при HTTP ≥ 400. */
export const PLAYWRIGHT_ERROR_BODY_SNIPPET_MAX = 300;

/**
 * Ужимает HTML/text для diag-лога (title + snippet).
 */
export function summarizePlaywrightErrorBody(html: string): {
  title: string;
  snippet: string;
  htmlLength: number;
} {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = (titleMatch?.[1] ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  const snippet = html
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PLAYWRIGHT_ERROR_BODY_SNIPPET_MAX);
  return { title, snippet, htmlLength: html.length };
}

function formatPlaywrightFetchError(url: string, err: unknown): string {
  const msg =
    err instanceof Error ? err.message.trim() : String(err).trim();
  const short =
    msg.length > 200 ? `${msg.slice(0, 200)}... [truncated]` : msg || "unknown";
  return `Playwright GET ${url} failed: ${short}`;
}

function readGotoStatus(response: unknown): number | undefined {
  if (
    response &&
    typeof response === "object" &&
    "status" in response &&
    typeof (response as PlaywrightResponseLike).status === "function"
  ) {
    const status = (response as PlaywrightResponseLike).status();
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

async function throwIfHttpError(
  page: PlaywrightPageLike,
  url: string,
  status: number | undefined
): Promise<void> {
  if (status === undefined || status < 400) {
    return;
  }
  let bodySummary = {
    title: "",
    snippet: "",
    htmlLength: 0,
  };
  try {
    const html = await page.content();
    bodySummary = summarizePlaywrightErrorBody(html);
  } catch {
    // body недоступен
  }
  browserLog.warn(
    {
      context: "Playwright GET non-2xx",
      url,
      httpStatus: status,
      ...bodySummary,
    },
    "playwright http error body"
  );
  const titlePart = bodySummary.title
    ? ` title=${JSON.stringify(bodySummary.title)}`
    : "";
  const snippetPart = bodySummary.snippet
    ? ` body=${JSON.stringify(bodySummary.snippet)}`
    : "";
  throw new Error(
    `Playwright GET HTTP ${status}: ${url}${titlePart}${snippetPart}`
  );
}

/**
 * Загружает URL в headless Chromium и возвращает HTML (`page.content()`).
 * Опционально warm-up URL в той же вкладке (session cookies).
 * HTTP status ≥ 400 на целевом URL → warn + throw.
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
    const waitUntil = options?.waitUntil ?? "domcontentloaded";
    try {
      const warmUpUrl = options?.warmUpUrl?.trim();
      if (warmUpUrl) {
        try {
          const warmResponse = await page.goto(warmUpUrl, {
            timeout: BROWSER_REQUEST_TIMEOUT_MS,
            waitUntil,
          });
          const warmStatus = readGotoStatus(warmResponse);
          if (warmStatus !== undefined && warmStatus >= 400) {
            browserLog.warn(
              {
                context: "Playwright warm-up non-2xx, continue to target",
                url: warmUpUrl,
                httpStatus: warmStatus,
                targetUrl: url,
              },
              "playwright warmup http error"
            );
          }
        } catch (warmErr) {
          browserLog.warn(
            {
              context: "Playwright warm-up failed, continue to target",
              url: warmUpUrl,
              targetUrl: url,
              details:
                warmErr instanceof Error
                  ? warmErr.message
                  : String(warmErr),
            },
            "playwright warmup failed"
          );
        }
      }

      const response = await page.goto(url, {
        timeout: BROWSER_REQUEST_TIMEOUT_MS,
        waitUntil,
      });
      const status = readGotoStatus(response);
      await throwIfHttpError(page, url, status);
      return await page.content();
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.startsWith("Playwright GET HTTP ")
      ) {
        throw err;
      }
      throw new Error(formatPlaywrightFetchError(url, err), { cause: err });
    } finally {
      await page.close().catch(() => undefined);
      if (ephemeral) {
        await context.close().catch(() => undefined);
      }
    }
  });
}
