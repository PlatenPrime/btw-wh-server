import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { Del } from "../../../../models/Del.js";
import { Prod } from "../../../../../prods/models/Prod.js";
import { createDelUtil } from "../createDelUtil.js";
describe("createDelUtil", () => {
    beforeEach(async () => {
        await Del.deleteMany({});
        await Art.deleteMany({});
        await Prod.deleteMany({});
    });
    it("creates del with title, prodName and empty artikuls", async () => {
        await Prod.create({
            name: "acme",
            title: "Acme",
            imageUrl: "https://example.com/acme.png",
        });
        const result = await createDelUtil({
            title: "New delivery",
            prodName: "acme",
            artikuls: {},
        });
        if ("error" in result)
            throw new Error("Expected del, got error");
        expect(result._id).toBeDefined();
        expect(result.title).toBe("New delivery");
        expect(result.prodName).toBe("acme");
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
        const found = await Del.findById(result._id);
        expect(found?.title).toBe("New delivery");
        expect(found?.prodName).toBe("acme");
    });
    it("creates del with title, prodName and artikuls and fills nameukr from arts", async () => {
        await Prod.create({
            name: "acme",
            title: "Acme",
            imageUrl: "https://example.com/acme.png",
        });
        await Art.create([
            { artikul: "A1", zone: "Z1", nameukr: "Товар A1" },
            { artikul: "A2", zone: "Z1" },
        ]);
        const result = await createDelUtil({
            title: "With artikuls",
            prodName: "acme",
            artikuls: { A1: 1, A2: 2 },
        });
        if ("error" in result)
            throw new Error("Expected del, got error");
        const artikuls = result.artikuls;
        expect(artikuls["A1"]).toEqual({ quantity: 1, nameukr: "Товар A1" });
        expect(artikuls["A2"]).toEqual({ quantity: 2 });
    });
    it("returns error when prodName does not exist in Prod", async () => {
        const result = await createDelUtil({
            title: "New delivery",
            prodName: "nonexistent",
            artikuls: {},
        });
        expect("error" in result).toBe(true);
        if (!("error" in result))
            return;
        expect(result.error).toBe("PROD_NOT_FOUND");
    });
});
