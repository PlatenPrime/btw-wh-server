import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestArt } from "../../../../../../test/setup.js";
import { getCachedSharikProductRestsMap } from "../../../../../browser/sharik/utils/product-rests/index.js";
import { Del } from "../../../../models/Del.js";
import { updateDelArtikulsByDelIdUtil } from "../updateDelArtikulsByDelIdUtil.js";
vi.mock("../../../../../browser/sharik/utils/product-rests/index.js", () => ({
    getCachedSharikProductRestsMap: vi.fn(),
}));
describe("updateDelArtikulsByDelIdUtil", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        await Del.deleteMany({});
    });
    it("throws when del not found", async () => {
        await expect(updateDelArtikulsByDelIdUtil("000000000000000000000000")).rejects.toThrow("Del not found");
    });
    it("updates stock from actualQuantity and nameukr from Art", async () => {
        await createTestArt({ artikul: "A1", zone: "A1", nameukr: "Name1" });
        await createTestArt({ artikul: "A2", zone: "A1", nameukr: "Name2" });
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: { A1: { quant: 3 }, A2: { quant: 7 } },
        });
        vi.mocked(getCachedSharikProductRestsMap).mockResolvedValue(new Map([
            ["A1", { actualQuantity: 10, sliceQuantity: 11, price: 0 }],
            ["A2", { actualQuantity: 20, sliceQuantity: 21, price: 0 }],
        ]));
        const result = await updateDelArtikulsByDelIdUtil(del._id.toString());
        expect(result).toEqual({
            total: 2,
            updated: 2,
            errors: 0,
            notFound: 0,
        });
        const found = await Del.findById(del._id);
        const a = found?.artikuls;
        expect(a["A1"]).toEqual({ quant: 3, stock: 10, nameukr: "Name1" });
        expect(a["A2"]).toEqual({ quant: 7, stock: 20, nameukr: "Name2" });
    });
    it("counts notFound when artikul missing in map and keeps previous stock", async () => {
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: {
                A1: { quant: 1, stock: 5 },
                A2: { quant: 2, stock: 8 },
            },
        });
        vi.mocked(getCachedSharikProductRestsMap).mockResolvedValue(new Map([["A1", { actualQuantity: 10, sliceQuantity: 10, price: 0 }]]));
        const result = await updateDelArtikulsByDelIdUtil(del._id.toString());
        expect(result.total).toBe(2);
        expect(result.updated).toBe(1);
        expect(result.notFound).toBe(1);
        const found = await Del.findById(del._id);
        const a = found?.artikuls;
        expect(a["A1"].stock).toBe(10);
        expect(a["A2"].stock).toBe(8);
    });
});
