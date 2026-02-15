import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharikData } from "../../../../../comps/utils/getSharikData.js";
import { Del } from "../../../../models/Del.js";
import { updateDelArtikulByDelIdUtil } from "../updateDelArtikulByDelIdUtil.js";
vi.mock("../../../../../comps/utils/getSharikData.js");
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
        expect(getSharikData).not.toHaveBeenCalled();
    });
    it("returns null when sharik returns null and updates nothing", async () => {
        const del = await Del.create({
            title: "Del",
            artikuls: { "ART-1": 0 },
        });
        vi.mocked(getSharikData).mockResolvedValue(null);
        const result = await updateDelArtikulByDelIdUtil({
            delId: del._id.toString(),
            artikul: "ART-1",
        });
        expect(result).toBeNull();
        expect(getSharikData).toHaveBeenCalledWith("ART-1");
        const found = await Del.findById(del._id);
        expect((found?.artikuls)["ART-1"]).toBe(0);
    });
    it("updates artikul value from sharik data", async () => {
        const del = await Del.create({
            title: "Del",
            artikuls: { "ART-1": 0 },
        });
        vi.mocked(getSharikData).mockResolvedValue({
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
        expect(artikuls["ART-1"]).toBe(42);
    });
    it("adds new artikul key when not present", async () => {
        const del = await Del.create({
            title: "Del",
            artikuls: {},
        });
        vi.mocked(getSharikData).mockResolvedValue({
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
        expect(artikuls["NEW-ART"]).toBe(7);
    });
});
