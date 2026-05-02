import { beforeEach, describe, expect, it, vi } from "vitest";
import { getYuminStockData, parseYuminProductHtml } from "../getYuminStockData.js";
import { browserGet } from "../../../utils/browserRequest.js";
vi.mock("../../../utils/browserRequest.js");
/** Минимальный HTML: :initial-price / :flat-qty, h1, опционально ld+json и блоки опта. */
function yuminProductPageHtml(opts) {
    const ld = opts.ldJsonProductName !== undefined
        ? `<script type="application/ld+json">${JSON.stringify({
            "@type": "Product",
            name: opts.ldJsonProductName,
        })}</script>`
        : "";
    const wholesale = opts.wholesaleBlocks ?? "";
    return `<!DOCTYPE html><html><body>
${ld}
<h1 class="text-3xl">${opts.h1Title}</h1>
<div v-product-customizable-options :initial-price="${opts.initialPrice}" :flat-qty="${opts.flatQty}"></div>
${wholesale}
</body></html>`;
}
/** 15 уп × 10 шт, 138.4/10 = 13.84 */
const YUMIN_HTML_CLEAN_PRICE = yuminProductPageHtml({
    initialPrice: 138.4,
    flatQty: 15,
    h1Title: "Кулька латексна (10шт) в уп.",
    ldJsonProductName: "Кулька (10шт)",
});
/** 13 уп × 100 шт, 171/100 = 1.71 */
const YUMIN_HTML_PACK_PRICE = yuminProductPageHtml({
    initialPrice: 171,
    flatQty: 13,
    h1Title: "Набір (100шт) Gemar",
    ldJsonProductName: "Набір (100шт) Gemar",
});
const YUMIN_HTML_SALE_PRICE = yuminProductPageHtml({
    initialPrice: 18.94,
    flatQty: 10,
    h1Title: "Товар промо без фасовки в назві",
    ldJsonProductName: "Товар промо без фасовки в назві",
});
const YUMIN_HTML_WHOLESALE = yuminProductPageHtml({
    initialPrice: 500,
    flatQty: 88358,
    h1Title: "Оптовий товар",
    ldJsonProductName: "Оптовий товар",
    wholesaleBlocks: `
    <p>Від 10 шт.</p><p>1,57 грн</p>
  `,
});
const YUMIN_HTML_ZERO_STOCK = yuminProductPageHtml({
    initialPrice: 89.46,
    flatQty: 0,
    h1Title: "Немає в наявності",
    ldJsonProductName: "Немає в наявності",
});
describe("parseYuminProductHtml", () => {
    it("clean_price: нормализация на штуки (10шт)", () => {
        const result = parseYuminProductHtml(YUMIN_HTML_CLEAN_PRICE);
        expect(result).toMatchObject({ stock: 150, price: 13.84 });
        expect(result.title).toContain("10шт");
    });
    it("pack_price: нормализация на штуки (100шт)", () => {
        const result = parseYuminProductHtml(YUMIN_HTML_PACK_PRICE);
        expect(result).toMatchObject({ stock: 1300, price: 1.71 });
    });
    it("sale_price: без (Nшт) в названии — цена и остаток как на странице", () => {
        const result = parseYuminProductHtml(YUMIN_HTML_SALE_PRICE);
        expect(result).toMatchObject({ stock: 10, price: 18.94 });
    });
    it("wholesale_price: учёт опта «Від X шт.»", () => {
        const result = parseYuminProductHtml(YUMIN_HTML_WHOLESALE);
        expect(result).toMatchObject({ stock: 88358, price: 1.57 });
    });
    it("zero_stock: flat-qty 0", () => {
        const result = parseYuminProductHtml(YUMIN_HTML_ZERO_STOCK);
        expect(result).toMatchObject({ stock: 0, price: 89.46 });
    });
    it("возвращает -1,-1 без v-product-customizable-options", () => {
        const html = "<html><body><h1 class='text-3xl'>X (10шт)</h1></body></html>";
        expect(parseYuminProductHtml(html)).toEqual({ stock: -1, price: -1 });
    });
    it("возвращает -1,-1 при пустом HTML", () => {
        expect(parseYuminProductHtml("")).toEqual({ stock: -1, price: -1 });
    });
});
describe("getYuminStockData", () => {
    beforeEach(() => {
        vi.mocked(browserGet).mockReset();
    });
    describe("Валидация входных данных", () => {
        it("должен выбрасывать ошибку при пустой ссылке", async () => {
            await expect(getYuminStockData("")).rejects.toThrow("Link is required and must be a string");
        });
        it("должен выбрасывать ошибку при null", async () => {
            await expect(getYuminStockData(null)).rejects.toThrow("Link is required and must be a string");
        });
        it("должен выбрасывать ошибку при undefined", async () => {
            await expect(getYuminStockData(undefined)).rejects.toThrow("Link is required and must be a string");
        });
        it("должен выбрасывать ошибку при не-строковом link", async () => {
            await expect(getYuminStockData(123)).rejects.toThrow("Link is required and must be a string");
        });
    });
    it("должен возвращать -1,-1 при ошибке сети", async () => {
        vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));
        const result = await getYuminStockData("https://example.com/p");
        expect(result).toEqual({ stock: -1, price: -1 });
    });
    it("должен парсить ответ browserGet", async () => {
        vi.mocked(browserGet).mockResolvedValue(YUMIN_HTML_CLEAN_PRICE);
        const result = await getYuminStockData("https://yumi.market/test");
        expect(result.stock).toBe(150);
        expect(result.price).toBe(13.84);
    });
});
