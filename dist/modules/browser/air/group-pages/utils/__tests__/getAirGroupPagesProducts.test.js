import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAirGroupPagesProducts } from "../getAirGroupPagesProducts.js";
import { browserGet } from "../../../../utils/browserRequest.js";
import { sleep } from "../../../../utils/sleep.js";
vi.mock("../../../../utils/browserRequest.js");
vi.mock("../../../../utils/sleep.js");
const GROUP_URL = "https://air.example.test/ua/index.php?route=product/category&path=1";
const PAGE2_URL = "https://air.example.test/ua/index.php?route=product/category&path=1&page=2";
function airProductCard(opts) {
    return `<div class="product-layout product-grid" data-pid="${opts.pid}">
    <div class="us-module-img">
      <a href="${opts.productPath}">
        <img src="${opts.imageUrl}" alt="" />
      </a>
    </div>
    <div class="us-module-title">
      <a href="${opts.productPath}">${opts.title}</a>
    </div>
  </div>`;
}
function airPageHtml(opts) {
    const next = opts.nextHref != null
        ? `<link rel="next" href="${opts.nextHref}" />`
        : "";
    const grid = opts.cards.length > 0
        ? opts.cards.join("")
        : opts.emptyMessage != null
            ? `<p>${opts.emptyMessage}</p>`
            : "";
    return `<!DOCTYPE html><html><head>${next}</head><body>
<div class="row us-category-products">${grid}</div>
</body></html>`;
}
describe("getAirGroupPagesProducts", () => {
    beforeEach(() => {
        vi.mocked(browserGet).mockReset();
        vi.mocked(sleep).mockResolvedValue(undefined);
    });
    it("parses products across two pages", async () => {
        const html1 = airPageHtml({
            cards: [
                airProductCard({
                    pid: "111",
                    productPath: "/ua/product/p111",
                    imageUrl: "https://air.example.test/image/cache/a.jpg",
                    title: "Balloon &#34;10&quot;",
                }),
            ],
            nextHref: PAGE2_URL,
        });
        const html2 = airPageHtml({
            cards: [
                airProductCard({
                    pid: "222",
                    productPath: "/ua/product/p222",
                    imageUrl: "https://air.example.test/image/cache/b.jpg",
                    title: "Other",
                }),
            ],
        });
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === GROUP_URL)
                return html1;
            if (url === PAGE2_URL)
                return html2;
            throw new Error(`Unexpected url: ${url}`);
        });
        const result = await getAirGroupPagesProducts({
            groupUrl: GROUP_URL,
            maxPages: 2,
        });
        expect(result).toHaveLength(2);
        const p1 = result.find((p) => p.productId === "111");
        expect(p1?.url).toBe("https://air.example.test/ua/product/p111");
        expect(p1?.title).not.toContain("&#");
        expect(p1?.title).toContain("10");
        const p2 = result.find((p) => p.productId === "222");
        expect(p2?.url).toBe("https://air.example.test/ua/product/p222");
    });
    it("stops when a later page has no product cards (no Ukrainian text needed)", async () => {
        const html1 = airPageHtml({
            cards: [
                airProductCard({
                    pid: "1",
                    productPath: "/ua/product/a",
                    imageUrl: "https://air.example.test/a.jpg",
                    title: "Only first page",
                }),
            ],
            nextHref: PAGE2_URL,
        });
        const html2 = airPageHtml({ cards: [] });
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === GROUP_URL)
                return html1;
            if (url === PAGE2_URL)
                return html2;
            throw new Error(`Unexpected url: ${url}`);
        });
        const result = await getAirGroupPagesProducts({
            groupUrl: GROUP_URL,
            maxPages: 5,
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.productId).toBe("1");
        expect(vi.mocked(browserGet)).toHaveBeenCalledTimes(2);
    });
    it("regression: empty grid with Ukrainian message still stops", async () => {
        const html1 = airPageHtml({
            cards: [
                airProductCard({
                    pid: "1",
                    productPath: "/ua/product/a",
                    imageUrl: "https://air.example.test/a.jpg",
                    title: "A",
                }),
            ],
            nextHref: PAGE2_URL,
        });
        const html2 = airPageHtml({
            cards: [],
            emptyMessage: "У даній категорії немає товарів.",
        });
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === GROUP_URL)
                return html1;
            if (url === PAGE2_URL)
                return html2;
            throw new Error(`Unexpected url: ${url}`);
        });
        const result = await getAirGroupPagesProducts({
            groupUrl: GROUP_URL,
            maxPages: 5,
        });
        expect(result).toHaveLength(1);
    });
    it("uses data-srcset when src is lazy placeholder", async () => {
        const real = "https://air.example.test/image/cache/catalog/x-228x228.jpg";
        const html = airPageHtml({
            cards: [
                airProductCard({
                    pid: "9",
                    productPath: "/ua/product/z",
                    imageUrl: "https://air.example.test/image/catalog/1lazy/lazy-image.svg",
                    title: "Z",
                }).replace(`src="https://air.example.test/image/catalog/1lazy/lazy-image.svg"`, `src="https://air.example.test/image/catalog/1lazy/lazy-image.svg" data-srcset="${real} 100w"`),
            ],
        });
        vi.mocked(browserGet).mockResolvedValue(html);
        const result = await getAirGroupPagesProducts({
            groupUrl: GROUP_URL,
            maxPages: 1,
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.imageUrl).toBe(real);
    });
});
