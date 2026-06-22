import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharikStockData } from "../../../../../browser/sharik/utils/getSharikStockData.js";
import { Del } from "../../../../models/Del.js";
import { updateDelArtikulsByDelIdUtil } from "../updateDelArtikulsByDelIdUtil.js";
vi.mock("../../../../../browser/sharik/utils/getSharikStockData.js");
describe("updateDelArtikulsByDelIdUtil", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        await Del.deleteMany({});
    });
    it("throws when del not found", async () => {
        await expect(updateDelArtikulsByDelIdUtil("000000000000000000000000")).rejects.toThrow("Del not found");
    });
    it("updates stock for all artikuls from sharik and preserves quant", async () => {
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: { A1: { quant: 3 }, A2: { quant: 7 } },
        });
        vi.mocked(getSharikStockData)
            .mockResolvedValueOnce({ nameukr: "Name1", price: 0, quantity: 10 })
            .mockResolvedValueOnce({ nameukr: "Name2", price: 0, quantity: 20 });
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
    it("counts notFound when sharik returns null and keeps previous stock", async () => {
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: {
                A1: { quant: 1, stock: 5 },
                A2: { quant: 2, stock: 8 },
            },
        });
        vi.mocked(getSharikStockData)
            .mockResolvedValueOnce({ nameukr: "", price: 0, quantity: 10 })
            .mockResolvedValueOnce(null);
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
