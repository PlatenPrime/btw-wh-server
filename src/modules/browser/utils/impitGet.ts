import { Impit } from "impit";
import { CookieJar } from "tough-cookie";

import { createLogger } from "../../../logging/createLogger.js";
import {
  isAdmToolsChallengeHtml,
} from "./adm-tools-challenge/admToolsChallenge.js";
import { solveAdmToolsChallenge } from "./adm-tools-challenge/solveAdmToolsChallenge.js";
import {
  BrowserOriginBlockedError,
  isCloudflareOriginBlockedStatus,
  isOriginBlockedError,
  parseRetryAfterSeconds,
} from "./browserOriginBlockedError.js";
import { BROWSER_REQUEST_TIMEOUT_MS } from "./browserRequest.js";

const browserLog = createLogger({ module: "browser" });

/** Сколько символов body кладём в лог/ошибку при HTTP ≥ 400. */
export const IMPIT_ERROR_BODY_SNIPPET_MAX = 300;

export type ImpitGetOptions = {
  proxyUrl?: string;
  /**
   * Сначала GET этого URL тем же Impit-клиентом (cookies через cookieJar),
   * потом целевой. Ошибка warm-up — warn и продолжаем.
   */
  warmUpUrl?: string;
  /** Request-level headers (поверх impersonation; на product GET). */
  headers?: Record<string, string>;
};

export type ImpitHeadersLike = {
  get: (name: string) => string | null;
};

export type ImpitResponseLike = {
  status: number;
  statusText?: string;
  headers?: ImpitHeadersLike;
  text: () => Promise<string>;
};

export type ImpitFetchInit = {
  timeout?: number;
  headers?: Record<string, string>;
  method?: string;
  body?: string | FormData | URLSearchParams;
};

export type ImpitClientLike = {
  fetch: (url: string, init?: ImpitFetchInit) => Promise<ImpitResponseLike>;
};

/** Минимум API cookie jar, совместимый с ImpitOptions.cookieJar. */
export type ImpitCookieJar = {
  setCookie: (
    cookie: string,
    url: string,
    cb?: any
  ) => Promise<void> | void;
  getCookieString: (url: string) => Promise<string> | string;
};

export type ImpitFactory = (options: {
  browser: "chrome";
  timeout: number;
  proxyUrl?: string;
  cookieJar: ImpitCookieJar;
}) => ImpitClientLike;

const defaultImpitFactory: ImpitFactory = (options) =>
  new Impit({
    browser: options.browser,
    timeout: options.timeout,
    cookieJar: options.cookieJar,
    ...(options.proxyUrl ? { proxyUrl: options.proxyUrl } : {}),
  }) as ImpitClientLike;

let impitFactory: ImpitFactory = defaultImpitFactory;

/** Кэш клиентов по ключу proxy (пустая строка = без proxy). */
const clientByProxyKey = new Map<string, ImpitClientLike>();

/** Origins, для которых cookie jar уже прогрет (ключ = proxy key). */
const warmedOriginsByProxyKey = new Map<string, Set<string>>();

/**
 * Подмена фабрики Impit в тестах. `null` — вернуть default и сбросить кэш.
 */
export function setImpitFactoryForTests(factory: ImpitFactory | null): void {
  impitFactory = factory ?? defaultImpitFactory;
  clientByProxyKey.clear();
  warmedOriginsByProxyKey.clear();
}

export function clearImpitClientCacheForTests(): void {
  clientByProxyKey.clear();
  warmedOriginsByProxyKey.clear();
}

function originOf(url: string): string | undefined {
  if (!URL.canParse(url)) {
    return undefined;
  }
  return new URL(url).origin;
}

function isOriginWarmed(proxyKey: string, url: string): boolean {
  const origin = originOf(url);
  if (!origin) {
    return false;
  }
  return warmedOriginsByProxyKey.get(proxyKey)?.has(origin) === true;
}

function markOriginWarmed(proxyKey: string, url: string): void {
  const origin = originOf(url);
  if (!origin) {
    return;
  }
  let set = warmedOriginsByProxyKey.get(proxyKey);
  if (!set) {
    set = new Set();
    warmedOriginsByProxyKey.set(proxyKey, set);
  }
  set.add(origin);
}

function resolveProxyUrl(proxyUrl: string | undefined): string | undefined {
  const trimmed = proxyUrl?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!URL.canParse(trimmed)) {
    throw new Error(`Invalid browser HTTP proxy URL: ${trimmed}`);
  }
  return trimmed;
}

function getOrCreateClient(proxyUrl: string | undefined): ImpitClientLike {
  const key = proxyUrl ?? "";
  const cached = clientByProxyKey.get(key);
  if (cached) {
    return cached;
  }
  const client = impitFactory({
    browser: "chrome",
    timeout: BROWSER_REQUEST_TIMEOUT_MS,
    // tough-cookie CookieJar structurally satisfies Impit cookieJar; overloads don't match 1:1
    cookieJar: new CookieJar() as ImpitCookieJar,
    ...(proxyUrl ? { proxyUrl } : {}),
  });
  clientByProxyKey.set(key, client);
  return client;
}

function truncateMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= 200) {
    return trimmed || "unknown";
  }
  return `${trimmed.slice(0, 200)}... [truncated]`;
}

/**
 * Ужимает HTML/text для diag-лога (title + snippet).
 */
export function summarizeImpitErrorBody(html: string): {
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
    .slice(0, IMPIT_ERROR_BODY_SNIPPET_MAX);
  return { title, snippet, htmlLength: html.length };
}

function readRetryAfter(headers: ImpitHeadersLike | undefined): string | undefined {
  if (!headers || typeof headers.get !== "function") {
    return undefined;
  }
  const value = headers.get("retry-after")?.trim();
  return value || undefined;
}

export function formatImpitFetchError(url: string, err: unknown): string {
  if (err instanceof Error && err.message.startsWith("Impit GET HTTP ")) {
    return err.message;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return `Impit GET ${url} failed: ${truncateMessage(msg)}`;
}

function throwImpitHttpError(args: {
  url: string;
  status: number;
  statusText?: string;
  headers?: ImpitHeadersLike;
  body: string;
}): never {
  const bodySummary = summarizeImpitErrorBody(args.body);
  const retryAfter = readRetryAfter(args.headers);

  browserLog.warn(
    {
      context: "Impit GET non-2xx",
      url: args.url,
      httpStatus: args.status,
      ...(retryAfter ? { retryAfter } : {}),
      ...bodySummary,
    },
    "impit http error body"
  );

  const statusText = args.statusText?.trim();
  const statusTail = statusText ? ` ${statusText}` : "";
  const titlePart = bodySummary.title
    ? ` title=${JSON.stringify(bodySummary.title)}`
    : "";
  const snippetPart = bodySummary.snippet
    ? ` body=${JSON.stringify(bodySummary.snippet)}`
    : "";
  const retryPart = retryAfter
    ? ` retryAfter=${JSON.stringify(retryAfter)}`
    : "";

  const message = `Impit GET HTTP ${args.status}${statusTail}: ${args.url}${titlePart}${snippetPart}${retryPart}`;

  if (isCloudflareOriginBlockedStatus(args.status)) {
    throw new BrowserOriginBlockedError(message, {
      httpStatus: args.status,
      retryAfterSec: parseRetryAfterSeconds(retryAfter),
    });
  }

  throw new Error(message);
}

async function readErrorBody(response: ImpitResponseLike): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

/**
 * GET; при adm.tools challenge (часто 429, иногда 200 с HTML-заглушкой) —
 * POST ack (`__ack` JSON или legacy `___ack` FormData) и один retry GET.
 */
async function fetchHtmlWithAdmToolsSolve(
  client: ImpitClientLike,
  url: string,
  init: ImpitFetchInit
): Promise<string> {
  const first = await client.fetch(url, init);
  const body =
    first.status < 400 ? await first.text() : await readErrorBody(first);
  const isChallenge = isAdmToolsChallengeHtml(body);

  if (first.status < 400 && !isChallenge) {
    return body;
  }

  if (!isChallenge) {
    throwImpitHttpError({
      url,
      status: first.status,
      statusText: first.statusText,
      headers: first.headers,
      body,
    });
  }

  try {
    await solveAdmToolsChallenge(client, url, body, {
      timeoutMs: init.timeout,
      headers: init.headers,
    });
  } catch (solveErr) {
    browserLog.warn(
      {
        context: "adm.tools challenge solve failed",
        url,
        details:
          solveErr instanceof Error ? solveErr.message : String(solveErr),
      },
      "adm tools challenge failed"
    );
    throwImpitHttpError({
      url,
      status: first.status < 400 ? 429 : first.status,
      statusText: first.statusText,
      headers: first.headers,
      body,
    });
  }

  const second = await client.fetch(url, init);
  if (second.status >= 400) {
    const retryBody = await readErrorBody(second);
    throwImpitHttpError({
      url,
      status: second.status,
      statusText: second.statusText,
      headers: second.headers,
      body: retryBody,
    });
  }

  const retryHtml = await second.text();
  if (isAdmToolsChallengeHtml(retryHtml)) {
    throwImpitHttpError({
      url,
      status: 429,
      statusText: second.statusText,
      headers: second.headers,
      body: retryHtml,
    });
  }
  return retryHtml;
}

/**
 * GET HTML через Impit (Chrome TLS/HTTP fingerprint + cookie jar).
 * adm.tools JS-challenge: POST ack → retry.
 * HTTP status ≥ 400 (после solve) → warn (snippet/Retry-After) + throw.
 */
export async function impitGet(
  url: string,
  options?: ImpitGetOptions
): Promise<string> {
  const proxyUrl = resolveProxyUrl(options?.proxyUrl);
  const proxyKey = proxyUrl ?? "";
  const client = getOrCreateClient(proxyUrl);
  const requestHeaders = options?.headers;

  try {
    const warmUpUrl = options?.warmUpUrl?.trim();
    if (warmUpUrl && !isOriginWarmed(proxyKey, warmUpUrl)) {
      try {
        await fetchHtmlWithAdmToolsSolve(client, warmUpUrl, {
          timeout: BROWSER_REQUEST_TIMEOUT_MS,
        });
        markOriginWarmed(proxyKey, warmUpUrl);
      } catch (warmErr) {
        if (isOriginBlockedError(warmErr)) {
          throw warmErr;
        }
        browserLog.warn(
          {
            context: "Impit warm-up failed, continue to target",
            url: warmUpUrl,
            targetUrl: url,
            details:
              warmErr instanceof Error
                ? warmErr.message
                : String(warmErr),
          },
          "impit warmup failed"
        );
      }
    }

    const html = await fetchHtmlWithAdmToolsSolve(client, url, {
      timeout: BROWSER_REQUEST_TIMEOUT_MS,
      ...(requestHeaders ? { headers: requestHeaders } : {}),
    });
    markOriginWarmed(proxyKey, url);
    return html;
  } catch (err) {
    if (isOriginBlockedError(err)) {
      throw err;
    }
    throw new Error(formatImpitFetchError(url, err), { cause: err });
  }
}
