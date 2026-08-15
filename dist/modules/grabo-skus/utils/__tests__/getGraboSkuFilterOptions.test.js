import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GraboSku } from "../../models/GraboSku.js";
import { getGraboSkuFilterOptions } from "../getGraboSkuFilterOptions.js";
function graboSkuDoc(overrides = {}) {
    const productId = overrides.productId ?? "G00001";
    return {
        title: "Title",
        productId,
        url: `https://www.grabo-balloons.com/en/${productId.toLowerCase()}`,
        lastSeenAt: new Date("2026-08-15T00:00:00.000Z"),
        ...overrides,
    };
}
describe("getGraboSkuFilterOptions", () => {
    beforeEach(async () => {
        await GraboSku.deleteMany({});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it("returns empty arrays when collection is empty", async () => {
        await expect(getGraboSkuFilterOptions()).resolves.toEqual({
            color: [],
            size: [],
            material: [],
            gas: [],
            language: [],
        });
    });
    it("returns unique sorted values from the whole collection and drops empties", async () => {
        await GraboSku.create(graboSkuDoc({
            productId: "G1",
            color: "Pink",
            size: '40" / 62x91x25 cm',
            material: "Foil",
            gas: "Helium",
            language: "EN",
        }));
        await GraboSku.create(graboSkuDoc({
            productId: "G2",
            color: "Blue",
            size: '40" / other cm',
            material: "",
            gas: "Air",
            language: "IT",
        }));
        await GraboSku.create(graboSkuDoc({
            productId: "G3",
            color: "",
            size: "",
            material: "Latex",
            gas: "",
            language: "",
        }));
        const options = await getGraboSkuFilterOptions();
        expect(options.color).toEqual(["Blue", "Pink"]);
        expect(options.size).toEqual(['40"']);
        expect(options.material).toEqual(["Foil", "Latex"]);
        expect(options.gas).toEqual(["Air", "Helium"]);
        expect(options.language).toEqual(["EN", "IT"]);
    });
    it("collapses distinct size strings to unique prefixes and sorts them", async () => {
        await GraboSku.create(graboSkuDoc({
            productId: "G14",
            size: '14" / 13x34 cm',
        }));
        await GraboSku.create(graboSkuDoc({
            productId: "G18",
            size: '18"',
        }));
        const options = await getGraboSkuFilterOptions();
        expect(options.size).toEqual(['14"', '18"']);
    });
    it("ignores non-string distinct values and slash-only sizes", async () => {
        vi.spyOn(GraboSku, "distinct").mockImplementation(((field) => {
            if (field === "size") {
                return Promise.resolve([14, " / cm", '40" / a']);
            }
            return Promise.resolve(["  Pink  ", 1, ""]);
        }));
        const options = await getGraboSkuFilterOptions();
        expect(options).toEqual({
            color: ["Pink"],
            size: ['40"'],
            material: ["Pink"],
            gas: ["Pink"],
            language: ["Pink"],
        });
    });
});
