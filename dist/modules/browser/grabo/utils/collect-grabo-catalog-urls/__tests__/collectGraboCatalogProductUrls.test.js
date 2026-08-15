import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPageHtml } from "../../../../utils/fetchPageHtml.js";
import { sleep } from "../../../../utils/sleep.js";
import { getGraboListingProducts } from "../../get-grabo-listing-products/getGraboListingProducts.js";
import { GRABO_SITEMAP_URL } from "../../types/graboSkuData.js";
import { collectGraboCatalogProductUrls } from "../collectGraboCatalogProductUrls.js";
const mockLogger = vi.hoisted(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
}));
vi.mock("../../../../../../logging/createLogger.js", () => ({
    createLogger: () => mockLogger,
}));
vi.mock("../../../../utils/fetchPageHtml.js");
vi.mock("../../../../utils/sleep.js", () => ({
    sleep: vi.fn(() => Promise.resolve()),
}));
vi.mock("../../get-grabo-listing-products/getGraboListingProducts.js", () => ({
    getGraboListingProducts: vi.fn(),
}));
const CAT_A = "https://www.grabo-balloons.com/en/party";
const CAT_B = "https://www.grabo-balloons.com/en/non-message";
const PRODUCT_A = "https://www.grabo-balloons.com/en/g1-balloon-a";
const PRODUCT_B = "https://www.grabo-balloons.com/en/g2-balloon-b";
function sitemapWithCategories(urls) {
    const items = urls
        .map((url) => `<li><a href="${url}">cat</a></li>`)
        .join("");
    return `<div class="site-map"><ul class="level-0"><li class="nav900"><a>Products</a><ul class="level-1">${items}</ul></li></ul></div>`;
}
describe("collectGraboCatalogProductUrls", () => {
    beforeEach(() => {
        vi.mocked(fetchPageHtml).mockReset();
        vi.mocked(getGraboListingProducts).mockReset();
        vi.mocked(sleep).mockClear();
        mockLogger.info.mockClear();
        mockLogger.warn.mockClear();
    });
    it("collects unique product urls across categories", async () => {
        vi.mocked(fetchPageHtml).mockResolvedValue(sitemapWithCategories([CAT_A, CAT_B]));
        vi.mocked(getGraboListingProducts)
            .mockResolvedValueOnce([PRODUCT_A, PRODUCT_B])
            .mockResolvedValueOnce([PRODUCT_B]);
        const result = await collectGraboCatalogProductUrls({
            delayBetweenCategoriesMs: 5,
            delayBeforeNextMs: 3,
            maxPages: 4,
        });
        expect(fetchPageHtml).toHaveBeenCalledWith(GRABO_SITEMAP_URL, {
            konkName: "grabo",
        });
        expect(getGraboListingProducts).toHaveBeenNthCalledWith(1, { groupUrl: CAT_A, maxPages: 4 }, expect.objectContaining({ delayBeforeNextMs: 3 }));
        expect(result.productUrls).toEqual([PRODUCT_A, PRODUCT_B]);
        expect(result.failedCategoryUrls).toEqual([]);
        expect(sleep).toHaveBeenCalledWith(5);
        expect(mockLogger.info).toHaveBeenCalledWith({ sitemapUrl: GRABO_SITEMAP_URL, categoryCount: 2 }, "grabo catalog sitemap parsed");
        expect(mockLogger.info).toHaveBeenCalledWith(expect.objectContaining({
            index: 1,
            total: 2,
            categoryUrl: CAT_A,
            listed: 2,
            uniqueTotal: 2,
        }), "grabo catalog category done");
    });
    it("records failed categories and keeps urls from successful ones", async () => {
        vi.mocked(fetchPageHtml).mockResolvedValue(sitemapWithCategories([CAT_A, CAT_B]));
        vi.mocked(getGraboListingProducts)
            .mockRejectedValueOnce(new Error("boom"))
            .mockResolvedValueOnce([PRODUCT_A]);
        const result = await collectGraboCatalogProductUrls();
        expect(result.failedCategoryUrls).toEqual([CAT_A]);
        expect(result.productUrls).toEqual([PRODUCT_A]);
        expect(mockLogger.warn).toHaveBeenCalledWith(expect.objectContaining({
            categoryUrl: CAT_A,
            details: "boom",
        }), "grabo catalog category failed");
    });
    it("rethrows sitemap fetch errors", async () => {
        vi.mocked(fetchPageHtml).mockRejectedValue(new Error("sitemap down"));
        await expect(collectGraboCatalogProductUrls()).rejects.toThrow("sitemap down");
    });
    it("uses injected getHtml and function delays between categories", async () => {
        const getHtml = vi.fn().mockResolvedValue(sitemapWithCategories([CAT_A, CAT_B]));
        vi.mocked(getGraboListingProducts).mockResolvedValue([PRODUCT_A]);
        const result = await collectGraboCatalogProductUrls({
            getHtml,
            delayBetweenCategoriesMs: () => 9,
        });
        expect(getHtml).toHaveBeenCalledWith(GRABO_SITEMAP_URL);
        expect(fetchPageHtml).not.toHaveBeenCalled();
        expect(sleep).toHaveBeenCalledWith(9);
        expect(result.categoryUrls).toEqual([CAT_A, CAT_B]);
    });
});
