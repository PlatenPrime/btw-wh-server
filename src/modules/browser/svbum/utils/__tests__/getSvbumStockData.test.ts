import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSvbumStockData } from "../getSvbumStockData.js";
import { fetchPageHtml } from "../../../utils/fetchPageHtml.js";
import { SVBUM_NEGATIVE_OUTCOME } from "../svbum-product-types/svbumProductInfo.js";

vi.mock("../../../utils/fetchPageHtml.js", () => ({
  fetchPageHtml: vi.fn(),
}));

const SIMPLE_HTML = `<!DOCTYPE html><html><body>
<h1 class="page-title">Фольгована кулька</h1>
<div id="product">
  <div class="product-control-price">
    <div class="price">
      <span class="price-new"><span data-price="11.7700" class="calc-price">11.77 грн</span></span>
    </div>
  </div>
  <input type="hidden" data-product-quantity="43">
</div>
</body></html>`;

describe("getSvbumStockData", () => {
  beforeEach(() => {
    vi.mocked(fetchPageHtml).mockReset();
  });

  describe("Валидация входных данных", () => {
    it("должен выбрасывать ошибку при пустой ссылке", async () => {
      await expect(getSvbumStockData("")).rejects.toThrow(
        "Link is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при null", async () => {
      await expect(
        getSvbumStockData(null as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });

    it("должен выбрасывать ошибку при undefined", async () => {
      await expect(
        getSvbumStockData(undefined as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });

    it("должен выбрасывать ошибку при не-строковом link", async () => {
      await expect(
        getSvbumStockData(123 as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });
  });

  it("должен возвращать -1,-1 при ошибке сети", async () => {
    vi.mocked(fetchPageHtml).mockRejectedValue(new Error("Network error"));
    const result = await getSvbumStockData("https://sviatobum.ua/p");
    expect(result).toEqual(SVBUM_NEGATIVE_OUTCOME);
  });

  it("должен парсить ответ fetchPageHtml", async () => {
    vi.mocked(fetchPageHtml).mockResolvedValue(SIMPLE_HTML);
    const result = await getSvbumStockData(
      "https://sviatobum.ua/povitryani-kuli/item"
    );
    expect(fetchPageHtml).toHaveBeenCalledWith(
      "https://sviatobum.ua/povitryani-kuli/item",
      { konkName: "svbum" }
    );
    expect(result).toMatchObject({ stock: 43, price: 11.77 });
  });
});
