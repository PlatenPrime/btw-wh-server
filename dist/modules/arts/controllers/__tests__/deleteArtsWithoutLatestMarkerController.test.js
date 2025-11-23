import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteArtsWithoutLatestMarkerController } from "../delete-arts-without-latest-marker/deleteArtsWithoutLatestMarkerController.js";
import { deleteArtsWithoutLatestMarkerUtil } from "../delete-arts-without-latest-marker/utils/deleteArtsWithoutLatestMarkerUtil.js";
// Мокаем утилиту
vi.mock("../delete-arts-without-latest-marker/utils/deleteArtsWithoutLatestMarkerUtil.js");
describe("deleteArtsWithoutLatestMarkerController", () => {
    let res;
    let responseJson;
    let responseStatus;
    let headersSent;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        headersSent = false;
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseJson = data;
                return this;
            },
            headersSent: false,
        };
        // Очищаем моки перед каждым тестом
        vi.clearAllMocks();
    });
    it("200: успешно удаляет артикулы без последнего маркера", async () => {
        const mockResult = {
            deletedCount: 5,
            latestMarker: "20251123",
        };
        vi.mocked(deleteArtsWithoutLatestMarkerUtil).mockResolvedValue(mockResult);
        const req = {};
        await deleteArtsWithoutLatestMarkerController(req, res);
        expect(deleteArtsWithoutLatestMarkerUtil).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Arts without latest marker deleted successfully");
        expect(responseJson.result.deletedCount).toBe(5);
        expect(responseJson.result.latestMarker).toBe("20251123");
    });
    it("200: возвращает 0 удаленных артикулов когда нет артикулов для удаления", async () => {
        const mockResult = {
            deletedCount: 0,
            latestMarker: "20251123",
        };
        vi.mocked(deleteArtsWithoutLatestMarkerUtil).mockResolvedValue(mockResult);
        const req = {};
        await deleteArtsWithoutLatestMarkerController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.result.deletedCount).toBe(0);
        expect(responseJson.result.latestMarker).toBe("20251123");
    });
    it("200: возвращает null для latestMarker когда маркеров нет в базе", async () => {
        const mockResult = {
            deletedCount: 0,
            latestMarker: null,
        };
        vi.mocked(deleteArtsWithoutLatestMarkerUtil).mockResolvedValue(mockResult);
        const req = {};
        await deleteArtsWithoutLatestMarkerController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.result.deletedCount).toBe(0);
        expect(responseJson.result.latestMarker).toBeNull();
    });
    it("500: обрабатывает ошибку сервера", async () => {
        const mockError = new Error("Database connection error");
        vi.mocked(deleteArtsWithoutLatestMarkerUtil).mockRejectedValue(mockError);
        // Мокаем process.env для проверки ошибки в development
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "development";
        const req = {};
        await deleteArtsWithoutLatestMarkerController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
        // Восстанавливаем оригинальный NODE_ENV
        process.env.NODE_ENV = originalEnv;
    });
    it("500: не показывает детали ошибки в production", async () => {
        const mockError = new Error("Database connection error");
        vi.mocked(deleteArtsWithoutLatestMarkerUtil).mockRejectedValue(mockError);
        // Мокаем process.env для проверки ошибки в production
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        const req = {};
        await deleteArtsWithoutLatestMarkerController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeUndefined();
        // Восстанавливаем оригинальный NODE_ENV
        process.env.NODE_ENV = originalEnv;
    });
    it("500: не отправляет ответ если headers уже отправлены", async () => {
        const mockError = new Error("Database connection error");
        vi.mocked(deleteArtsWithoutLatestMarkerUtil).mockRejectedValue(mockError);
        let jsonCalled = false;
        const resWithHeadersSent = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                jsonCalled = true;
                responseJson = data;
                return this;
            },
            headersSent: true,
        };
        const req = {};
        await deleteArtsWithoutLatestMarkerController(req, resWithHeadersSent);
        // Проверяем, что json не был вызван (так как headers уже отправлены)
        expect(jsonCalled).toBe(false);
    });
});
