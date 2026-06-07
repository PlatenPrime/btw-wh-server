import { beforeEach, describe, expect, it } from "vitest";
import { Kask } from "../../../../models/Kask.js";
import { getKasksByDateUtil } from "../getKasksByDateUtil.js";
describe("getKasksByDateUtil", () => {
    beforeEach(async () => {
        await Kask.deleteMany({});
    });
    it("returns kasks created on the given date", async () => {
        await Kask.create({
            artikul: "1111-1111",
            nameukr: "First",
            zone: "A1",
            createdAt: new Date("2025-02-02T03:00:00.000Z"),
        });
        await Kask.create({
            artikul: "2222-2222",
            nameukr: "Second",
            zone: "A2",
            createdAt: new Date("2025-02-02T15:30:00.000Z"),
        });
        await Kask.create({
            artikul: "3333-3333",
            nameukr: "Other day",
            zone: "B1",
            createdAt: new Date("2025-02-03T00:00:00.000Z"),
        });
        const result = await getKasksByDateUtil("2025-02-02");
        expect(result).toHaveLength(2);
        expect(result.map((k) => k.artikul)).toEqual(expect.arrayContaining(["1111-1111", "2222-2222"]));
    });
    it("returns empty array when no kasks on date", async () => {
        await Kask.create({
            artikul: "1111-1111",
            nameukr: "First",
            zone: "A1",
            createdAt: new Date("2025-02-01T12:00:00.000Z"),
        });
        const result = await getKasksByDateUtil("2025-02-02");
        expect(result).toEqual([]);
    });
    it("sorts results by createdAt descending", async () => {
        await Kask.create({
            artikul: "early",
            nameukr: "Early",
            zone: "A1",
            createdAt: new Date("2025-02-02T08:00:00.000Z"),
        });
        await Kask.create({
            artikul: "late",
            nameukr: "Late",
            zone: "A1",
            createdAt: new Date("2025-02-02T20:00:00.000Z"),
        });
        const result = await getKasksByDateUtil("2025-02-02");
        expect(result[0].artikul).toBe("late");
        expect(result[1].artikul).toBe("early");
    });
});
