import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockWarn = vi.hoisted(() => vi.fn());

vi.mock("../../../../logging/createLogger.js", () => ({
  createLogger: () => ({
    warn: mockWarn,
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  closePlaywrightBrowser,
  setPlaywrightChromiumLoaderForTests,
} from "../playwrightBrowser.js";
import {
  PLAYWRIGHT_ERROR_BODY_SNIPPET_MAX,
  playwrightGet,
  summarizePlaywrightErrorBody,
} from "../playwrightGet.js";

describe("summarizePlaywrightErrorBody", () => {
  it("достаёт title и режет snippet", () => {
    const html = `<html><head><title>  429\nBlocked  </title></head><body>${"z".repeat(500)}</body></html>`;
    const out = summarizePlaywrightErrorBody(html);
    expect(out.title).toBe("429 Blocked");
    expect(out.snippet.length).toBeLessThanOrEqual(
      PLAYWRIGHT_ERROR_BODY_SNIPPET_MAX
    );
    expect(out.htmlLength).toBe(html.length);
  });

  it("пустой title без тега", () => {
    expect(summarizePlaywrightErrorBody("<html/>").title).toBe("");
  });
});

describe("playwrightGet", () => {
  beforeEach(async () => {
    await closePlaywrightBrowser();
    setPlaywrightChromiumLoaderForTests(null);
    mockWarn.mockClear();
  });

  afterEach(async () => {
    await closePlaywrightBrowser();
    setPlaywrightChromiumLoaderForTests(null);
  });

  it("goto + content → HTML", async () => {
    const pageClose = vi.fn(async () => undefined);
    const goto = vi.fn(async () => ({ status: () => 200 }));
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
      addInitScript: vi.fn(async () => undefined),
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
    const goto = vi.fn(async () => ({ status: () => 200 }));
    const newPage = vi.fn(async () => ({
      goto,
      content: vi.fn(async () => "<html/>"),
      close: vi.fn(async () => undefined),
    }));
    const newContext = vi.fn(async () => ({
      newPage,
      close: vi.fn(async () => undefined),
      addInitScript: vi.fn(async () => undefined),
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

  it("при HTTP 429 — читает body, логирует snippet и throw", async () => {
    const pageClose = vi.fn(async () => undefined);
    const content = vi.fn(
      async () =>
        "<html><head><title>Too Many Requests</title></head><body>rate limited by stormwall</body></html>"
    );
    const newPage = vi.fn(async () => ({
      goto: vi.fn(async () => ({ status: () => 429 })),
      content,
      close: pageClose,
    }));
    const newContext = vi.fn(async () => ({
      newPage,
      close: vi.fn(async () => undefined),
      addInitScript: vi.fn(async () => undefined),
    }));
    setPlaywrightChromiumLoaderForTests(async () => ({
      launch: vi.fn(async () => ({
        newContext,
        close: vi.fn(async () => undefined),
      })),
    }));

    const url = "https://airballoons.com.ua/ua/product/x";
    await expect(playwrightGet(url)).rejects.toThrow(
      /Playwright GET HTTP 429: .*title="Too Many Requests".*body=.*stormwall/
    );
    expect(content).toHaveBeenCalled();
    expect(mockWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        context: "Playwright GET non-2xx",
        url,
        httpStatus: 429,
        title: "Too Many Requests",
      }),
      "playwright http error body"
    );
    expect(pageClose).toHaveBeenCalled();
  });

  it("warmUpUrl — сначала origin, потом product в одной вкладке", async () => {
    const goto = vi
      .fn()
      .mockResolvedValueOnce({ status: () => 200 })
      .mockResolvedValueOnce({ status: () => 200 });
    const content = vi.fn(async () => "<html>product</html>");
    const newPage = vi.fn(async () => ({
      goto,
      content,
      close: vi.fn(async () => undefined),
    }));
    setPlaywrightChromiumLoaderForTests(async () => ({
      launch: vi.fn(async () => ({
        newContext: vi.fn(async () => ({
          newPage,
          close: vi.fn(async () => undefined),
          addInitScript: vi.fn(async () => undefined),
        })),
        close: vi.fn(async () => undefined),
      })),
    }));

    const html = await playwrightGet(
      "https://airballoons.com.ua/ua/product/x",
      { warmUpUrl: "https://airballoons.com.ua/" }
    );

    expect(html).toBe("<html>product</html>");
    expect(goto).toHaveBeenNthCalledWith(1, "https://airballoons.com.ua/", {
      timeout: 30_000,
      waitUntil: "domcontentloaded",
    });
    expect(goto).toHaveBeenNthCalledWith(
      2,
      "https://airballoons.com.ua/ua/product/x",
      {
        timeout: 30_000,
        waitUntil: "domcontentloaded",
      }
    );
  });

  it("warm-up 4xx — warn и всё равно идём на target", async () => {
    const goto = vi
      .fn()
      .mockResolvedValueOnce({ status: () => 429 })
      .mockResolvedValueOnce({ status: () => 200 });
    const content = vi.fn(async () => "<html>ok</html>");
    setPlaywrightChromiumLoaderForTests(async () => ({
      launch: vi.fn(async () => ({
        newContext: vi.fn(async () => ({
          newPage: vi.fn(async () => ({
            goto,
            content,
            close: vi.fn(async () => undefined),
          })),
          close: vi.fn(async () => undefined),
          addInitScript: vi.fn(async () => undefined),
        })),
        close: vi.fn(async () => undefined),
      })),
    }));

    const html = await playwrightGet("https://example.com/p", {
      warmUpUrl: "https://example.com/",
    });

    expect(html).toBe("<html>ok</html>");
    expect(mockWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        context: "Playwright warm-up non-2xx, continue to target",
        httpStatus: 429,
      }),
      "playwright warmup http error"
    );
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
      addInitScript: vi.fn(async () => undefined),
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
      goto: vi.fn(async () => ({ status: () => 200 })),
      content: vi.fn(async () => "<html/>"),
      close: vi.fn(async () => undefined),
    }));
    const newContext = vi.fn(async () => ({
      newPage,
      close: contextClose,
      addInitScript: vi.fn(async () => undefined),
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
