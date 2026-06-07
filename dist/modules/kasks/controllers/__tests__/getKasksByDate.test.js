import { beforeEach, describe, expect, it } from "vitest";
import { Kask } from "../../models/Kask.js";
import { getKasksByDate } from "../get-kasks-by-date/getKasksByDate.js";
describe("getKasksByDate", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Kask.deleteMany({});
        responseJson = {};
        responseStatus = {};
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            },
            headersSent: false,
        };
    });
    it("200 returns kasks for selected date", async () => {
        await Kask.create({
            artikul: "1111-1111",
            nameukr: "First",
            zone: "A1",
            createdAt: new Date("2025-02-02T10:00:00.000Z"),
        });
        await Kask.create({
            artikul: "2222-2222",
            nameukr: "Second",
            zone: "A2",
            createdAt: new Date("2025-02-02T18:00:00.000Z"),
        });
        await Kask.create({
            artikul: "3333-3333",
            nameukr: "Other",
            zone: "B1",
            createdAt: new Date("2025-02-03T00:00:00.000Z"),
        });
        const req = { query: { date: "2025-02-02" } };
        await getKasksByDate(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Kasks retrieved successfully");
        expect(responseJson.count).toBe(2);
        expect(Array.isArray(responseJson.data)).toBe(true);
    });
    it("400 when date invalid", async () => {
        const req = { query: { date: "not-a-date" } };
        await getKasksByDate(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("200 returns empty list when no kasks on date", async () => {
        const req = { query: { date: "2025-02-02" } };
        await getKasksByDate(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.count).toBe(0);
        expect(responseJson.data).toEqual([]);
    });
});
