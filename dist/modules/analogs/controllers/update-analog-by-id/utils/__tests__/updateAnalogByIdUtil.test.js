import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { Analog } from "../../../../models/Analog.js";
import { updateAnalogByIdUtil } from "../updateAnalogByIdUtil.js";
describe("updateAnalogByIdUtil", () => {
    beforeEach(async () => {
        await Analog.deleteMany({});
        await Art.deleteMany({});
    });
    it("returns null for non-existent id", async () => {
        const result = await updateAnalogByIdUtil({
            id: "000000000000000000000000",
            title: "New title",
        });
        expect(result).toBeNull();
    });
    it("updates title and returns updated analog", async () => {
        const analog = await Analog.create({
            konkName: "k",
            prodName: "p",
            url: "https://x.com",
            title: "Old",
        });
        const result = await updateAnalogByIdUtil({
            id: analog._id.toString(),
            title: "New title",
        });
        expect(result?.title).toBe("New title");
        const found = await Analog.findById(analog._id);
        expect(found?.title).toBe("New title");
    });
    it("updates artikul and pulls nameukr from Art", async () => {
        await Art.create({
            artikul: "ART-UP",
            nameukr: "Назва з Art",
            zone: "A1",
        });
        const analog = await Analog.create({
            konkName: "k",
            prodName: "p",
            url: "https://x.com",
        });
        const result = await updateAnalogByIdUtil({
            id: analog._id.toString(),
            artikul: "ART-UP",
        });
        expect(result?.artikul).toBe("ART-UP");
        expect(result?.nameukr).toBe("Назва з Art");
    });
    it("returns same doc when no update fields (only id)", async () => {
        const analog = await Analog.create({
            konkName: "k",
            prodName: "p",
            url: "https://x.com",
        });
        const result = await updateAnalogByIdUtil({
            id: analog._id.toString(),
        });
        expect(result?._id.toString()).toBe(analog._id.toString());
    });
});
