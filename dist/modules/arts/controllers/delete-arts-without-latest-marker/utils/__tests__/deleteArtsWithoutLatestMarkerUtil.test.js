import { beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { createTestArt } from "../../../../../../test/setup.js";
import { deleteArtsWithoutLatestMarkerUtil } from "../deleteArtsWithoutLatestMarkerUtil.js";
describe("deleteArtsWithoutLatestMarkerUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("удаляет артикулы без маркера когда есть артикулы с маркером", async () => {
        // Создаем артикулы с маркером
        await createTestArt({
            artikul: "ART-WITH-MARKER-001",
            zone: "A1",
            marker: "20251123",
        });
        await createTestArt({
            artikul: "ART-WITH-MARKER-002",
            zone: "A2",
            marker: "20251123",
        });
        // Создаем артикулы без маркера
        await createTestArt({
            artikul: "ART-NO-MARKER-001",
            zone: "B1",
            marker: undefined,
        });
        await createTestArt({
            artikul: "ART-NO-MARKER-002",
            zone: "B2",
            marker: null,
        });
        const result = await deleteArtsWithoutLatestMarkerUtil();
        expect(result.latestMarker).toBe("20251123");
        expect(result.deletedCount).toBe(2);
        // Проверяем, что артикулы с маркером остались
        const Art = mongoose.model("Art");
        const remainingArts = await Art.find({});
        expect(remainingArts).toHaveLength(2);
        expect(remainingArts.map((a) => a.artikul)).toContain("ART-WITH-MARKER-001");
        expect(remainingArts.map((a) => a.artikul)).toContain("ART-WITH-MARKER-002");
    });
    it("удаляет артикулы с маркером меньше максимального", async () => {
        // Создаем артикулы с разными маркерами
        await createTestArt({
            artikul: "ART-LATEST",
            zone: "A1",
            marker: "20251123", // самый последний
        });
        await createTestArt({
            artikul: "ART-OLD-001",
            zone: "A2",
            marker: "20251120", // старый маркер
        });
        await createTestArt({
            artikul: "ART-OLD-002",
            zone: "A3",
            marker: "20251121", // старый маркер
        });
        const result = await deleteArtsWithoutLatestMarkerUtil();
        expect(result.latestMarker).toBe("20251123");
        expect(result.deletedCount).toBe(2);
        // Проверяем, что остался только артикул с последним маркером
        const Art = mongoose.model("Art");
        const remainingArts = await Art.find({});
        expect(remainingArts).toHaveLength(1);
        expect(remainingArts[0].artikul).toBe("ART-LATEST");
    });
    it("удаляет артикулы с пустым маркером", async () => {
        await createTestArt({
            artikul: "ART-WITH-MARKER",
            zone: "A1",
            marker: "20251123",
        });
        // Создаем артикул с пустой строкой в качестве маркера
        const Art = mongoose.model("Art");
        await Art.create({
            artikul: "ART-EMPTY-MARKER",
            zone: "B1",
            marker: "",
        });
        const result = await deleteArtsWithoutLatestMarkerUtil();
        expect(result.latestMarker).toBe("20251123");
        expect(result.deletedCount).toBe(1);
        // Проверяем, что артикул с пустым маркером удален
        const remainingArts = await Art.find({});
        expect(remainingArts).toHaveLength(1);
        expect(remainingArts[0].artikul).toBe("ART-WITH-MARKER");
    });
    it("удаляет артикулы где маркер отсутствует в документе", async () => {
        await createTestArt({
            artikul: "ART-WITH-MARKER",
            zone: "A1",
            marker: "20251123",
        });
        // Создаем артикул без поля marker вообще
        const Art = mongoose.model("Art");
        await Art.create({
            artikul: "ART-NO-FIELD",
            zone: "B1",
            // marker не указан
        });
        const result = await deleteArtsWithoutLatestMarkerUtil();
        expect(result.latestMarker).toBe("20251123");
        expect(result.deletedCount).toBe(1);
        // Проверяем, что артикул без поля marker удален
        const remainingArts = await Art.find({});
        expect(remainingArts).toHaveLength(1);
        expect(remainingArts[0].artikul).toBe("ART-WITH-MARKER");
    });
    it("комбинирует все условия удаления", async () => {
        // Создаем артикул с последним маркером
        await createTestArt({
            artikul: "ART-LATEST",
            zone: "A1",
            marker: "20251123",
        });
        // Артикулы для удаления:
        // 1. Без маркера (null)
        await createTestArt({
            artikul: "ART-NULL",
            zone: "B1",
            marker: null,
        });
        // 2. С пустым маркером
        const Art = mongoose.model("Art");
        await Art.create({
            artikul: "ART-EMPTY",
            zone: "B2",
            marker: "",
        });
        // 3. Без поля marker
        await Art.create({
            artikul: "ART-NO-FIELD",
            zone: "B3",
        });
        // 4. Со старым маркером
        await createTestArt({
            artikul: "ART-OLD",
            zone: "B4",
            marker: "20251120",
        });
        const result = await deleteArtsWithoutLatestMarkerUtil();
        expect(result.latestMarker).toBe("20251123");
        expect(result.deletedCount).toBe(4);
        // Проверяем, что остался только артикул с последним маркером
        const remainingArts = await Art.find({});
        expect(remainingArts).toHaveLength(1);
        expect(remainingArts[0].artikul).toBe("ART-LATEST");
    });
    it("возвращает deletedCount: 0 и latestMarker: null когда нет артикулов в базе", async () => {
        const result = await deleteArtsWithoutLatestMarkerUtil();
        expect(result.deletedCount).toBe(0);
        expect(result.latestMarker).toBeNull();
    });
    it("возвращает deletedCount: 0 и latestMarker: null когда нет артикулов с маркерами", async () => {
        // Создаем артикулы без маркеров
        await createTestArt({
            artikul: "ART-001",
            zone: "A1",
            marker: undefined,
        });
        await createTestArt({
            artikul: "ART-002",
            zone: "A2",
            marker: null,
        });
        const result = await deleteArtsWithoutLatestMarkerUtil();
        expect(result.deletedCount).toBe(0);
        expect(result.latestMarker).toBeNull();
    });
    it("не удаляет артикулы с максимальным маркером", async () => {
        // Создаем несколько артикулов с одинаковым максимальным маркером
        await createTestArt({
            artikul: "ART-001",
            zone: "A1",
            marker: "20251123",
        });
        await createTestArt({
            artikul: "ART-002",
            zone: "A2",
            marker: "20251123",
        });
        await createTestArt({
            artikul: "ART-003",
            zone: "A3",
            marker: "20251123",
        });
        // Создаем артикулы со старыми маркерами
        await createTestArt({
            artikul: "ART-OLD-001",
            zone: "B1",
            marker: "20251120",
        });
        const result = await deleteArtsWithoutLatestMarkerUtil();
        expect(result.latestMarker).toBe("20251123");
        expect(result.deletedCount).toBe(1); // Удален только старый
        // Проверяем, что все артикулы с максимальным маркером остались
        const Art = mongoose.model("Art");
        const remainingArts = await Art.find({});
        expect(remainingArts).toHaveLength(3);
        expect(remainingArts.map((a) => a.artikul)).toContain("ART-001");
        expect(remainingArts.map((a) => a.artikul)).toContain("ART-002");
        expect(remainingArts.map((a) => a.artikul)).toContain("ART-003");
    });
    it("правильно определяет максимальный маркер среди разных значений", async () => {
        // Создаем артикулы с разными маркерами
        await createTestArt({
            artikul: "ART-001",
            zone: "A1",
            marker: "20251120",
        });
        await createTestArt({
            artikul: "ART-002",
            zone: "A2",
            marker: "20251125", // максимальный
        });
        await createTestArt({
            artikul: "ART-003",
            zone: "A3",
            marker: "20251123",
        });
        await createTestArt({
            artikul: "ART-004",
            zone: "A4",
            marker: "20251121",
        });
        const result = await deleteArtsWithoutLatestMarkerUtil();
        expect(result.latestMarker).toBe("20251125");
        expect(result.deletedCount).toBe(3); // Удалены все кроме ART-002
        // Проверяем, что остался только артикул с максимальным маркером
        const Art = mongoose.model("Art");
        const remainingArts = await Art.find({});
        expect(remainingArts).toHaveLength(1);
        expect(remainingArts[0].artikul).toBe("ART-002");
    });
    it("обрабатывает маркеры в формате YYYYMMDD корректно", async () => {
        // Создаем артикулы с маркерами в формате даты
        await createTestArt({
            artikul: "ART-2025-11-20",
            zone: "A1",
            marker: "20251120",
        });
        await createTestArt({
            artikul: "ART-2025-11-23",
            zone: "A2",
            marker: "20251123", // максимальный
        });
        await createTestArt({
            artikul: "ART-2025-11-21",
            zone: "A3",
            marker: "20251121",
        });
        const result = await deleteArtsWithoutLatestMarkerUtil();
        expect(result.latestMarker).toBe("20251123");
        expect(result.deletedCount).toBe(2);
        // Проверяем, что остался только артикул с последним маркером
        const Art = mongoose.model("Art");
        const remainingArts = await Art.find({});
        expect(remainingArts).toHaveLength(1);
        expect(remainingArts[0].artikul).toBe("ART-2025-11-23");
    });
});
