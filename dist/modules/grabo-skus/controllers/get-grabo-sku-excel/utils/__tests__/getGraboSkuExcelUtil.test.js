import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it } from "vitest";
import { GraboSku } from "../../../../models/GraboSku.js";
import { getGraboSkuExcelUtil } from "../getGraboSkuExcelUtil.js";
describe("getGraboSkuExcelUtil", () => {
    beforeEach(async () => {
        await GraboSku.deleteMany({});
    });
    it("exports all documents sorted by productId", async () => {
        await GraboSku.create([
            {
                title: "B",
                productId: "GB",
                url: "https://www.grabo-balloons.com/en/gb-balloon-b",
                lastSeenAt: new Date("2026-08-15T00:00:00.000Z"),
            },
            {
                title: "A",
                productId: "GA",
                url: "https://www.grabo-balloons.com/en/ga-balloon-a",
                lastSeenAt: new Date("2026-08-15T00:00:00.000Z"),
            },
        ]);
        const { buffer, fileName } = await getGraboSkuExcelUtil();
        expect(fileName).toBe("graboskus.xlsx");
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        const sheet = wb.getWorksheet("GraboSku");
        expect(sheet.getRow(2).getCell(1).value).toBe("GA");
        expect(sheet.getRow(3).getCell(1).value).toBe("GB");
    });
});
