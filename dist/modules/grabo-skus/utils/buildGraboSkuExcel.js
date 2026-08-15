import ExcelJS from "exceljs";
import { applyDataRowStyle, applyHeaderStyle, } from "../../../lib/excel/worksheetStyles.js";
import { GRABO_SKU_EXCEL_COLUMNS } from "../constants/graboSkuExcelColumns.js";
function joinList(values) {
    return values.join("; ");
}
function toIso(value) {
    return value instanceof Date ? value.toISOString() : "";
}
export async function buildGraboSkuExcelBuffer(rows) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("GraboSku");
    const columnCount = GRABO_SKU_EXCEL_COLUMNS.length;
    const headerRow = sheet.getRow(1);
    GRABO_SKU_EXCEL_COLUMNS.forEach((label, i) => {
        headerRow.getCell(i + 1).value = label;
    });
    applyHeaderStyle(sheet, columnCount);
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const excelRow = sheet.getRow(r + 2);
        excelRow.getCell(1).value = row.productId;
        excelRow.getCell(2).value = row.title;
        excelRow.getCell(3).value = row.url;
        excelRow.getCell(4).value = row.isNewProduct;
        excelRow.getCell(5).value = row.color;
        excelRow.getCell(6).value = row.size;
        excelRow.getCell(7).value = row.material;
        excelRow.getCell(8).value = row.gas;
        excelRow.getCell(9).value = row.language;
        excelRow.getCell(10).value = row.gasCapacity;
        excelRow.getCell(11).value = joinList(row.tags);
        excelRow.getCell(12).value = joinList(row.images);
        excelRow.getCell(13).value = row.isOnSite;
        excelRow.getCell(14).value = toIso(row.lastSeenAt);
        excelRow.getCell(15).value = toIso(row.createdAt);
        excelRow.getCell(16).value = toIso(row.updatedAt);
        applyDataRowStyle(sheet, r + 2, columnCount);
    }
    for (let c = 1; c <= columnCount; c++) {
        sheet.getColumn(c).width = 18;
    }
    const buf = await workbook.xlsx.writeBuffer();
    return {
        buffer: Buffer.from(buf),
        fileName: "graboskus.xlsx",
    };
}
