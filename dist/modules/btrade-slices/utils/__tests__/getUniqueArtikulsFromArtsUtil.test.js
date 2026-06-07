import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { Art } from "../../../arts/models/Art.js";
import { getUniqueArtikulsFromArtsUtil } from "../getUniqueArtikulsFromArtsUtil.js";
describe("getUniqueArtikulsFromArtsUtil", () => {
    beforeEach(async () => {
        await Art.deleteMany({});
    });
    it("returns unique non-empty artikuls from arts", async () => {
        await Art.create([
            {
                artikul: "ART-1",
                nameukr: "A",
                namerus: "A",
                zone: "Z1",
                limit: 1,
                abc: "A",
            },
            {
                artikul: "ART-2",
                nameukr: "B",
                namerus: "B",
                zone: "Z1",
                limit: 1,
                abc: "A",
            },
            {
                artikul: "ART-3",
                nameukr: "C",
                namerus: "C",
                zone: "Z1",
                limit: 1,
                abc: "A",
            },
        ]);
        const result = await getUniqueArtikulsFromArtsUtil();
        expect(result.sort()).toEqual(["ART-1", "ART-2", "ART-3"]);
    });
    it("returns empty array when no arts exist", async () => {
        const result = await getUniqueArtikulsFromArtsUtil();
        expect(result).toEqual([]);
    });
});
