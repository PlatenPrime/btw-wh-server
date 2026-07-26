import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  acquirePlaywrightContext,
  applyPlaywrightStealth,
  buildChromiumLaunchOptions,
  buildPlaywrightContextOptions,
  closePlaywrightBrowser,
  resolvePlaywrightHeadless,
  setPlaywrightChromiumLoaderForTests,
  withPlaywrightSlot,
} from "../playwrightBrowser.js";

function createMockBrowser() {
  const contextClose = vi.fn(async () => undefined);
  const browserClose = vi.fn(async () => undefined);
  const addInitScript = vi.fn(async () => undefined);
  const newContext = vi.fn(async () => ({
    close: contextClose,
    newPage: vi.fn(),
    addInitScript,
  }));
  const browser = {
    newContext,
    close: browserClose,
  };
  const launch = vi.fn(async () => browser);
  return {
    launch,
    newContext,
    contextClose,
    browserClose,
    browser,
    addInitScript,
  };
}

describe("buildChromiumLaunchOptions / buildPlaywrightContextOptions", () => {
  const originalHeadless = process.env.BROWSER_PLAYWRIGHT_HEADLESS;

  afterEach(() => {
    if (originalHeadless === undefined) {
      delete process.env.BROWSER_PLAYWRIGHT_HEADLESS;
    } else {
      process.env.BROWSER_PLAYWRIGHT_HEADLESS = originalHeadless;
    }
  });

  it("launch по умолчанию headless с anti-automation args", () => {
    delete process.env.BROWSER_PLAYWRIGHT_HEADLESS;
    expect(buildChromiumLaunchOptions()).toEqual({
      headless: true,
      args: ["--disable-blink-features=AutomationControlled"],
      ignoreDefaultArgs: ["--enable-automation"],
    });
  });

  it("BROWSER_PLAYWRIGHT_HEADLESS=false → headful", () => {
    process.env.BROWSER_PLAYWRIGHT_HEADLESS = "false";
    expect(buildChromiumLaunchOptions().headless).toBe(false);
  });

  it("BROWSER_PLAYWRIGHT_HEADLESS=shell → shell", () => {
    process.env.BROWSER_PLAYWRIGHT_HEADLESS = "shell";
    expect(buildChromiumLaunchOptions().headless).toBe("shell");
  });

  it("context без ручного userAgent, с uk locale/tz", () => {
    const opts = buildPlaywrightContextOptions();
    expect(opts).toMatchObject({
      locale: "uk-UA",
      timezoneId: "Europe/Kyiv",
      viewport: { width: 1920, height: 1080 },
    });
    expect(opts).not.toHaveProperty("userAgent");
  });

  it("applyPlaywrightStealth вызывает addInitScript", async () => {
    const addInitScript = vi.fn(async () => undefined);
    await applyPlaywrightStealth({
      newPage: vi.fn(),
      close: vi.fn(),
      addInitScript,
    });
    expect(addInitScript).toHaveBeenCalled();
  });
});

describe("resolvePlaywrightHeadless", () => {
  it("парсит true/false/shell/мусор", () => {
    expect(resolvePlaywrightHeadless(undefined)).toBe(true);
    expect(resolvePlaywrightHeadless("")).toBe(true);
    expect(resolvePlaywrightHeadless("true")).toBe(true);
    expect(resolvePlaywrightHeadless("1")).toBe(true);
    expect(resolvePlaywrightHeadless("false")).toBe(false);
    expect(resolvePlaywrightHeadless("0")).toBe(false);
    expect(resolvePlaywrightHeadless("shell")).toBe("shell");
    expect(resolvePlaywrightHeadless("nope")).toBe(true);
  });
});

describe("playwrightBrowser", () => {
  const originalConcurrency = process.env.BROWSER_PLAYWRIGHT_CONCURRENCY;

  beforeEach(async () => {
    delete process.env.BROWSER_PLAYWRIGHT_CONCURRENCY;
    await closePlaywrightBrowser();
    setPlaywrightChromiumLoaderForTests(null);
  });

  afterEach(async () => {
    await closePlaywrightBrowser();
    setPlaywrightChromiumLoaderForTests(null);
    if (originalConcurrency === undefined) {
      delete process.env.BROWSER_PLAYWRIGHT_CONCURRENCY;
    } else {
      process.env.BROWSER_PLAYWRIGHT_CONCURRENCY = originalConcurrency;
    }
  });

  it("closePlaywrightBrowser no-op если браузер не поднимался", async () => {
    await expect(closePlaywrightBrowser()).resolves.toBeUndefined();
  });

  it("acquirePlaywrightContext без proxy — shared context", async () => {
    const mock = createMockBrowser();
    setPlaywrightChromiumLoaderForTests(async () => ({ launch: mock.launch }));

    const a = await acquirePlaywrightContext();
    const b = await acquirePlaywrightContext();

    expect(a.ephemeral).toBe(false);
    expect(b.ephemeral).toBe(false);
    expect(a.context).toBe(b.context);
    expect(mock.launch).toHaveBeenCalledTimes(1);
    expect(mock.launch).toHaveBeenCalledWith(
      expect.objectContaining({
        headless: true,
        args: expect.arrayContaining([
          "--disable-blink-features=AutomationControlled",
        ]),
        ignoreDefaultArgs: ["--enable-automation"],
      })
    );
    expect(mock.newContext).toHaveBeenCalledTimes(1);
    expect(mock.newContext).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "uk-UA",
        timezoneId: "Europe/Kyiv",
        viewport: { width: 1920, height: 1080 },
      })
    );
    const firstCall = mock.newContext.mock.calls[0] as
      unknown as [Record<string, unknown>] | undefined;
    expect(firstCall?.[0]).toBeDefined();
    expect(firstCall?.[0]).not.toHaveProperty("userAgent");
  });

  it("acquirePlaywrightContext с proxy — ephemeral context", async () => {
    const mock = createMockBrowser();
    setPlaywrightChromiumLoaderForTests(async () => ({ launch: mock.launch }));

    const result = await acquirePlaywrightContext({
      proxyUrl: "http://user:pass@proxy.example:8080",
    });

    expect(result.ephemeral).toBe(true);
    expect(mock.newContext).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "uk-UA",
        timezoneId: "Europe/Kyiv",
        proxy: {
          server: "http://proxy.example:8080",
          username: "user",
          password: "pass",
        },
      })
    );
  });

  it("acquirePlaywrightContext с невалидным proxy — throw", async () => {
    const mock = createMockBrowser();
    setPlaywrightChromiumLoaderForTests(async () => ({ launch: mock.launch }));

    await expect(
      acquirePlaywrightContext({ proxyUrl: "not-a-url" })
    ).rejects.toThrow(/Invalid browser HTTP proxy URL/);
    expect(mock.launch).not.toHaveBeenCalled();
  });

  it("closePlaywrightBrowser закрывает browser и context", async () => {
    const mock = createMockBrowser();
    setPlaywrightChromiumLoaderForTests(async () => ({ launch: mock.launch }));

    await acquirePlaywrightContext();
    await closePlaywrightBrowser();

    expect(mock.contextClose).toHaveBeenCalledTimes(1);
    expect(mock.browserClose).toHaveBeenCalledTimes(1);
  });

  it("withPlaywrightSlot ограничивает concurrency", async () => {
    process.env.BROWSER_PLAYWRIGHT_CONCURRENCY = "1";
    const order: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let enteredFirst!: () => void;
    const firstEntered = new Promise<void>((resolve) => {
      enteredFirst = resolve;
    });

    const p1 = withPlaywrightSlot(async () => {
      order.push("p1-enter");
      enteredFirst();
      await firstGate;
      order.push("p1-exit");
      return 1;
    });

    await firstEntered;

    const p2 = withPlaywrightSlot(async () => {
      order.push("p2");
      return 2;
    });

    // p2 ждёт слот — пока только p1-enter
    await Promise.resolve();
    expect(order).toEqual(["p1-enter"]);

    releaseFirst();
    await expect(Promise.all([p1, p2])).resolves.toEqual([1, 2]);
    expect(order).toEqual(["p1-enter", "p1-exit", "p2"]);
  });
});
