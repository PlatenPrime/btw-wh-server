import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestArt } from "../../../../../test/setup.js";
import { getSharikStockData } from "../getSharikStockData.js";
import { clearSharikProductRestsCache } from "../product-rests/index.js";
import type * as BrowserRequest from "../../../utils/browserRequest.js";

vi.mock("../../../utils/browserRequest.js", async (importOriginal) => {
  const actual = await importOriginal<typeof BrowserRequest>();
  return {
    ...actual,
    browserGet: vi.fn(),
    logBrowserError: vi.fn(),
  };
});

import { browserGet } from "../../../utils/browserRequest.js";

describe("getSharikStockData", () => {
  beforeEach(() => {
    clearSharikProductRestsCache();
    vi.mocked(browserGet).mockReset();
  });

  afterEach(() => {
    clearSharikProductRestsCache();
  });

  describe("Валидация входных данных", () => {
    it("должен выбрасывать ошибку при пустом артикуле", async () => {
      await expect(getSharikStockData("")).rejects.toThrow(
        "Artikul is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при null артикуле", async () => {
      await expect(getSharikStockData(null as any)).rejects.toThrow(
        "Artikul is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при undefined артикуле", async () => {
      await expect(getSharikStockData(undefined as any)).rejects.toThrow(
        "Artikul is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при не-строковом артикуле", async () => {
      await expect(getSharikStockData(123 as any)).rejects.toThrow(
        "Artikul is required and must be a string"
      );
    });
  });

  describe("Успешные сценарии", () => {
    it("возвращает actualQuantity и nameukr из Art", async () => {
      await createTestArt({
        artikul: "1501-3445",
        zone: "A1",
        nameukr: "Товар з Art",
      });
      vi.mocked(browserGet).mockResolvedValue(
        "<pre>1501-3445 = 15; 20; 1250.50</pre>"
      );

      const result = await getSharikStockData("1501-3445");

      expect(result).toEqual({
        nameukr: "Товар з Art",
        price: 1250.5,
        quantity: 15,
      });
      expect(browserGet).toHaveBeenCalledWith(
        "https://sharik.ua/product_rests/1302-0065/"
      );
    });

    it("nameukr пустой если Art нет", async () => {
      vi.mocked(browserGet).mockResolvedValue(
        "<pre>1501-3445 = 15; 20; 1250.50</pre>"
      );

      const result = await getSharikStockData("1501-3445");

      expect(result).toEqual({
        nameukr: "",
        price: 1250.5,
        quantity: 15,
      });
    });

    it("возвращает null когда артикула нет в map", async () => {
      vi.mocked(browserGet).mockResolvedValue(
        "<pre>1501-0001 = 1; 1; 10.00</pre>"
      );

      const result = await getSharikStockData("nonexistent");

      expect(result).toBeNull();
    });

    it("переиспользует cache на повторном вызове", async () => {
      vi.mocked(browserGet).mockResolvedValue(
        "<pre>1501-3445 = 15; 20; 1250.50</pre>"
      );

      await getSharikStockData("1501-3445");
      await getSharikStockData("1501-3445");

      expect(browserGet).toHaveBeenCalledTimes(1);
    });
  });

  describe("Обработка ошибок", () => {
    it("должен выбрасывать ошибку при ошибке сети", async () => {
      vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));

      await expect(getSharikStockData("test")).rejects.toThrow(
        "Failed to fetch data from sharik.ua"
      );
    });
  });
});
