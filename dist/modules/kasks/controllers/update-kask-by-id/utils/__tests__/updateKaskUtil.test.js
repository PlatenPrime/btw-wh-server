import { beforeEach, describe, expect, it } from "vitest";
import { Kask } from "../../../../models/Kask.js";
import { updateKaskUtil } from "../updateKaskUtil.js";
describe("updateKaskUtil", () => {
    beforeEach(async () => {
        await Kask.deleteMany({});
    });
    it("returns null when kask not found", async () => {
        const result = await updateKaskUtil("000000000000000000000000", {
            zone: "B2",
        });
        expect(result).toBeNull();
    });
    it("updates only provided fields and returns updated document", async () => {
        const kask = await Kask.create({
            artikul: "1234-5678",
            nameukr: "Старе ім'я",
            zone: "A1",
            quant: 5,
            com: "Старий коментар",
        });
        const result = await updateKaskUtil(String(kask._id), {
            nameukr: "Нове ім'я",
            quant: 10,
        });
        expect(result?.nameukr).toBe("Нове ім'я");
        expect(result?.quant).toBe(10);
        expect(result?.artikul).toBe("1234-5678");
        expect(result?.zone).toBe("A1");
        expect(result?.com).toBe("Старий коментар");
        const found = await Kask.findById(kask._id);
        expect(found?.nameukr).toBe("Нове ім'я");
        expect(found?.quant).toBe(10);
    });
    it("updates zone and com", async () => {
        const kask = await Kask.create({
            artikul: "9999-0001",
            nameukr: "Товар",
            zone: "A1",
        });
        const result = await updateKaskUtil(String(kask._id), {
            zone: "C3",
            com: "Оновлено",
        });
        expect(result?.zone).toBe("C3");
        expect(result?.com).toBe("Оновлено");
    });
});
