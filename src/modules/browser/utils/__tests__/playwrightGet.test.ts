import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  closePlaywrightBrowser,
  setPlaywrightChromiumLoaderForTests,
} from "../playwrightBrowser.js";
import { playwrightGet } from "../playwrightGet.js";

describe("playwrightGet", () => {
  beforeEach(async () => {
    await closePlaywrightBrowser();
    setPlaywrightChromiumLoaderForTests(null);
  });

  afterEach(async () => {
    await closePlaywrightBrowser();
    setPlaywrightChromiumLoaderForTests(null);
  });

  it("goto + content → HTML", async () => {
    const pageClose = vi.fn(async () => undefined);
    const goto = vi.fn(async () => null);
    const content = vi.fn(async () => "<html>ok</html>");
    const newPage = vi.fn(async () => ({
      goto,
      content,
      close: pageClose,
    }));
    const contextClose = vi.fn(async () => undefined);
    const newContext = vi.fn(async () => ({
      newPage,
      close: contextClose,
    }));
    const launch = vi.fn(async () => ({
      newContext,
      close: vi.fn(async () => undefined),
    }));
    setPlaywrightChromiumLoaderForTests(async () => ({ launch }));

    const html = await playwrightGet("https://example.com/p");

    expect(html).toBe("<html>ok</html>");
    expect(goto).toHaveBeenCalledWith("https://example.com/p", {
      timeout: 30_000,
      waitUntil: "domcontentloaded",
    });
    expect(pageClose).toHaveBeenCalled();
  });

  it("проксирует waitUntil", async () => {
    const goto = vi.fn(async () => null);
    const newPage = vi.fn(async () => ({
      goto,
      content: vi.fn(async () => "<html/>"),
      close: vi.fn(async () => undefined),
    }));
    const newContext = vi.fn(async () => ({
      newPage,
      close: vi.fn(async () => undefined),
    }));
    setPlaywrightChromiumLoaderForTests(async () => ({
      launch: vi.fn(async () => ({
        newContext,
        close: vi.fn(async () => undefined),
      })),
    }));

    await playwrightGet("https://example.com", { waitUntil: "networkidle" });

    expect(goto).toHaveBeenCalledWith("https://example.com", {
      timeout: 30_000,
      waitUntil: "networkidle",
    });
  });

  it("при ошибке goto — Error с коротким message", async () => {
    const pageClose = vi.fn(async () => undefined);
    const newPage = vi.fn(async () => ({
      goto: vi.fn(async () => {
        throw new Error("Navigation timeout");
      }),
      content: vi.fn(),
      close: pageClose,
    }));
    const newContext = vi.fn(async () => ({
      newPage,
      close: vi.fn(async () => undefined),
    }));
    setPlaywrightChromiumLoaderForTests(async () => ({
      launch: vi.fn(async () => ({
        newContext,
        close: vi.fn(async () => undefined),
      })),
    }));

    await expect(playwrightGet("https://example.com/fail")).rejects.toThrow(
      /Playwright GET https:\/\/example.com\/fail failed: Navigation timeout/
    );
    expect(pageClose).toHaveBeenCalled();
  });

  it("ephemeral context с proxy закрывается после запроса", async () => {
    const contextClose = vi.fn(async () => undefined);
    const newPage = vi.fn(async () => ({
      goto: vi.fn(async () => null),
      content: vi.fn(async () => "<html/>"),
      close: vi.fn(async () => undefined),
    }));
    const newContext = vi.fn(async () => ({
      newPage,
      close: contextClose,
    }));
    setPlaywrightChromiumLoaderForTests(async () => ({
      launch: vi.fn(async () => ({
        newContext,
        close: vi.fn(async () => undefined),
      })),
    }));

    await playwrightGet("https://example.com", {
      proxyUrl: "http://127.0.0.1:8080",
    });

    expect(contextClose).toHaveBeenCalled();
  });
});
