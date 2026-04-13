import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../../konks/models/Konk.js";
import { Sku } from "../../../../models/Sku.js";
import { SKU_EXCEL_ALL_KONKS } from "../../../../constants/skuExcelKonkAll.js";
import { getKonkInvalidExcelUtil } from "../getKonkInvalidExcelUtil.js";
describe("getKonkInvalidExcelUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Konk.deleteMany({});
    });
    it("writes Konk.title column for a single konk", async () => {
        await Konk.create({
            name: "air",
            title: "Air Shop",
            url: "https://air.example",
            imageUrl: "https://air.example/i.png",
        });
        await Sku.create({
            konkName: "air",
            prodName: "p",
            productId: "air-x-1",
            title: "Bad",
            url: "https://ex.com/bad1",
            isInvalid: true,
        });
        const { buffer } = await getKonkInvalidExcelUtil("air");
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        const sheet = wb.getWorksheet("SKU");
        expect(sheet).toBeDefined();
        expect(sheet.getRow(1).getCell(3).value).toBe("Конкурент (назва)");
        expect(sheet.getRow(2).getCell(2).value).toBe("air");
        expect(sheet.getRow(2).getCell(3).value).toBe("Air Shop");
    });
    it("when konkName is all, includes invalid skus for every konk with titles", async () => {
        await Konk.create({
            name: "air",
            title: "Air Shop",
            url: "https://air.example",
            imageUrl: "https://air.example/i.png",
        });
        await Konk.create({
            name: "rozetka",
            title: "Rozetka UA",
            url: "https://roz.example",
            imageUrl: "https://roz.example/i.png",
        });
        await Sku.create({
            konkName: "rozetka",
            prodName: "p",
            productId: "roz-x-1",
            title: "Zebra",
            url: "https://ex.com/r1",
            isInvalid: true,
        });
        await Sku.create({
            konkName: "air",
            prodName: "p",
            productId: "air-x-2",
            title: "Alpha",
            url: "https://ex.com/a2",
            isInvalid: true,
        });
        await Sku.create({
            konkName: "air",
            prodName: "p",
            productId: "air-ok",
            title: "Ok",
            url: "https://ex.com/ok",
            isInvalid: false,
        });
        const { buffer, fileName } = await getKonkInvalidExcelUtil(SKU_EXCEL_ALL_KONKS);
        expect(fileName).toContain("all");
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        const sheet = wb.getWorksheet("SKU");
        expect(sheet.rowCount).toBe(3);
        expect(sheet.getRow(2).getCell(2).value).toBe("air");
        expect(sheet.getRow(2).getCell(3).value).toBe("Air Shop");
        expect(sheet.getRow(2).getCell(5).value).toBe("Alpha");
        expect(sheet.getRow(3).getCell(2).value).toBe("rozetka");
        expect(sheet.getRow(3).getCell(3).value).toBe("Rozetka UA");
        expect(sheet.getRow(3).getCell(5).value).toBe("Zebra");
    });
});
