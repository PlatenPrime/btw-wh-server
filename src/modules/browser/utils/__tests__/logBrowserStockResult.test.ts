import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockInfo = vi.hoisted(() => vi.fn());
const mockWarn = vi.hoisted(() => vi.fn());

vi.mock("../../../../logging/createLogger.js", () => ({
  createLogger: () => ({
    info: mockInfo,
    warn: mockWarn,
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  BROWSER_STOCK_RESULT_LOGS_PER_MINUTE,
  logBrowserStockResult,
  resetBrowserStockResultLogForTests,
} from "../logBrowserStockResult.js";

describe("logBrowserStockResult", () => {
  beforeEach(() => {
    resetBrowserStockResultLogForTests(0);
    mockInfo.mockClear();
    mockWarn.mockClear();
  });

  afterEach(() => {
    resetBrowserStockResultLogForTests(0);
  });

  it("пишет info с stock/price/ok", () => {
    const logged = logBrowserStockResult(
      {
        konkName: "Air",
        link: "https://example.com/p/1",
        stock: 3,
        price: 99.5,
      },
      1_000
    );
    expect(logged).toBe(true);
    expect(mockInfo).toHaveBeenCalledWith(
      {
        konkName: "air",
        link: "https://example.com/p/1",
        stock: 3,
        price: 99.5,
        ok: true,
      },
      "browser stock result"
    );
  });

  it("ok=false при stock=-1 и price=-1", () => {
    logBrowserStockResult(
      {
        konkName: "air",
        link: "https://x",
        stock: -1,
        price: -1,
      },
      1
    );
    expect(mockInfo.mock.calls[0]?.[0]).toMatchObject({ ok: false });
  });

  it("21-й лог в окне минуты не пишет", () => {
    const base = 10_000;
    for (let i = 0; i < BROWSER_STOCK_RESULT_LOGS_PER_MINUTE; i++) {
      expect(
        logBrowserStockResult(
          {
            konkName: "air",
            link: `https://x/${i}`,
            stock: i,
            price: 1,
          },
          base + i
        )
      ).toBe(true);
    }
    expect(mockInfo).toHaveBeenCalledTimes(
      BROWSER_STOCK_RESULT_LOGS_PER_MINUTE
    );

    const dropped = logBrowserStockResult(
      {
        konkName: "air",
        link: "https://x/over",
        stock: 0,
        price: 0,
      },
      base + BROWSER_STOCK_RESULT_LOGS_PER_MINUTE
    );
    expect(dropped).toBe(false);
    expect(mockInfo).toHaveBeenCalledTimes(
      BROWSER_STOCK_RESULT_LOGS_PER_MINUTE
    );
  });

  it("после окна снова пишет; warn о dropped не чаще раза в минуту", () => {
    const base = 100_000;
    for (let i = 0; i < BROWSER_STOCK_RESULT_LOGS_PER_MINUTE; i++) {
      logBrowserStockResult(
        { konkName: "air", link: `https://a/${i}`, stock: 1, price: 1 },
        base
      );
    }
    logBrowserStockResult(
      { konkName: "air", link: "https://a/drop1", stock: 1, price: 1 },
      base + 1
    );
    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]?.[0]).toMatchObject({ dropped: 1 });

    logBrowserStockResult(
      { konkName: "air", link: "https://a/drop2", stock: 1, price: 1 },
      base + 2
    );
    expect(mockWarn).toHaveBeenCalledTimes(1);

    const afterWindow = base + 60_000;
    expect(
      logBrowserStockResult(
        { konkName: "air", link: "https://a/next", stock: 2, price: 3 },
        afterWindow
      )
    ).toBe(true);
    expect(mockInfo).toHaveBeenCalledTimes(
      BROWSER_STOCK_RESULT_LOGS_PER_MINUTE + 1
    );
  });

  it("обрезает длинный link", () => {
    const long = `https://example.com/${"x".repeat(200)}`;
    logBrowserStockResult(
      { konkName: "air", link: long, stock: 1, price: 1 },
      1
    );
    const payload = mockInfo.mock.calls[0]?.[0] as { link: string };
    expect(payload.link.length).toBeLessThanOrEqual(163);
    expect(payload.link.endsWith("...")).toBe(true);
  });
});
