import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchBtradeDataUtil } from "../fetchBtradeDataUtil.js";
import * as utils from "../../../../../../utils/index.js";
describe("fetchBtradeDataUtil", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
    });
    it("возвращает данные товара", async () => {
        // Mock getSharikStockData
        const mockData = {
            nameukr: "Тест товар",
            price: 100,
            quantity: 10,
        };
        vi.spyOn(utils, "getSharikStockData").mockResolvedValue(mockData);
        const result = await fetchBtradeDataUtil("TEST-ARTIKUL");
        expect(result).toEqual(mockData);
    });
    it("возвращает null если товар не найден", async () => {
        vi.spyOn(utils, "getSharikStockData").mockResolvedValue(null);
        const result = await fetchBtradeDataUtil("NONEXISTENT");
        expect(result).toBeNull();
    });
    it("прокидывает ошибку при ошибке API", async () => {
        const error = new Error("API error");
        vi.spyOn(utils, "getSharikStockData").mockRejectedValue(error);
        await expect(fetchBtradeDataUtil("ERROR-ARTIKUL")).rejects.toThrow("API error");
    });
});
