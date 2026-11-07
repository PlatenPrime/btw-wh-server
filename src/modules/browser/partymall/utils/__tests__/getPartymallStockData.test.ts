import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPartymallStockData } from "../getPartymallStockData.js";
import { fetchPageHtml } from "../../../utils/fetchPageHtml.js";
import { PARTYMALL_NEGATIVE_OUTCOME } from "../partymall-product-types/partymallProductInfo.js";

vi.mock("../../../utils/fetchPageHtml.js", () => ({
  fetchPageHtml: vi.fn(),
}));

const SIMPLE_HTML = `<!DOCTYPE html><html><body>
<div id="product">
  <h1>Фольгована кулька</h1>
  <span id="product-model-1">ART-9</span>
  <div class="ds-product-main-stock green-text">В наявності: 43</div>
  <div class="ds-product-main-price"><div class="ds-price-new">11.77 грн</div></div>
</div>
</body></html>`;

describe("getPartymallStockData", () => {
  beforeEach(() => {
    vi.mocked(fetchPageHtml).mockReset();
  });

  describe("Валидация входных данных", () => {
    it("должен выбрасывать ошибку при пустой ссылке", async () => {
      await expect(getPartymallStockData("")).rejects.toThrow(
        "Link is required and must be a string",
      );
    });

    it("должен выбрасывать ошибку при null", async () => {
      await expect(getPartymallStockData(null as unknown as string)).rejects.toThrow(
        "Link is required and must be a string",
      );
    });

    it("должен выбрасывать ошибку при undefined", async () => {
      await expect(getPartymallStockData(undefined as unknown as string)).rejects.toThrow(
        "Link is required and must be a string",
      );
    });

    it("должен выбрасывать ошибку при не-строковом link", async () => {
      await expect(getPartymallStockData(123 as unknown as string)).rejects.toThrow(
        "Link is required and must be a string",
      );
    });
  });

  it("должен возвращать -1,-1 при ошибке сети", async () => {
    vi.mocked(fetchPageHtml).mockRejectedValue(new Error("Network error"));
    const result = await getPartymallStockData("https://partymall.ua/p");
    expect(result).toEqual(PARTYMALL_NEGATIVE_OUTCOME);
  });

  it("должен парсить ответ fetchPageHtml", async () => {
    vi.mocked(fetchPageHtml).mockResolvedValue(SIMPLE_HTML);
    const result = await getPartymallStockData(
      "https://partymall.ua/vozdushnyje-shary-pastjel-bjelyj-10-25-sm-gemar",
    );
    expect(fetchPageHtml).toHaveBeenCalledWith(
      "https://partymall.ua/vozdushnyje-shary-pastjel-bjelyj-10-25-sm-gemar",
      { konkName: "partymall" },
    );
    expect(result).toMatchObject({ stock: 43, price: 11.77, artikul: "ART-9" });
  });
});
