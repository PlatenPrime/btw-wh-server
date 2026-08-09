import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPageHtml } from "../../../../utils/fetchPageHtml.js";
import { getGraboSkuData } from "../getGraboSkuData.js";
import { parseGraboSkuHtml } from "../parseGraboSkuHtml.js";
vi.mock("../../../../utils/fetchPageHtml.js");
const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureHtml = readFileSync(join(__dirname, "fixtures", "grabo-sku.html"), "utf-8");
describe("parseGraboSkuHtml", () => {
    it("parses full product page fixture into GraboSkuData", () => {
        const data = parseGraboSkuHtml(fixtureHtml);
        expect(data).toEqual({
            title: "Pink Birthday Bottle mini",
            productId: "G72274",
            isNew: true,
            color: "Gold",
            size: '14" / 13x34 cm',
            material: "Foil Metallized",
            gas: "Air",
            language: "English",
            gasCapacity: "Inflate only with air",
            tag: ["Party", "Girl"],
            images: [
                "https://www.grabo-balloons.com/cm-files/img/products/g72274-pink-birthday-bottle-mini-b.jpg",
                "https://www.grabo-balloons.com/cm-files/img/products/g72274-b10-b.jpg",
            ],
        });
    });
    it("sets isNew false when New badge is absent", () => {
        const html = `
      <article>
        <h1 class="title">Sample</h1>
        <span class="product-code">G1</span>
      </article>
    `;
        expect(parseGraboSkuHtml(html).isNew).toBe(false);
    });
    it("returns empty strings and arrays when attributes and gallery are missing", () => {
        const data = parseGraboSkuHtml("<html><body></body></html>");
        expect(data).toEqual({
            title: "",
            productId: "",
            isNew: false,
            color: "",
            size: "",
            material: "",
            gas: "",
            language: "",
            gasCapacity: "",
            tag: [],
            images: [],
        });
    });
    it("resolves relative gallery href to absolute grabo URL", () => {
        const html = `
      <ul class="product-gallery">
        <li><a href="/cm-files/img/products/g1-b.jpg"><img /></a></li>
      </ul>
    `;
        expect(parseGraboSkuHtml(html).images).toEqual([
            "https://www.grabo-balloons.com/cm-files/img/products/g1-b.jpg",
        ]);
    });
    it("deduplicates identical gallery image urls", () => {
        const html = `
      <ul class="product-gallery">
        <li><a href="/cm-files/img/products/g1-b.jpg"><img /></a></li>
        <li><a href="/cm-files/img/products/g1-b.jpg"><img /></a></li>
      </ul>
    `;
        expect(parseGraboSkuHtml(html).images).toEqual([
            "https://www.grabo-balloons.com/cm-files/img/products/g1-b.jpg",
        ]);
    });
});
describe("getGraboSkuData", () => {
    beforeEach(() => {
        vi.mocked(fetchPageHtml).mockReset();
    });
    it("fetches page html and returns parsed GraboSkuData", async () => {
        vi.mocked(fetchPageHtml).mockResolvedValue(fixtureHtml);
        const link = "https://www.grabo-balloons.com/en/g72274-balloon-pink-birthday-bottle-mini-gold";
        const data = await getGraboSkuData(link);
        expect(fetchPageHtml).toHaveBeenCalledWith(link, { konkName: "grabo" });
        expect(data.productId).toBe("G72274");
        expect(data.title).toBe("Pink Birthday Bottle mini");
    });
    it("trims link before fetch", async () => {
        vi.mocked(fetchPageHtml).mockResolvedValue("<html></html>");
        await getGraboSkuData("  https://www.grabo-balloons.com/en/x  ");
        expect(fetchPageHtml).toHaveBeenCalledWith("https://www.grabo-balloons.com/en/x", { konkName: "grabo" });
    });
    it("throws when link is empty or not a string", async () => {
        await expect(getGraboSkuData("")).rejects.toThrow("Link is required and must be a string");
        await expect(getGraboSkuData(null)).rejects.toThrow("Link is required and must be a string");
        await expect(getGraboSkuData(undefined)).rejects.toThrow("Link is required and must be a string");
        await expect(getGraboSkuData(123)).rejects.toThrow("Link is required and must be a string");
    });
    it("propagates fetchPageHtml rejection", async () => {
        vi.mocked(fetchPageHtml).mockRejectedValue(new Error("Network error"));
        await expect(getGraboSkuData("https://www.grabo-balloons.com/en/x")).rejects.toThrow("Network error");
    });
});
