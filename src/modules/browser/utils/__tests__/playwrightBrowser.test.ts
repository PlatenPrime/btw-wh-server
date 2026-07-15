import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  acquirePlaywrightContext,
  closePlaywrightBrowser,
  setPlaywrightChromiumLoaderForTests,
  withPlaywrightSlot,
} from "../playwrightBrowser.js";

function createMockBrowser() {
  const contextClose = vi.fn(async () => undefined);
  const browserClose = vi.fn(async () => undefined);
  const newContext = vi.fn(async () => ({
    close: contextClose,
    newPage: vi.fn(),
  }));
  const browser = {
    newContext,
    close: browserClose,
  };
  const launch = vi.fn(async () => browser);
  return { launch, newContext, contextClose, browserClose, browser };
}

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
    expect(mock.newContext).toHaveBeenCalledTimes(1);
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
