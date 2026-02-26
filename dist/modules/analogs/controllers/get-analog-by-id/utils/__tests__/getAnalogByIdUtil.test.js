import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../../konks/models/Konk.js";
import { Prod } from "../../../../../prods/models/Prod.js";
import { Analog } from "../../../../models/Analog.js";
import { getAnalogByIdUtil } from "../getAnalogByIdUtil.js";
describe("getAnalogByIdUtil", () => {
    beforeEach(async () => {
        await Analog.deleteMany({});
        await Konk.deleteMany({});
        await Prod.deleteMany({});
    });
    it("returns null for non-existent id", async () => {
        const result = await getAnalogByIdUtil("000000000000000000000000");
        expect(result).toBeNull();
    });
    it("returns enriched analog with konk and prod when both exist", async () => {
        const konk = await Konk.create({
            name: "acme",
            title: "Acme Corp",
            url: "https://acme.com",
            imageUrl: "https://acme.com/logo.png",
        });
        const prod = await Prod.create({
            name: "maker",
            title: "Maker Inc",
            imageUrl: "https://maker.com/logo.png",
        });
        const analog = await Analog.create({
            konkName: "acme",
            prodName: "maker",
            url: "https://example.com/p",
        });
        const result = await getAnalogByIdUtil(analog._id.toString());
        expect(result).toBeTruthy();
        expect(result?.konk).toEqual({
            id: konk._id.toString(),
            name: "acme",
            title: "Acme Corp",
            imageUrl: "https://acme.com/logo.png",
        });
        expect(result?.prod).toEqual({
            id: prod._id.toString(),
            name: "maker",
            title: "Maker Inc",
            imageUrl: "https://maker.com/logo.png",
        });
    });
    it("returns empty konk and prod when Konk/Prod not found", async () => {
        const analog = await Analog.create({
            konkName: "nonexistent",
            prodName: "nonexistent2",
            url: "https://example.com/p",
        });
        const result = await getAnalogByIdUtil(analog._id.toString());
        expect(result).toBeTruthy();
        expect(result?.konk).toEqual({
            id: "",
            name: "",
            title: "",
            imageUrl: "",
        });
        expect(result?.prod).toEqual({
            id: "",
            name: "",
            title: "",
            imageUrl: "",
        });
    });
});
