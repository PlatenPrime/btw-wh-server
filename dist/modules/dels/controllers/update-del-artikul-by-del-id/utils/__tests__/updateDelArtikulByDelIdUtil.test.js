import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharikStockData } from "../../../../../browser/sharik/utils/getSharikStockData.js";
import { Del } from "../../../../models/Del.js";
import { updateDelArtikulByDelIdUtil } from "../updateDelArtikulByDelIdUtil.js";
vi.mock("../../../../../browser/sharik/utils/getSharikStockData.js");
describe("updateDelArtikulByDelIdUtil", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        await Del.deleteMany({});
    });
    it("returns null when del not found", async () => {
        const result = await updateDelArtikulByDelIdUtil({
            delId: "000000000000000000000000",
            artikul: "ART-1",
        });
        expect(result).toBeNull();
        expect(getSharikStockData).not.toHaveBeenCalled();
    });
    it("returns null when sharik returns null and updates nothing", async () => {
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: { "ART-1": { quant: 5 } },
        });
        vi.mocked(getSharikStockData).mockResolvedValue(null);
        const result = await updateDelArtikulByDelIdUtil({
            delId: del._id.toString(),
            artikul: "ART-1",
        });
        expect(result).toBeNull();
        expect(getSharikStockData).toHaveBeenCalledWith("ART-1");
        const found = await Del.findById(del._id);
        expect((found?.artikuls)["ART-1"])
            .toMatchObject({ quant: 5 });
    });
    it("updates stock from sharik and preserves quant", async () => {
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: { "ART-1": { quant: 5 } },
        });
        vi.mocked(getSharikStockData).mockResolvedValue({
            nameukr: "Товар",
            price: 100,
            quantity: 42,
        });
        const result = await updateDelArtikulByDelIdUtil({
            delId: del._id.toString(),
            artikul: "ART-1",
        });
        expect(result).toBeTruthy();
        const artikuls = result?.toObject().artikuls ?? {};
        expect(artikuls["ART-1"]).toEqual({
            quant: 5,
            stock: 42,
            nameukr: "Товар",
        });
    });
    it("adds new artikul with quant 0 and stock from sharik", async () => {
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: {},
        });
        vi.mocked(getSharikStockData).mockResolvedValue({
            nameukr: "Товар",
            price: 50,
            quantity: 7,
        });
        const result = await updateDelArtikulByDelIdUtil({
            delId: del._id.toString(),
            artikul: "NEW-ART",
        });
        expect(result).toBeTruthy();
        const artikuls = result?.toObject().artikuls ?? {};
        expect(artikuls["NEW-ART"]).toEqual({
            quant: 0,
            stock: 7,
            nameukr: "Товар",
        });
    });
});
