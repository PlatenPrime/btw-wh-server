import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { Del } from "../../../../models/Del.js";
import { createDelUtil } from "../createDelUtil.js";
describe("createDelUtil", () => {
    beforeEach(async () => {
        await Del.deleteMany({});
        await Art.deleteMany({});
    });
    it("creates del with title and empty artikuls", async () => {
        const result = await createDelUtil({
            title: "New delivery",
            artikuls: {},
        });
        expect(result._id).toBeDefined();
        expect(result.title).toBe("New delivery");
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
        const found = await Del.findById(result._id);
        expect(found?.title).toBe("New delivery");
    });
    it("creates del with title and artikuls and fills nameukr from arts", async () => {
        await Art.create([
            { artikul: "A1", zone: "Z1", nameukr: "Товар A1" },
            { artikul: "A2", zone: "Z1" },
        ]);
        const result = await createDelUtil({
            title: "With artikuls",
            artikuls: { A1: 1, A2: 2 },
        });
        const artikuls = result.artikuls;
        expect(artikuls["A1"]).toEqual({ quantity: 1, nameukr: "Товар A1" });
        expect(artikuls["A2"]).toEqual({ quantity: 2 });
    });
});
