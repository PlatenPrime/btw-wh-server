import { describe, expect, it, vi } from "vitest";
import { getGraboSkuExcelController } from "../getGraboSkuExcelController.js";
import { getGraboSkuExcelUtil } from "../utils/getGraboSkuExcelUtil.js";
vi.mock("../utils/getGraboSkuExcelUtil.js", () => ({
    getGraboSkuExcelUtil: vi.fn(),
}));
describe("getGraboSkuExcelController", () => {
    it("sends xlsx attachment", async () => {
        const buffer = Buffer.from("xlsx");
        vi.mocked(getGraboSkuExcelUtil).mockResolvedValue({
            buffer,
            fileName: "graboskus.xlsx",
        });
        const setHeader = vi.fn();
        const status = vi.fn().mockReturnThis();
        const send = vi.fn();
        const res = { setHeader, status, send };
        await getGraboSkuExcelController({}, res);
        expect(setHeader).toHaveBeenCalledWith("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        expect(setHeader).toHaveBeenCalledWith("Content-Disposition", 'attachment; filename="graboskus.xlsx"');
        expect(status).toHaveBeenCalledWith(200);
        expect(send).toHaveBeenCalledWith(buffer);
    });
});
