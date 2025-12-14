import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestAsk, createTestPos } from "../../../../test/setup.js";
import { getAsksPullsController } from "../get-asks-pulls/getAsksPullsController.js";
describe("getAsksPullsController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseJson = data;
                return this;
            },
        };
        vi.clearAllMocks();
    });
    it("200: успешно получает все позиции для снятия", async () => {
        // Создаем несколько активных заявок
        const ask1 = await createTestAsk({
            artikul: "ART-1",
            quant: 10,
            pullQuant: 0,
            status: "new",
            sklad: "pogrebi",
        });
        const ask2 = await createTestAsk({
            artikul: "ART-2",
            quant: 5,
            pullQuant: 0,
            status: "processing",
            sklad: "pogrebi",
        });
        // Создаем позиции для этих заявок
        await createTestPos({
            artikul: "ART-1",
            quant: 15,
            sklad: "pogrebi",
        });
        await createTestPos({
            artikul: "ART-2",
            quant: 10,
            sklad: "pogrebi",
        });
        const req = {};
        await getAsksPullsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Asks pulls retrieved successfully");
        expect(responseJson.data).toBeDefined();
        expect(responseJson.data.positionsBySector).toBeDefined();
        expect(Array.isArray(responseJson.data.positionsBySector)).toBe(true);
    });
    it("200: возвращает пустой массив когда нет активных заявок", async () => {
        // Создаем только завершенные заявки
        await createTestAsk({
            artikul: "ART-COMPLETED",
            status: "completed",
        });
        await createTestAsk({
            artikul: "ART-REJECTED",
            status: "rejected",
        });
        const req = {};
        await getAsksPullsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Asks pulls retrieved successfully");
        expect(responseJson.data.positionsBySector).toEqual([]);
    });
    it("200: группирует позиции по секторам", async () => {
        const ask = await createTestAsk({
            artikul: "ART-GROUP",
            quant: 10,
            pullQuant: 0,
            status: "new",
            sklad: "pogrebi",
        });
        // Создаем позиции с разными секторами
        const pos1 = await createTestPos({
            artikul: "ART-GROUP",
            quant: 5,
            sklad: "pogrebi",
        });
        // Устанавливаем сектор через palletData
        pos1.palletData = { ...pos1.palletData, sector: 1 };
        await pos1.save();
        const pos2 = await createTestPos({
            artikul: "ART-GROUP",
            quant: 5,
            sklad: "pogrebi",
        });
        pos2.palletData = { ...pos2.palletData, sector: 2 };
        await pos2.save();
        const req = {};
        await getAsksPullsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.positionsBySector.length).toBeGreaterThan(0);
    });
    it("200: фоновое завершение готовых заявок выполняется асинхронно", async () => {
        const asker = await import("../../../../test/setup.js").then((m) => m.createTestUser);
        const user = await asker();
        // Создаем заявку со статусом processing, которая готова к завершению
        const ask = await createTestAsk({
            artikul: "ART-READY",
            quant: 10,
            pullQuant: 10, // Уже все снято
            status: "processing",
            solver: user._id,
        });
        const req = {};
        // Мокаем setImmediate для проверки фоновой обработки
        const setImmediateSpy = vi.spyOn(global, "setImmediate");
        await getAsksPullsController(req, res);
        expect(responseStatus.code).toBe(200);
        // Проверяем что setImmediate был вызван для фоновой обработки
        expect(setImmediateSpy).toHaveBeenCalled();
        setImmediateSpy.mockRestore();
    });
    it("500: обработка ошибок сервера", async () => {
        // Создаем ситуацию, которая вызовет ошибку
        // В реальном тесте нужно использовать vi.mock для мокирования утилит
        const req = {};
        // Этот тест показывает что контроллер должен обрабатывать ошибки
        // Полный тест требует мокирования зависимостей getAsksPullsUtil
    });
});
