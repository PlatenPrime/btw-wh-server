import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharikData } from "../../../../../comps/utils/getSharikData.js";
import { Del } from "../../../../models/Del.js";
import { updateDelArtikulsByDelIdUtil } from "../updateDelArtikulsByDelIdUtil.js";
vi.mock("../../../../../comps/utils/getSharikData.js");
describe("updateDelArtikulsByDelIdUtil", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        await Del.deleteMany({});
    });
    it("throws when del not found", async () => {
        await expect(updateDelArtikulsByDelIdUtil("000000000000000000000000")).rejects.toThrow("Del not found");
    });
    it("updates all artikuls from sharik and returns stats", async () => {
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            artikuls: { A1: { quantity: 0 }, A2: { quantity: 0 } },
        });
        vi.mocked(getSharikData)
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
        expect(a["A1"]).toEqual({ quantity: 10, nameukr: "Name1" });
        expect(a["A2"]).toEqual({ quantity: 20, nameukr: "Name2" });
    });
    it("counts notFound when sharik returns null for one", async () => {
        const del = await Del.create({
            title: "Del",
            prodName: "prod1",
            artikuls: { A1: { quantity: 0 }, A2: { quantity: 0 } },
        });
        vi.mocked(getSharikData)
            .mockResolvedValueOnce({ nameukr: "", price: 0, quantity: 10 })
            .mockResolvedValueOnce(null);
        const result = await updateDelArtikulsByDelIdUtil(del._id.toString());
        expect(result.total).toBe(2);
        expect(result.updated).toBe(1);
        expect(result.notFound).toBe(1);
    });
});
