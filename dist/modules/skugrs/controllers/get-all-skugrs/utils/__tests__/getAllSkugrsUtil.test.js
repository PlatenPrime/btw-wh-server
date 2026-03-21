import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../models/Skugr.js";
import { getAllSkugrsUtil } from "../getAllSkugrsUtil.js";
describe("getAllSkugrsUtil", () => {
    beforeEach(async () => {
        await Skugr.deleteMany({});
    });
    it("filters by konkName, prodName and search on title", async () => {
        await Skugr.create({
            konkName: "ka",
            prodName: "pa",
            title: "Alpha group",
            url: "https://a.com/1",
            skus: [],
        });
        await Skugr.create({
            konkName: "kb",
            prodName: "pb",
            title: "Beta group",
            url: "https://b.com/1",
            skus: [],
        });
        const byKonk = await getAllSkugrsUtil({
            konkName: "ka",
            prodName: undefined,
            search: undefined,
            page: 1,
            limit: 10,
        });
        expect(byKonk.skugrs).toHaveLength(1);
        expect(byKonk.skugrs[0].title).toBe("Alpha group");
        const bySearch = await getAllSkugrsUtil({
            konkName: undefined,
            prodName: undefined,
            search: "beta",
            page: 1,
            limit: 10,
        });
        expect(bySearch.skugrs).toHaveLength(1);
        expect(bySearch.skugrs[0].konkName).toBe("kb");
    });
});
