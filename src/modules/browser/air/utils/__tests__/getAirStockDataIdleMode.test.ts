import { describe, expect, it, vi } from "vitest";
import { fetchPageHtml } from "../../../utils/fetchPageHtml.js";

vi.mock("../airIdleMode.js", () => ({ AIR_IDLE_MODE: true }));
vi.mock("../../../utils/fetchPageHtml.js");
vi.mock("../../../utils/logBrowserStockResult.js", () => ({
  logBrowserStockResult: vi.fn(),
}));
vi.mock("../../../utils/browserRequest.js", () => ({
  logBrowserError: vi.fn(),
}));
vi.mock("../../../../../logging/createLogger.js", () => ({
  createLogger: () => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { getAirStockData } from "../getAirStockData.js";

describe("getAirStockData — AIR_IDLE_MODE", () => {
  it("возвращает { stock: -1, price: -1 } без сетевых вызовов", async () => {
    const result = await getAirStockData("https://example.com/product/123");

    expect(result).toEqual({ stock: -1, price: -1 });
    expect(fetchPageHtml).not.toHaveBeenCalled();
  });

  it("возвращает -1/-1 даже при невалидном link", async () => {
    const result = await getAirStockData("");

    expect(result).toEqual({ stock: -1, price: -1 });
    expect(fetchPageHtml).not.toHaveBeenCalled();
  });

  it("возвращает -1/-1 при null link", async () => {
    const result = await getAirStockData(null as unknown as string);

    expect(result).toEqual({ stock: -1, price: -1 });
    expect(fetchPageHtml).not.toHaveBeenCalled();
  });
});
