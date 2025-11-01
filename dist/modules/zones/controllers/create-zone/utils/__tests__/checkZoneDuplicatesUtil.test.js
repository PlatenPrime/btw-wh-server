import { beforeEach, describe, expect, it } from "vitest";
import { Zone } from "../../../../models/Zone.js";
import { checkZoneDuplicatesUtil } from "../checkZoneDuplicatesUtil.js";
describe("checkZoneDuplicatesUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает null если дубликатов нет", async () => {
        const result = await checkZoneDuplicatesUtil({
            title: "60-1",
            bar: 6010,
            sector: 0,
        });
        expect(result).toBeNull();
    });
    it("возвращает дубликат по title", async () => {
        await Zone.create({ title: "61-2", bar: 6120, sector: 0 });
        const result = await checkZoneDuplicatesUtil({
            title: "61-2",
            bar: 99999,
            sector: 0,
        });
        expect(result).toBeTruthy();
        expect(result?.title).toBe("61-2");
    });
    it("возвращает дубликат по bar", async () => {
        await Zone.create({ title: "62-3", bar: 6230, sector: 0 });
        const result = await checkZoneDuplicatesUtil({
            title: "99-99",
            bar: 6230,
            sector: 0,
        });
        expect(result).toBeTruthy();
        expect(result?.bar).toBe(6230);
    });
    it("возвращает дубликат если оба поля совпадают", async () => {
        const existingZone = await Zone.create({
            title: "63-4",
            bar: 6340,
            sector: 0,
        });
        const result = await checkZoneDuplicatesUtil({
            title: "63-4",
            bar: 6340,
            sector: 0,
        });
        expect(result).toBeTruthy();
        expect(result?._id.toString()).toBe(existingZone._id.toString());
    });
});
