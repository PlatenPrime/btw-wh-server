import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { GRABO_SKU_EXCEL_COLUMNS } from "../../constants/graboSkuExcelColumns.js";
import { buildGraboSkuExcelBuffer } from "../buildGraboSkuExcel.js";
describe("buildGraboSkuExcelBuffer", () => {
    it("writes camelCase headers and all model fields except mongo id", async () => {
        const lastSeenAt = new Date("2026-08-15T10:00:00.000Z");
        const createdAt = new Date("2026-08-01T00:00:00.000Z");
        const updatedAt = new Date("2026-08-15T11:00:00.000Z");
        const { buffer, fileName } = await buildGraboSkuExcelBuffer([
            {
                productId: "G1",
                title: "Bow",
                url: "https://www.grabo-balloons.com/en/g1-balloon-bow",
                isNewProduct: true,
                color: "Pink",
                size: "M",
                material: "Foil",
                gas: "Helium",
                language: "No text",
                gasCapacity: "air only",
                tags: ["Girl", "Party"],
                images: ["https://img/a.jpg", "https://img/b.jpg"],
                isOnSite: false,
                lastSeenAt,
                createdAt,
                updatedAt,
            },
        ]);
        expect(fileName).toBe("graboskus.xlsx");
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        const sheet = wb.getWorksheet("GraboSku");
        expect(sheet).toBeDefined();
        for (let i = 0; i < GRABO_SKU_EXCEL_COLUMNS.length; i++) {
            expect(sheet.getRow(1).getCell(i + 1).value).toBe(GRABO_SKU_EXCEL_COLUMNS[i]);
        }
        const data = sheet.getRow(2);
        expect(data.getCell(1).value).toBe("G1");
        expect(data.getCell(4).value).toBe(true);
        expect(data.getCell(11).value).toBe("Girl; Party");
        expect(data.getCell(12).value).toBe("https://img/a.jpg; https://img/b.jpg");
        expect(data.getCell(13).value).toBe(false);
        expect(data.getCell(14).value).toBe(lastSeenAt.toISOString());
        expect(data.getCell(15).value).toBe(createdAt.toISOString());
    });
});
