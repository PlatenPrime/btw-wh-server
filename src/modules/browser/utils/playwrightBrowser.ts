import { createLogger } from "../../../logging/createLogger.js";
import { parseHttpProxyUrl } from "./parse-http-proxy-url/parseHttpProxyUrl.js";

const browserLog = createLogger({ module: "browser" });

const DEFAULT_PLAYWRIGHT_CONCURRENCY = 2;

/** Минимальные типы под Playwright API (и тестовые моки). */
export type PlaywrightResponseLike = {
  status: () => number;
};

export type PlaywrightPageLike = {
  goto: (
    url: string,
    options?: { timeout?: number; waitUntil?: string }
  ) => Promise<PlaywrightResponseLike | null>;
  content: () => Promise<string>;
  close: () => Promise<void>;
};

export type PlaywrightContextLike = {
  newPage: () => Promise<PlaywrightPageLike>;
  close: () => Promise<void>;
  addInitScript?: (script: string | (() => void)) => Promise<void>;
};

export type PlaywrightBrowserLike = {
  newContext: (options?: Record<string, unknown>) => Promise<PlaywrightContextLike>;
  close: () => Promise<void>;
};

export type ChromiumLaunchOptions = {
  headless?: boolean | "shell";
  args?: string[];
  ignoreDefaultArgs?: string[] | boolean;
};

export type ChromiumLauncher = {
  launch: (options?: ChromiumLaunchOptions) => Promise<PlaywrightBrowserLike>;
};

type ChromiumLoader = () => Promise<ChromiumLauncher>;

let browserPromise: Promise<PlaywrightBrowserLike> | null = null;
let defaultContextPromise: Promise<PlaywrightContextLike> | null = null;
let chromiumLoader: ChromiumLoader | null = null;

let activeSlots = 0;
const slotWaiters: Array<() => void> = [];

/**
 * Опции context: без подмены UA (совпадает с бинарём), uk locale/tz, desktop viewport.
 */
export function buildPlaywrightContextOptions(
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return {
    locale: "uk-UA",
    timezoneId: "Europe/Kyiv",
    viewport: { width: 1920, height: 1080 },
    extraHTTPHeaders: {
      "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    ...extra,
  };
}

/**
 * Патч navigator.webdriver (игнор, если mock context без addInitScript).
 */
export async function applyPlaywrightStealth(
  context: PlaywrightContextLike
): Promise<void> {
  if (typeof context.addInitScript !== "function") {
    return;
  }
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "webdriver", {
      get: () => undefined,
    });
  });
}

function getConcurrencyLimit(): number {
  const raw = process.env.BROWSER_PLAYWRIGHT_CONCURRENCY?.trim();
  if (!raw) {
    return DEFAULT_PLAYWRIGHT_CONCURRENCY;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_PLAYWRIGHT_CONCURRENCY;
  }
  return Math.floor(n);
}

async function loadChromium(): Promise<ChromiumLauncher> {
  if (chromiumLoader) {
    return chromiumLoader();
  }
  const { chromium } = await import("playwright");
  return chromium as unknown as ChromiumLauncher;
}

/**
 * Подмена загрузчика Playwright в тестах (без реального Chromium).
 */
export function setPlaywrightChromiumLoaderForTests(
  loader: ChromiumLoader | null
): void {
  chromiumLoader = loader;
}

async function acquireSlot(): Promise<void> {
  const limit = getConcurrencyLimit();
  if (activeSlots < limit) {
    activeSlots += 1;
    return;
  }
  await new Promise<void>((resolve) => {
    slotWaiters.push(() => {
      activeSlots += 1;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeSlots = Math.max(0, activeSlots - 1);
  const next = slotWaiters.shift();
  if (next) {
    next();
  }
}

export async function withPlaywrightSlot<T>(
  fn: () => Promise<T>
): Promise<T> {
  await acquireSlot();
  try {
    return await fn();
  } finally {
    releaseSlot();
  }
}

/**
 * `BROWSER_PLAYWRIGHT_HEADLESS`: `true`/`1`/пусто → headless;
 * `false`/`0` → окно Chromium; `shell` → old headless shell.
 */
export function resolvePlaywrightHeadless(
  raw: string | undefined = process.env.BROWSER_PLAYWRIGHT_HEADLESS
): boolean | "shell" {
  const v = raw?.trim().toLowerCase();
  if (!v || v === "true" || v === "1") {
    return true;
  }
  if (v === "false" || v === "0") {
    return false;
  }
  if (v === "shell") {
    return "shell";
  }
  return true;
}

export function buildChromiumLaunchOptions(): ChromiumLaunchOptions {
  const headless = resolvePlaywrightHeadless();
  return {
    headless,
    args: ["--disable-blink-features=AutomationControlled"],
    ignoreDefaultArgs: ["--enable-automation"],
  };
}

async function getBrowser(): Promise<PlaywrightBrowserLike> {
  if (!browserPromise) {
    browserPromise = (async () => {
      const chromium = await loadChromium();
      const launchOpts = buildChromiumLaunchOptions();
      browserLog.info(
        { headless: launchOpts.headless },
        "launching Playwright Chromium"
      );
      return chromium.launch(launchOpts);
    })().catch((err) => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

async function createStealthContext(
  browser: PlaywrightBrowserLike,
  extra?: Record<string, unknown>
): Promise<PlaywrightContextLike> {
  const context = await browser.newContext(
    buildPlaywrightContextOptions(extra)
  );
  await applyPlaywrightStealth(context);
  return context;
}

async function getDefaultContext(): Promise<PlaywrightContextLike> {
  if (!defaultContextPromise) {
    defaultContextPromise = (async () => {
      const browser = await getBrowser();
      return createStealthContext(browser);
    })().catch((err) => {
      defaultContextPromise = null;
      throw err;
    });
  }
  return defaultContextPromise;
}

export type PlaywrightProxyOptions = {
  proxyUrl?: string;
};

/**
 * Контекст для запроса: shared без прокси, либо ephemeral с proxy.
 * Caller обязан закрыть ephemeral context после использования.
 */
export async function acquirePlaywrightContext(
  options?: PlaywrightProxyOptions
): Promise<{ context: PlaywrightContextLike; ephemeral: boolean }> {
  const proxyUrl = options?.proxyUrl?.trim();
  if (!proxyUrl) {
    return { context: await getDefaultContext(), ephemeral: false };
  }

  const parsed = parseHttpProxyUrl(proxyUrl);
  if (!parsed) {
    throw new Error(`Invalid browser HTTP proxy URL: ${proxyUrl}`);
  }

  const server = `${parsed.protocol}://${parsed.host}:${parsed.port}`;
  const browser = await getBrowser();
  const context = await createStealthContext(browser, {
    proxy: {
      server,
      ...(parsed.auth && {
        username: parsed.auth.username,
        password: parsed.auth.password,
      }),
    },
  });
  return { context, ephemeral: true };
}

/**
 * Закрывает Playwright browser/context. No-op если не поднимался.
 */
export async function closePlaywrightBrowser(): Promise<void> {
  const contextP = defaultContextPromise;
  const browserP = browserPromise;
  defaultContextPromise = null;
  browserPromise = null;
  activeSlots = 0;
  slotWaiters.length = 0;

  if (contextP) {
    try {
      const ctx = await contextP;
      await ctx.close();
    } catch (err) {
      browserLog.warn(
        { err },
        "failed to close Playwright default context"
      );
    }
  }

  if (browserP) {
    try {
      const browser = await browserP;
      await browser.close();
      browserLog.info("Playwright Chromium closed");
    } catch (err) {
      browserLog.warn({ err }, "failed to close Playwright browser");
    }
  }
}
