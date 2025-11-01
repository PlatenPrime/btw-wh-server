import { beforeEach, describe, expect, it } from "vitest";
import { Zone } from "../../../../models/Zone.js";
import { updateZoneByIdUtil } from "../updateZoneByIdUtil.js";
describe("updateZoneByIdUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("обновляет title зоны и возвращает обновлённый документ", async () => {
        const zone = await Zone.create({ title: "100-1", bar: 10010, sector: 0 });
        const result = await updateZoneByIdUtil({
            id: zone._id.toString(),
            updateData: { title: "100-2" },
        });
        expect(result).toBeTruthy();
        expect(result?._id.toString()).toBe(zone._id.toString());
        expect(result?.title).toBe("100-2");
        const found = await Zone.findById(zone._id);
        expect(found?.title).toBe("100-2");
    });
    it("возвращает null если зона не найдена", async () => {
        const nonExistentId = "000000000000000000000000";
        const result = await updateZoneByIdUtil({
            id: nonExistentId,
            updateData: { title: "Any Title" },
        });
        expect(result).toBeNull();
    });
    it("обновляет несколько полей", async () => {
        const zone = await Zone.create({ title: "101-1", bar: 10110, sector: 0 });
        const result = await updateZoneByIdUtil({
            id: zone._id.toString(),
            updateData: { title: "101-2", sector: 5 },
        });
        expect(result).toBeTruthy();
        expect(result?.title).toBe("101-2");
        expect(result?.sector).toBe(5);
    });
});
